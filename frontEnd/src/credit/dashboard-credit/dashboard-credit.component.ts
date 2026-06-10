// dashboard-credit.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  CreditService,
  Client,
  CreditApplication,
  CreditStatus,
  UserRole,
  CreateClientDTO,
  CreateApplicationDTO,
  KPIs,
  MonthlyStat,
} from '../../services/credit.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

type View = 'dashboard' | 'applications' | 'clients';

@Component({
  selector: 'app-dashboard-credit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dashboard-credit.component.html',
  styleUrls: ['./dashboard-credit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCreditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ── Rôle actuel (à récupérer depuis AuthService / JWT en prod) ──
  // 'CHARGE_CREDIT' : crée les dossiers, upload docs, ajoute commentaires
  // 'ANALYSTE'      : traite les statuts (EN_ANALYSE → ACCEPTE/REFUSE)
  currentRole: UserRole = 'CHARGE_CREDIT'; // ← changer selon JWT
  showProfileModal = false;

  // ── Profil actuel ──
  currentUser: any = {
    _id: '',
    fullName: '',
    email: '',
    role: '',
    avatar: '',
    permissions: [],
    photoUrl: '',
  };

  // ── UI ──
  sidebarCollapsed = false;
  currentView: View = 'dashboard';
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  // ── Data ──
  clients: Client[] = [];
  applications: CreditApplication[] = [];
  filteredApplications: CreditApplication[] = [];

  // ── KPIs ──
  kpis: KPIs = {
    total: 0,
    pending: 0,
    analyzing: 0,
    accepted: 0,
    refused: 0,
    totalAmount: 0,
    approvalRate: 0,
  };
  monthlyStats: MonthlyStat[] = [];
  maxMonthlyCount = 1;

  // ── Filters ──
  searchTerm = '';
  filterStatus = 'ALL';
  filterAmount = 'ALL';

  // ── Modals ──
  selectedApplication: CreditApplication | null = null;
  selectedClient: Client | null = null;
  selectedClientApplications: CreditApplication[] = []; // ✅ pré-calculé à l'ouverture de la modale client
  showClientModal = false;
  showApplicationModal = false;
  showStatusModal = false;
  showFinancialDataModal = false;
  financialDataTarget: CreditApplication | null = null;
  newCommentText = '';

  // ── Status update ──
  statusUpdateTarget: CreditApplication | null = null;
  pendingStatus: CreditStatus = 'EN_ANALYSE';
  statusComment = '';

  // ── Upload ──
  selectedFile: File | null = null;
  uploadStatus = '';
  uploadError = '';

  // ── Forms ──
  clientForm!: FormGroup;
  applicationForm!: FormGroup;
  financialDataForm!: FormGroup;

  // ── Simulation montant/taux ──
  estimatedMonthly = 0;
  debtRatio = 0;
  debtWarning = false; // ✅ seuil 40% (BCT Tunisie)
  selectedClientForApp: Client | null = null;
  selectedClientData: Client | null = null;
  // ── Sidebar items selon rôle ──
  get sidebarItems() {
    const base = [
      { id: 'dashboard' as View, label: 'Tableau de bord', icon: '📊' },
      { id: 'applications' as View, label: 'Dossiers', icon: '📋' },
    ];
    // Chargé crédit a accès aux clients
    if (this.currentRole === 'CHARGE_CREDIT' || this.currentRole === 'ADMIN') {
      base.push({ id: 'clients' as View, label: 'Clients', icon: '👥' });
    }
    return base;
  }

  constructor(
    public creditService: CreditService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private adminService: AdminService,
  ) { }

  ngOnInit(): void {
    this.detectRole();
    this.buildForms();
    this.subscribeToData();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ──────────────────────────────────────────
  //  Détection du rôle (depuis JWT / AuthService)
  // ──────────────────────────────────────────

  detectRole(): void {
    // En production : lire le rôle depuis le token JWT
    // const user = this.authService.getCurrentUser();
    // this.currentRole = user?.role || 'CHARGE_CREDIT';

    // Pour le dev, simuler selon localStorage ou token
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        // Mapper les rôles backend → UserRole
        const roleMap: Record<string, UserRole> = {
          charge_credit: 'CHARGE_CREDIT',
          analyste: 'ANALYSTE',
          admin: 'ADMIN',
          CHARGE_CREDIT: 'CHARGE_CREDIT',
          ANALYSTE: 'ANALYSTE',
          ADMIN: 'ADMIN',
        };
        this.currentRole = roleMap[user?.role] || 'CHARGE_CREDIT';
      } catch {
        this.currentRole = 'CHARGE_CREDIT';
      }
    }
  }

  get isChargeCredit(): boolean {
    return this.currentRole === 'CHARGE_CREDIT';
  }
  get isAnalyste(): boolean {
    return this.currentRole === 'ANALYSTE';
  }
  get isAdmin(): boolean {
    return this.currentRole === 'ADMIN';
  }

  // ──────────────────────────────────────────
  //  Formulaires
  // ──────────────────────────────────────────

  buildForms(): void {
    this.clientForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      cin: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      birthDate: ['', Validators.required],

      gender: ['', Validators.required],
      employmentStatus: ['', Validators.required],

      city: ['', Validators.required],
      address: ['', Validators.required],
      profession: ['', Validators.required],
      employer: ['', Validators.required],
      revenue: [null, Validators.required],
      monthlyCharges: [null, Validators.required],
      existingLoans: [0]
    });

    this.applicationForm = this.fb.group({
      clientId: ['', Validators.required],
      amount: [
        0,
        [Validators.required, Validators.min(1000), Validators.max(500000)],
      ],
      duration: [
        12,
        [Validators.required, Validators.min(6), Validators.max(360)],
      ],
      purpose: ['CONSOMMATION', Validators.required],
    });

    this.financialDataForm = this.fb.group({
      account_age_months: [0, [Validators.required, Validators.min(0)]],
      avg_monthly_balance: [0, [Validators.required, Validators.min(0)]],
      num_deposits_per_month: [0, [Validators.required, Validators.min(0)]],
      avg_deposit_amount: [0, [Validators.required, Validators.min(0)]],
      num_withdrawals_per_month: [0, [Validators.required, Validators.min(0)]],
      avg_withdrawal_amount: [0, [Validators.required, Validators.min(0)]],
      debit_card_spending: [0, [Validators.required, Validators.min(0)]],
      credit_card_utilization: [
        0,
        [Validators.required, Validators.min(0), Validators.max(1)],
      ],
      // ✅ Optionnels : supprimer Validators.required
      total_outstanding_debt: [0, [Validators.min(0)]],
      loan_application_amount: [0, [Validators.min(0)]],
    });

    this.applicationForm.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.recalculate());
  }

  // ──────────────────────────────────────────
  //  Souscriptions aux données
  // ──────────────────────────────────────────

  subscribeToData(): void {
    this.creditService.clients$
      .pipe(takeUntil(this.destroy$))
      .subscribe((c) => {
        this.clients = c;
        // ✅ Plus besoin de refreshSelectedClientData() ici
        this.cdr.markForCheck();
      });

    this.creditService.applications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((a) => {
        // ✅ Normaliser clientId : extraire _id si objet Mongoose peuplé
        this.applications = a.map(app => ({
          ...app,
          clientId: typeof app.clientId === 'object'
            ? (app.clientId as any)?._id
            : app.clientId,
          // ✅ Récupérer clientName depuis l'objet peuplé si absent
          clientName: app.clientName || (app.clientId as any)?.fullName || '',
        }));
        this.applyFilters();
        this.cdr.markForCheck();
      });
    this.creditService.monthlyStats$
      .pipe(takeUntil(this.destroy$))
      .subscribe((s) => {
        this.monthlyStats = s;
        this.maxMonthlyCount = Math.max(...s.map((x) => x.count), 1);
        this.cdr.markForCheck();
      });

    this.creditService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((l) => {
        this.loading = l;
        this.cdr.markForCheck();
      });
  }

  // ──────────────────────────────────────────
  //  US 2.3 – Filtres
  // ──────────────────────────────────────────

  applyFilters(): void {
    let result = [...this.applications];

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.purpose.toLowerCase().includes(q),
      );
    }

    if (this.filterStatus !== 'ALL')
      result = result.filter((a) => a.status === this.filterStatus);

    if (this.filterAmount === '0-10000')
      result = result.filter((a) => a.amount < 10000);
    else if (this.filterAmount === '10000-50000')
      result = result.filter((a) => a.amount >= 10000 && a.amount <= 50000);
    else if (this.filterAmount === '50000+')
      result = result.filter((a) => a.amount > 50000);

    this.filteredApplications = result;
  }

  onSearchChange(): void {
    this.applyFilters();
  }
  onFilterChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
    this.filterAmount = 'ALL';
    this.applyFilters();
  }

  filterByStatus(status: string): void {
    this.filterStatus = status;
    this.applyFilters();
    this.setView('applications');
  }

  // ──────────────────────────────────────────
  //  US 2.1 – Créer client (Chargé crédit)
  // ──────────────────────────────────────────

  openClientModal(): void {
    this.clientForm.reset({
      revenue: 0,
      monthlyCharges: 0,
      existingLoanPayments: 0,
    }); // ✅
    this.showClientModal = true;
  }

  closeClientModal(): void {
    this.showClientModal = false;
  }

  submitClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.creditService
      .createClient(this.clientForm.value as CreateClientDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.showMessage('Client créé avec succès ✓', 'success');
          this.closeClientModal();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.loading = false;
          this.showMessage(e.message, 'error');
          this.cdr.markForCheck();
        },
      });
  }

  // ──────────────────────────────────────────
  //  US 2.1 – Créer dossier (Chargé crédit)
  //  Statut initial toujours EN_ATTENTE (backend)
  // ──────────────────────────────────────────

  openApplicationModal(): void {
    this.applicationForm.reset({
      duration: 12,
      purpose: 'CONSOMMATION',
      amount: 0,
      clientId: '',
    });
    this.estimatedMonthly = 0;
    this.debtRatio = 0;
    this.debtWarning = false;
    this.selectedClientForApp = null;
    this.showApplicationModal = true;
  }

  closeApplicationModal(): void {
    this.showApplicationModal = false;
  }

  recalculate(): void {
    const { amount, duration, clientId, purpose } = this.applicationForm.value;

    if (amount > 0 && duration > 0) {
      // ✅ Taux selon le type de crédit (CONSOMMATION / AUTO / IMMOBILIER)
      const annualRate =
        this.creditService.RATES[purpose] ??
        this.creditService.RATES['CONSOMMATION'];
      this.estimatedMonthly = this.creditService.calculateMonthly(
        +amount,
        +duration,
        annualRate,
      );
    }

    if (clientId) {
      this.selectedClientForApp =
        this.clients.find((c) => c._id === clientId) || null;
      if (this.selectedClientForApp) {
        this.debtRatio = this.creditService.calculateDebtRatio(
          this.selectedClientForApp,
          this.estimatedMonthly,
        );
        // ✅ Seuil BCT Tunisie : 40%
        this.debtWarning = !this.creditService.isEligible(this.debtRatio);
      }
    }
    this.cdr.markForCheck();
  }

  submitApplication(): void {
    if (this.applicationForm.invalid) {
      this.applicationForm.markAllAsTouched();
      return;
    }
    if (this.debtWarning) {
      // ✅ Message mis à jour : seuil 40%
      this.showMessage(
        "Taux d'endettement > 40% — dossier refusé automatiquement",
        'error',
      );
      return;
    }
    this.loading = true;
    this.creditService
      .createApplication(this.applicationForm.value as CreateApplicationDTO)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.showMessage('Dossier créé — statut : En attente ✓', 'success');
          this.closeApplicationModal();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.loading = false;
          this.showMessage(e.message, 'error');
          this.cdr.markForCheck();
        },
      });
  }

  // ──────────────────────────────────────────
  //  US 2.2 – Documents (Chargé crédit)
  // ──────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.selectedApplication) return;

    const file = input.files[0];

    // Validations côté client
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/plain',
      'application/json',
    ];
    if (!allowed.includes(file.type)) {
      this.showMessage(
        'Type non supporté : PDF, JPEG, PNG, TXT ou JSON uniquement',
        'error',
      );
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('Fichier trop volumineux — maximum 5 Mo', 'error');
      input.value = '';
      return;
    }

    this.loading = true;
    this.uploadStatus = 'Upload en cours...';
    this.cdr.markForCheck();

    this.creditService
      .uploadDocument(this.selectedApplication._id, file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.uploadStatus = '';
          this.showMessage('Document uploadé ✓', 'success');
          this.refreshSelected();
          input.value = '';
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.loading = false;
          this.uploadStatus = '';
          this.showMessage(e.message || 'Erreur upload', 'error');
          input.value = '';
          this.cdr.markForCheck();
        },
      });
  }

  // Validation document (Analyste / Admin)
  validateDocument(docId: string): void {
    if (!this.selectedApplication) return;
    this.creditService
      .validateDocument(this.selectedApplication._id, docId, 'Agent connecté')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshSelected();
          this.showMessage('Document validé ✓', 'success');
          this.cdr.markForCheck();
        },
        error: (e) => this.showMessage(e.message, 'error'),
      });
  }

  // ──────────────────────────────────────────
  //  Données IA financières du dossier
  // ──────────────────────────────────────────

  openFinancialDataModal(app: CreditApplication): void {
    this.financialDataTarget = app;

    const existingData = (app as any).aiFinancialData || {};

    this.financialDataForm.reset({
      account_age_months: existingData.account_age_months ?? 0,
      avg_monthly_balance: existingData.avg_monthly_balance ?? 0,
      num_deposits_per_month: existingData.num_deposits_per_month ?? 0,
      avg_deposit_amount: existingData.avg_deposit_amount ?? 0,
      num_withdrawals_per_month: existingData.num_withdrawals_per_month ?? 0,
      avg_withdrawal_amount: existingData.avg_withdrawal_amount ?? 0,
      debit_card_spending: existingData.debit_card_spending ?? 0,
      credit_card_utilization: existingData.credit_card_utilization ?? 0,
      total_outstanding_debt: existingData.total_outstanding_debt ?? 0,
      loan_application_amount: existingData.loan_application_amount ?? app.amount ?? 0,
    });

    this.showFinancialDataModal = true;
    this.cdr.markForCheck();
  }

  closeFinancialDataModal(): void {
    this.showFinancialDataModal = false;
    this.financialDataTarget = null;
  }

  saveFinancialData(): void {
    console.log('saveFinancialData called'); // ← à garder temporairement

    if (!this.financialDataTarget) return;

    if (this.financialDataForm.invalid) {
      this.financialDataForm.markAllAsTouched();
      // ✅ Message visible à l'utilisateur au lieu de bouton grisé silencieux
      this.showMessage('Veuillez corriger les champs invalides', 'error');
      this.cdr.markForCheck();
      return;
    }

    const applicationId = this.financialDataTarget._id;
    const payload = this.financialDataForm.value;
    this.loading = true;
    this.cdr.markForCheck();

    this.creditService
      .saveFinancialData(applicationId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedApplication: CreditApplication) => {
          this.loading = false;

          const merged = {
            ...updatedApplication,
            aiFinancialData: (updatedApplication as any).aiFinancialData ?? payload,
          };

          this.applications = this.applications.map((app) =>
            app._id === applicationId ? merged : app,
          );
          this.applyFilters();

          if (this.selectedApplication?._id === applicationId) {
            this.selectedApplication = { ...merged };
          }

          this.showMessage('Données IA enregistrées ✓', 'success');
          this.closeFinancialDataModal();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.loading = false;
          this.showMessage(
            e?.error?.message || e?.message || 'Erreur enregistrement',
            'error',
          );
          this.cdr.markForCheck();
        },
      });
  }

  hasAiFinancialData(app: CreditApplication | null): boolean {
    return !!(app as any)?.aiFinancialData;
  }

  getAiFinancialData(app: CreditApplication | null): any {
    return (app as any)?.aiFinancialData || {};
  }

  // ──────────────────────────────────────────
  //  US 2.4 – Mise à jour statut (Analyste)
  //  Chargé crédit → pas accès à ce modal
  //  Workflow :
  //    EN_ATTENTE → EN_ANALYSE (analyste prend en charge)
  //    EN_ANALYSE → ACCEPTE | REFUSE
  // ──────────────────────────────────────────

  openStatusModal(app: CreditApplication): void {
    // Seul l'analyste (ou admin) peut changer le statut
    if (this.isChargeCredit) {
      this.showMessage(
        "Seul un analyste peut modifier le statut d'un dossier",
        'error',
      );
      return;
    }
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
    if (this.pendingStatus === 'REFUSE' && !this.statusComment.trim()) {
      this.showMessage('Le motif du refus est obligatoire', 'error');
      return;
    }
    this.loading = true;
    this.creditService
      .updateStatus(
        this.statusUpdateTarget._id,
        this.pendingStatus,
        'Analyste connecté',
        this.statusComment || undefined,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.showMessage(
            `Statut → ${this.getStatusLabel(this.pendingStatus)} ✓`,
            'success',
          );
          this.closeStatusModal();
          this.refreshSelected();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.loading = false;
          this.showMessage(e.message, 'error');
          this.cdr.markForCheck();
        },
      });
  }

  /** Transitions selon rôle */
  getAllowedStatuses(current: CreditStatus): CreditStatus[] {
    return this.creditService.getAllowedTransitions(current, this.currentRole);
  }

  /** Indique si le bouton de statut doit être visible */
  canChangeStatus(app: CreditApplication): boolean {
    if (this.isChargeCredit) return false;
    return (
      !this.isFinalStatus(app.status) &&
      this.getAllowedStatuses(app.status).length > 0
    );
  }

  // ──────────────────────────────────────────
  //  US 2.5 – Consultation clients / dossiers
  // ──────────────────────────────────────────
  // Modifier viewApplication() — appel HTTP direct par ID
  viewApplication(app: CreditApplication): void {
    this.selectedApplication = app;
    this.selectedClientData = null;

    // ✅ clientId peut être un objet Mongoose peuplé ou une string
    const clientId = typeof app.clientId === 'object'
      ? (app.clientId as any)?._id
      : app.clientId;

    console.log('clientId extrait:', clientId); // vérification

    if (!clientId) {
      // Fallback : chercher dans le cache par clientName
      this.selectedClientData =
        this.clients.find(c => c.fullName === app.clientName) ?? null;
      this.cdr.markForCheck();
      return;
    }

    this.creditService.getClientById(String(clientId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (client: Client) => {
          this.selectedClientData = client;
          this.cdr.markForCheck();
        },
        error: () => {
          // Fallback cache
          this.selectedClientData =
            this.clients.find(c => String(c._id) === String(clientId)) ?? null;
          this.cdr.markForCheck();
        }
      });

    this.cdr.markForCheck();
  }

  // refreshSelectedClientData() n'est plus nécessaire — peut être supprimée
  // ou simplifiée comme fallback uniquement
  private refreshSelectedClientData(): void {
    if (!this.selectedApplication) {
      this.selectedClientData = null;
      return;
    }
    const targetId = String(this.selectedApplication.clientId);
    this.selectedClientData =
      this.clients.find((c) => String(c._id) === targetId) ?? null;
    this.cdr.markForCheck();
  }

  closeApplication(): void {
    this.selectedApplication = null;
    this.selectedClientData = null;
  }
  viewClientDetails(client: Client): void {
    this.selectedClient = client;
    this.selectedClientApplications = this.creditService.getClientApplications(client._id);
    console.log('Applications trouvées:', this.selectedClientApplications.length); // vérif
  }
  closeClientDetails(): void {
    this.selectedClient = null;
    this.selectedClientApplications = [];
  }

  getClientApplications(clientId: string): CreditApplication[] {
    return this.creditService.getClientApplications(clientId);
  }

  // ── Commentaires ──
  submitComment(): void {
    if (!this.newCommentText.trim() || !this.selectedApplication) return;
    const userName = this.isAnalyste ? 'Analyste connecté' : 'Chargé crédit';
    this.creditService
      .addComment(this.selectedApplication._id, this.newCommentText, userName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newCommentText = '';
          this.refreshSelected();
          this.cdr.markForCheck();
        },
        error: (e) => this.showMessage(e.message, 'error'),
      });
  }

  // ──────────────────────────────────────────
  //  Helpers
  // ──────────────────────────────────────────

  refreshSelected(): void {
    if (this.selectedApplication) {
      const updated = this.applications.find(
        (a) => a._id === this.selectedApplication!._id,
      );
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
    return (
      (
        {
          EN_ATTENTE: 'status--pending',
          EN_ANALYSE: 'status--analyzing',
          ACCEPTE: 'status--accepted',
          REFUSE: 'status--refused',
        } as Record<string, string>
      )[s] ?? ''
    );
  }

  getDocStatusLabel(s: string): string {
    return (
      (
        {
          EN_ATTENTE: 'En attente',
          VALIDE: 'Validé',
          REJETE: 'Rejeté',
        } as Record<string, string>
      )[s] ?? s
    );
  }

  getDocStatusClass(s: string): string {
    return (
      (
        {
          VALIDE: 'doc--valid',
          EN_ATTENTE: 'doc--pending',
          REJETE: 'doc--rejected',
        } as Record<string, string>
      )[s] ?? ''
    );
  }

  isFinalStatus(s: CreditStatus): boolean {
    return s === 'ACCEPTE' || s === 'REFUSE';
  }

  getClientFinancials(clientId: string) {
    return (
      this.clients.find((c) => c._id === clientId) ?? {
        revenue: 0,
        monthlyCharges: 0,
        existingLoanPayments: 0,
      }
    ); // ✅
  }

  // ✅ Capacité restante basée sur mensualité réelle + plafond 40%
  getRemainingCapacity(clientId: string): number {
    const c = this.clients.find((cl) => cl._id === clientId);
    if (!c) return 0;
    return this.creditService.maxAllowedMonthly(c);
  }

  getDebtRatio(clientId: string, monthly = 0): number {
    const c = this.clients.find((cl) => cl._id === clientId);
    if (!c) return 0;
    return this.creditService.calculateDebtRatio(c, monthly);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' Ko';
    return (bytes / 1048576).toFixed(1) + ' Mo';
  }

  amountDistribution() {
    return {
      small: this.applications.filter((a) => a.amount < 10000).length,
      medium: this.applications.filter(
        (a) => a.amount >= 10000 && a.amount <= 50000,
      ).length,
      large: this.applications.filter((a) => a.amount > 50000).length,
    };
  }

  trackByApp(_: number, a: CreditApplication): string {
    return a._id;
  }
  trackByClient(_: number, c: Client): string {
    return c._id;
  }

  showMessage(msg: string, type: 'success' | 'error' = 'success'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.cdr.markForCheck();
    }, 3500);
  }

  setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeApplication();
        this.closeClientDetails();
        this.closeStatusModal();
        this.closeFinancialDataModal();
        this.cdr.markForCheck();
      }
      if (e.ctrlKey && e.key === 'n' && this.isChargeCredit) {
        e.preventDefault();
        this.openApplicationModal();
      }
    });
  }

  // ──────────────────────────────────────────
  //  Profil
  // ──────────────────────────────────────────

  openProfile(): void {
    this.showProfileModal = true;
  }
  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  updateProfile(): void {
    this.adminService.updateProfile(this.currentUser).subscribe({
      next: () => {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.showMsg('Profil mis à jour ✓', 'success');
        this.closeProfileModal();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.showMsg('Erreur mise à jour profil', 'error');
      },
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
      error: () => this.router.navigate(['/login']),
    });
  }

  showMsg(msg: string, type: 'success' | 'error' = 'success'): void {
    this.message = msg;
    setTimeout(() => {
      this.message = '';
      this.cdr.markForCheck();
    }, 3500);
  }

}
