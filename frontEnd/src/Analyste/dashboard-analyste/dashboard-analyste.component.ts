// dashboard-analyste.component.ts
import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  CreditService, Client, CreditApplication,
  CreditStatus, KPIs, MonthlyStat
} from '../../services/credit.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { HttpClient } from '@angular/common/http';

type View = 'dashboard' | 'applications' | 'scoring';

// ── Interfaces spécifiques analyste ──────────────────────────────
export interface RiskKPIs {
  averageScore: number;
  trendScore: number;
  highRiskCount: number;
  lowRiskCount: number;
  pendingAnalysis: number;
  iaSuggested: number;
}

export interface RiskDistribution {
  high: number;
  medium: number;
  low: number;
}

export interface RiskTrendPoint {
  month: string;
  value: number;
}

export interface RiskFactor {
  name: string;
  impact: number;
}

@Component({
  selector: 'app-dashboard-analyste',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-analyste.component.html',
  styleUrls: ['./dashboard-analyste.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardAnalysteComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ── UI ──
  sidebarCollapsed = false;
  currentView: View = 'dashboard';
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  showProfileModal = false;

  // ── Profil utilisateur ──
  currentUser: any = {
    _id: '', fullName: '', email: '', role: 'ANALYSTE', avatar: '', permissions: [], photoUrl: ''
  };

  // ── Data partagée ──
  clients: Client[] = [];
  applications: CreditApplication[] = [];
  filteredApplications: CreditApplication[] = [];

  // ── KPIs partagés ──
  kpis: KPIs = {
    total: 0, pending: 0, analyzing: 0,
    accepted: 0, refused: 0, totalAmount: 0, approvalRate: 0
  };
  monthlyStats: MonthlyStat[] = [];
  maxMonthlyCount = 1;

  // ── KPIs risque (spécifique analyste) ──
  riskKpis: RiskKPIs = {
    averageScore: 0,
    trendScore: 0,
    highRiskCount: 0,
    lowRiskCount: 0,
    pendingAnalysis: 0,
    iaSuggested: 0
  };

  riskDistribution: RiskDistribution = { high: 0, medium: 0, low: 0 };

  riskTrend: RiskTrendPoint[] = [];

  // ── Filtres ──
  searchTerm = '';
  filterStatus = 'ALL';
  filterAmount = 'ALL';
  riskFilter = 'ALL';

  // ── Modals ──
  selectedApplication: CreditApplication | null = null;
  showStatusModal = false;
  statusUpdateTarget: CreditApplication | null = null;
  pendingStatus: CreditStatus = 'EN_ANALYSE';
  statusComment = '';
  newCommentText = '';

  // ── Scoring ──
  scoringTarget: CreditApplication | null = null;
  topPriorityApp: CreditApplication | null = null;

  // ── Sidebar items ──
  readonly sidebarItems: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'applications', label: 'Dossiers à analyser', icon: '📋' },
    { id: 'scoring', label: 'Scoring risque', icon: '🎯' }
  ];

  // ── Référence Math pour le template ──
  readonly abs = Math.abs;

  // ✅ Plafond BCT Tunisie exposé pour le template
  readonly MAX_DEBT_RATIO = 40;

  constructor(
    public creditService: CreditService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private adminService: AdminService,
    private http: HttpClient,
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.subscribeToData();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ──────────────────────────────────────────
  //  Utilisateur courant
  // ──────────────────────────────────────────

  loadCurrentUser(): void {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch {
        // ignore
      }
    }
  }

  // ──────────────────────────────────────────
  //  Souscriptions aux données
  // ──────────────────────────────────────────

  subscribeToData(): void {
    this.creditService.clients$.pipe(takeUntil(this.destroy$)).subscribe(c => {
      this.clients = c;
      this.cdr.markForCheck();
    });

    this.creditService.applications$.pipe(takeUntil(this.destroy$)).subscribe(a => {
      // ✅ Normaliser clientId une seule fois dès réception
      this.applications = a.map(app => ({
        ...app,
        clientId: typeof app.clientId === 'object'
          ? (app.clientId as any)?._id
          : app.clientId,
        clientName: app.clientName || (app.clientId as any)?.fullName || '',
      }));
      this.applyFilters();
      this.computeRiskKpis();
      this.cdr.markForCheck();
    });

    this.creditService.kpis$.pipe(takeUntil(this.destroy$)).subscribe(k => {
      this.kpis = k;
      this.cdr.markForCheck();
    });

    this.creditService.monthlyStats$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.monthlyStats = s;
      this.maxMonthlyCount = Math.max(...s.map(x => x.count), 1);
      this.cdr.markForCheck();
    });

    this.creditService.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => {
      this.loading = l;
      this.cdr.markForCheck();
    });
  }
  // ──────────────────────────────────────────
  //  Calcul des KPIs risque (analyste)
  // ──────────────────────────────────────────

  computeRiskKpis(): void {
    const scores = this.applications.map(a => this.getRiskScore(a));
    const total = scores.length;

    if (total === 0) {
      this.riskKpis = {
        averageScore: 0, trendScore: 0, highRiskCount: 0,
        lowRiskCount: 0, pendingAnalysis: 0, iaSuggested: 0
      };
      this.riskDistribution = { high: 0, medium: 0, low: 0 };
      this.riskTrend = [];
      this.topPriorityApp = null;
      return;
    }

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
    const highCount = scores.filter(s => s > 75).length;
    const lowCount = scores.filter(s => s < 35).length;
    const pending = this.applications.filter(a =>
      a.status === 'EN_ATTENTE' || a.status === 'EN_ANALYSE'
    ).length;

    this.riskKpis = {
      averageScore: avg,
      trendScore: this.computeTrend(),
      highRiskCount: highCount,
      lowRiskCount: lowCount,
      pendingAnalysis: pending,
      iaSuggested: Math.floor(pending * 0.4)
    };

    this.riskDistribution = {
      high: total > 0 ? Math.round(highCount / total * 100) : 0,
      medium: total > 0 ? Math.round((total - highCount - lowCount) / total * 100) : 0,
      low: total > 0 ? Math.round(lowCount / total * 100) : 0
    };

    this.computeRiskTrend();

    // Dossier prioritaire = haut score EN_ATTENTE ou EN_ANALYSE
    const active = this.applications
      .filter(a => a.status === 'EN_ATTENTE' || a.status === 'EN_ANALYSE')
      .sort((a, b) => this.getRiskScore(b) - this.getRiskScore(a));
    this.topPriorityApp = active[0] ?? null;
  }

  private computeTrend(): number {
    if (this.monthlyStats.length < 2) return 0;
    const last = this.monthlyStats[this.monthlyStats.length - 1];
    const prev = this.monthlyStats[this.monthlyStats.length - 2];
    return last.count - prev.count;
  }

  private computeRiskTrend(): void {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    const base = this.riskKpis.averageScore;
    this.riskTrend = months.map((month, i) => ({
      month,
      value: Math.min(100, Math.max(10, base + (i - 2) * 3 + Math.floor(Math.random() * 5)))
    }));
  }

  // ──────────────────────────────────────────
  //  Score de risque (calculé dynamiquement)
  // ──────────────────────────────────────────
  hasAiFinancialData(app: CreditApplication | null): boolean {
    return !!(app as any)?.aiFinancialData;
  }

  getAiFinancialData(app: CreditApplication | null): any {
    return (app as any)?.aiFinancialData || {};
  }
  /**
   * Calcule un score de risque 0-100 basé sur les données financières du client.
   * Score élevé = risque élevé.
   *
   * Formule adaptée au contexte tunisien (plafond BCT 40%) :
   *   - Taux d'endettement > 40% → +35 pts  ✅ seuil BCT
   *   - Taux d'endettement 30-40% → +20 pts
   *   - Taux d'endettement 20-30% → +10 pts
   *   - Montant > 100k TND → +15 pts
   *   - Montant 50-100k TND → +10 pts
   *   - Durée > 240 mois → +10 pts
   *   - Revenus < 1500 TND → +15 pts
   *   - Charges > 50% revenus → +10 pts
   *   - Mensualités existantes > 0 → +5 pts  ✅ existingLoanPayments
   */
  getRiskScore(app: CreditApplication): number {
    const client = this.clients.find(c => c._id === app.clientId);
    let score = 40; // base neutre

    if (client) {
      const debtRatio = this.creditService.calculateDebtRatio(client, app.monthlyPayment);

      // ✅ Seuils alignés sur le plafond BCT Tunisie (40%)
      if (debtRatio > 40) score += 35;
      else if (debtRatio > 30) score += 20;
      else if (debtRatio > 20) score += 10;
      else score -= 10;

      if (client.revenue < 1500) score += 15;
      else if (client.revenue > 5000) score -= 10;

      if (client.monthlyCharges > client.revenue * 0.5) score += 10;

      // ✅ existingLoanPayments (mensualité réelle)
      if ((client.existingLoanPayments ?? 0) > 0) score += 5;
    }

    if (app.amount > 100000) score += 15;
    else if (app.amount > 50000) score += 10;
    else if (app.amount < 10000) score -= 5;

    if (app.duration > 240) score += 10;
    else if (app.duration < 24) score -= 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Retourne les facteurs de risque détaillés pour un dossier.
   * ✅ Seuils et libellés adaptés au contexte tunisien (TND, BCT 40%)
   */
  getRiskFactors(app: CreditApplication): RiskFactor[] {
    const client = this.clients.find(c => c._id === app.clientId);
    const factors: RiskFactor[] = [];

    if (client) {
      const debtRatio = this.creditService.calculateDebtRatio(client, app.monthlyPayment);

      // ✅ Seuil BCT 40%
      if (debtRatio > 40)
        factors.push({ name: `Taux endettement ${debtRatio}% (> plafond BCT 40%)`, impact: +35 });
      else if (debtRatio > 30)
        factors.push({ name: `Taux endettement ${debtRatio}% (zone d'alerte)`, impact: +20 });
      else
        factors.push({ name: `Taux endettement ${debtRatio}% (acceptable)`, impact: -10 });

      if (client.revenue < 1500)
        factors.push({ name: `Revenus faibles (${client.revenue} TND)`, impact: +15 }); // ✅ TND
      else if (client.revenue > 5000)
        factors.push({ name: `Revenus solides (${client.revenue} TND)`, impact: -10 }); // ✅ TND

      if (client.monthlyCharges > client.revenue * 0.5)
        factors.push({ name: 'Charges > 50% des revenus', impact: +10 });

      // ✅ existingLoanPayments (mensualité réelle)
      if ((client.existingLoanPayments ?? 0) > 0)
        factors.push({ name: `Mensualités existantes (${client.existingLoanPayments} TND/mois)`, impact: +5 });
    }

    if (app.amount > 100000)
      factors.push({ name: 'Montant élevé (> 100k TND)', impact: +15 }); // ✅ TND
    else if (app.amount > 50000)
      factors.push({ name: 'Montant modéré (> 50k TND)', impact: +10 }); // ✅ TND
    else if (app.amount < 10000)
      factors.push({ name: 'Faible montant (< 10k TND)', impact: -5 });  // ✅ TND

    if (app.duration > 240)
      factors.push({ name: 'Longue durée (> 20 ans)', impact: +10 });
    else if (app.duration < 24)
      factors.push({ name: 'Courte durée (< 2 ans)', impact: -5 });

    return factors;
  }

  // ──────────────────────────────────────────
  //  Filtres
  // ──────────────────────────────────────────

  applyFilters(): void {
    let result = [...this.applications];

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(a =>
        a.clientName.toLowerCase().includes(q) ||
        a.purpose.toLowerCase().includes(q)
      );
    }

    if (this.filterStatus !== 'ALL')
      result = result.filter(a => a.status === this.filterStatus);

    if (this.filterAmount === '0-10000')
      result = result.filter(a => a.amount < 10000);
    else if (this.filterAmount === '10000-50000')
      result = result.filter(a => a.amount >= 10000 && a.amount <= 50000);
    else if (this.filterAmount === '50000+')
      result = result.filter(a => a.amount > 50000);

    if (this.riskFilter === 'HIGH')
      result = result.filter(a => this.getRiskScore(a) > 75);
    else if (this.riskFilter === 'MEDIUM')
      result = result.filter(a => this.getRiskScore(a) >= 35 && this.getRiskScore(a) <= 75);
    else if (this.riskFilter === 'LOW')
      result = result.filter(a => this.getRiskScore(a) < 35);

    this.filteredApplications = result;
  }

  onSearchChange(): void { this.applyFilters(); }
  onFilterChange(): void { this.applyFilters(); }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
    this.filterAmount = 'ALL';
    this.riskFilter = 'ALL';
    this.applyFilters();
  }

  filterByStatus(status: string): void {
    this.filterStatus = status;
    this.applyFilters();
    this.setView('applications');
  }

  // ──────────────────────────────────────────
  //  Scoring view
  // ──────────────────────────────────────────

  selectForScoring(app: CreditApplication): void {
    this.scoringTarget = app;
    this.cdr.markForCheck();
  }

  getScoringList(): CreditApplication[] {
    return this.applications
      .filter(a => !this.isFinalStatus(a.status))
      .sort((a, b) => this.getRiskScore(b) - this.getRiskScore(a));
  }

  // ──────────────────────────────────────────
  //  Mise à jour statut (Analyste uniquement)
  // ──────────────────────────────────────────

  openStatusModal(app: CreditApplication): void {
    const allowed = this.getAllowedStatuses(app.status);
    if (allowed.length === 0) {
      this.showMessage('Aucune transition possible pour ce statut', 'error');
      return;
    }
    this.statusUpdateTarget = app;
    this.pendingStatus = allowed[0];
    this.statusComment = '';
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.statusUpdateTarget = null;
  }

  confirmStatusUpdate(): void {
    if (!this.statusUpdateTarget) return;

    // Cas : Prendre en charge
    if (
      this.statusUpdateTarget.status === 'EN_ATTENTE' &&
      this.pendingStatus === 'EN_ANALYSE'
    ) {
      this.loading = true;

      const client = this.clients.find(c => c._id === this.statusUpdateTarget!.clientId);

      if (!client) {
        this.loading = false;
        this.showMessage('Client introuvable pour ce dossier', 'error');
        return;
      }

      const payload = {
        application: {
          applicationId: this.statusUpdateTarget._id,
          clientId: this.statusUpdateTarget.clientId,
          clientName: this.statusUpdateTarget.clientName,
          amount: this.statusUpdateTarget.amount,
          duration: this.statusUpdateTarget.duration,
          monthlyPayment: this.statusUpdateTarget.monthlyPayment,
          purpose: this.statusUpdateTarget.purpose,
          documents: this.statusUpdateTarget.documents,
          aiFinancialData: (this.statusUpdateTarget as any).aiFinancialData
        },

        client: {
          fullName: client.fullName,
          cin: client.cin,
          email: client.email,
          phone: client.phone,
          birthDate: client.birthDate,
          gender: client.gender,
          employmentStatus: client.employmentStatus,
          city: client.city,
          address: client.address,
          profession: client.profession,
          employer: client.employer,
          revenue: client.revenue,
          monthlyCharges: client.monthlyCharges,
          existingLoanPayments: client.existingLoanPayments ?? 0
        }
      };
      this.http.post<any>(
        'http://localhost:5000/predict',
        payload
      ).subscribe({
        next: (result) => {

          const riskScore = result.risk_score;

          console.log('Score IA =', riskScore);

          this.creditService.updateStatus(
            this.statusUpdateTarget!._id,
            'EN_ANALYSE',
            this.currentUser.fullName || 'Analyste',
            `Score IA : ${riskScore}`
          ).subscribe({
            next: () => {
              this.loading = false;
              this.showMessage(
                `Dossier pris en charge - Score IA : ${riskScore}`,
                'success'
              );
              this.closeStatusModal();
            },
            error: err => {
              this.loading = false;
              this.showMessage(err.message, 'error');
            }
          });

        },
        error: err => {
          this.loading = false;
          this.showMessage(
            'Erreur communication avec le moteur IA',
            'error'
          );
          console.error(err);
        }
      });

      return;
    }

    // Code existant pour les autres statuts
  }

  getAllowedStatuses(current: CreditStatus): CreditStatus[] {
    return this.creditService.getAllowedTransitions(current, 'ANALYSTE');
  }

  canChangeStatus(app: CreditApplication): boolean {
    return !this.isFinalStatus(app.status) &&
      this.getAllowedStatuses(app.status).length > 0;
  }

  // ──────────────────────────────────────────
  //  Consultation dossier
  // ──────────────────────────────────────────

  viewApplication(app: CreditApplication): void {
    this.selectedApplication = app;
    this.cdr.markForCheck();
  }

  closeApplication(): void {
    this.selectedApplication = null;
    this.cdr.markForCheck();
  }

  // ── Validation document (Analyste) ──
  validateDocument(docId: string): void {
    if (!this.selectedApplication) return;
    this.creditService.validateDocument(
      this.selectedApplication._id, docId, this.currentUser.fullName || 'Analyste'
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.refreshSelected();
        this.showMessage('Document validé ✓', 'success');
        this.cdr.markForCheck();
      },
      error: e => this.showMessage(e.message, 'error')
    });
  }

  // ── Commentaires ──
  submitComment(): void {
    if (!this.newCommentText.trim() || !this.selectedApplication) return;
    this.creditService.addComment(
      this.selectedApplication._id,
      this.newCommentText,
      this.currentUser.fullName || 'Analyste'
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.newCommentText = '';
        this.refreshSelected();
        this.cdr.markForCheck();
      },
      error: e => this.showMessage(e.message, 'error')
    });
  }

  // ──────────────────────────────────────────
  //  Profil
  // ──────────────────────────────────────────

  openProfile(): void { this.showProfileModal = true; }
  closeProfileModal(): void { this.showProfileModal = false; }

  updateProfile(): void {
    this.adminService.updateProfile(this.currentUser).subscribe({
      next: () => {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.showMessage('Profil mis à jour ✓', 'success');
        this.closeProfileModal();
        this.cdr.markForCheck();
      },
      error: () => this.showMessage('Erreur mise à jour profil', 'error')
    });
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.currentUser.photoUrl = reader.result as string;
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(input.files[0]);
  }

  // ──────────────────────────────────────────
  //  Logout
  // ──────────────────────────────────────────

  confirmLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) this.logout();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.showMessage('Déconnexion réussie', 'success');
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  // ──────────────────────────────────────────
  //  Helpers
  // ──────────────────────────────────────────

  refreshSelected(): void {
    if (this.selectedApplication) {
      const updated = this.applications.find(a => a._id === this.selectedApplication!._id);
      if (updated) this.selectedApplication = { ...updated };
    }
  }

  setView(v: View): void {
    this.currentView = v;
    this.cdr.markForCheck();
  }

  getStatusLabel(s: string): string {
    return this.creditService.getStatusLabel(s);
  }

  getStatusClass(s: string): string {
    return ({
      EN_ATTENTE: 'status--pending',
      EN_ANALYSE: 'status--analyzing',
      ACCEPTE: 'status--accepted',
      REFUSE: 'status--refused'
    } as Record<string, string>)[s] ?? '';
  }

  getDocStatusLabel(s: string): string {
    return ({ EN_ATTENTE: 'En attente', VALIDE: 'Validé', REJETE: 'Rejeté' } as Record<string, string>)[s] ?? s;
  }

  getDocStatusClass(s: string): string {
    return ({ VALIDE: 'doc--valid', EN_ATTENTE: 'doc--pending', REJETE: 'doc--rejected' } as Record<string, string>)[s] ?? '';
  }

  getRiskLevelLabel(score: number): string {
    if (score > 75) return 'Haut risque';
    if (score >= 35) return 'Risque modéré';
    return 'Faible risque';
  }

  getRiskLevelClass(score: number): string {
    if (score > 75) return 'risk-level level-high';
    if (score >= 35) return 'risk-level level-medium';
    return 'risk-level level-low';
  }

  isFinalStatus(s: CreditStatus): boolean {
    return s === 'ACCEPTE' || s === 'REFUSE';
  }

  // ✅ existingLoanPayments (mensualité réelle)
  getClientFinancials(clientId: string) {
    return this.clients.find(c => c._id === clientId)
      ?? { revenue: 0, monthlyCharges: 0, existingLoanPayments: 0 };
  }

  // ✅ Utilise maxAllowedMonthly() du service (plafond 40% BCT)
  getRemainingCapacity(clientId: string): number {
    const c = this.clients.find(cl => cl._id === clientId);
    if (!c) return 0;
    return this.creditService.maxAllowedMonthly(c);
  }

  getDebtRatio(clientId: string, monthly = 0): number {
    const c = this.clients.find(cl => cl._id === clientId);
    if (!c) return 0;
    return this.creditService.calculateDebtRatio(c, monthly);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' Ko';
    return (bytes / 1048576).toFixed(1) + ' Mo';
  }

  trackByApp(_: number, a: CreditApplication): string { return a._id; }

  showMessage(msg: string, type: 'success' | 'error' = 'success'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => { this.message = ''; this.cdr.markForCheck(); }, 3500);
  }

  setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeApplication();
        this.closeStatusModal();
        this.cdr.markForCheck();
      }
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        this.filterByStatus('EN_ATTENTE');
      }
    });
  }
}