// credit.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export type CreditStatus = 'EN_ATTENTE' | 'EN_ANALYSE' | 'ACCEPTE' | 'REFUSE';
export type DocumentStatus = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

export interface Client {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  cin: string;
  birthDate: string;
  profession: string;
  employer: string;
  revenue: number;
  monthlyCharges: number;
  existingLoans: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditDocument {
  _id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  status: DocumentStatus;
  validatedBy?: string;
}

export interface StatusHistory {
  status: CreditStatus;
  changedAt: Date;
  changedBy: string;
  comment?: string;
}

export interface Comment {
  _id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface CreditApplication {
  _id: string;
  clientId: string;
  clientName: string;
  amount: number;
  duration: number;
  monthlyPayment: number;
  interestRate: number;
  purpose: string;
  status: CreditStatus;
  documents: CreditDocument[];
  comments: Comment[];
  statusHistory: StatusHistory[];
  createdAt: Date;
  updatedAt: Date;
  processedBy?: string;
  rejectionReason?: string;
}

export interface CreateClientDTO {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  cin: string;
  birthDate: string;
  profession: string;
  employer: string;
  revenue: number;
  monthlyCharges: number;
  existingLoans: number;
}

export interface CreateApplicationDTO {
  clientId: string;
  amount: number;
  duration: number;
  purpose: string;
}

export interface KPIs {
  total: number;
  pending: number;
  analyzing: number;
  accepted: number;
  refused: number;
  totalAmount: number;
  approvalRate: number;
}

export interface MonthlyStat {
  month: string;
  count: number;
  amount: number;
}

export interface ApplicationFilters {
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

// Rôles de l'application
export type UserRole = 'CHARGE_CREDIT' | 'ANALYSTE' | 'ADMIN';

@Injectable({ providedIn: 'root' })
export class CreditService {
  // ── URL backend (aligné avec server.js → app.use('/api', creditRoutes)) ──
  private readonly API = 'http://localhost:3000/api';
  private readonly UPLOADS = 'http://localhost:3000/uploads';
  // ── Cache réactif ──────────────────────────────────────
  private _clients = new BehaviorSubject<Client[]>([]);
  private _applications = new BehaviorSubject<CreditApplication[]>([]);
  private _kpis = new BehaviorSubject<KPIs>({
    total: 0,
    pending: 0,
    analyzing: 0,
    accepted: 0,
    refused: 0,
    totalAmount: 0,
    approvalRate: 0,
  });
  private _monthlyStats = new BehaviorSubject<MonthlyStat[]>([]);
  private _loading = new BehaviorSubject<boolean>(false);

  clients$ = this._clients.asObservable();
  applications$ = this._applications.asObservable();
  kpis$ = this._kpis.asObservable();
  monthlyStats$ = this._monthlyStats.asObservable();
  loading$ = this._loading.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  // ──────────────────────────────────────────
  //  Chargement initial (appelé au démarrage)
  // ──────────────────────────────────────────

  loadInitialData(): void {
    this._loading.next(true);

    // GET /api/clients
    this.http
      .get<Client[]>(`${this.API}/clients`)
      .pipe(
        catchError((e) => {
          console.error('clients:', e);
          return [[]];
        }),
      )
      .subscribe((c) => this._clients.next(c as Client[]));

    // GET /api/applications
    this.http
      .get<CreditApplication[]>(`${this.API}/applications`)
      .pipe(
        catchError((e) => {
          console.error('applications:', e);
          return [[]];
        }),
      )
      .subscribe((a) => {
        this._applications.next(a as CreditApplication[]);
        this._loading.next(false);
      });

    // GET /api/stats/kpis
    this.http
      .get<KPIs>(`${this.API}/stats/kpis`)
      .pipe(
        catchError((e) => {
          console.error('kpis:', e);
          return [this._kpis.value];
        }),
      )
      .subscribe((k) => this._kpis.next(k as KPIs));

    // GET /api/stats/monthly
    this.http
      .get<MonthlyStat[]>(`${this.API}/stats/monthly`)
      .pipe(
        catchError((e) => {
          console.error('monthly:', e);
          return [[]];
        }),
      )
      .subscribe((s) => this._monthlyStats.next(s as MonthlyStat[]));
  }

  refreshData(): void {
    this.loadInitialData();
  }

  private refreshKPIs(): void {
    this.http
      .get<KPIs>(`${this.API}/stats/kpis`)
      .pipe(catchError(() => [this._kpis.value]))
      .subscribe((k) => this._kpis.next(k as KPIs));

    this.http
      .get<MonthlyStat[]>(`${this.API}/stats/monthly`)
      .pipe(catchError(() => [[]]))
      .subscribe((s) => this._monthlyStats.next(s as MonthlyStat[]));
  }

  // ──────────────────────────────────────────
  //  US 2.5 – Clients  →  GET /api/clients
  // ──────────────────────────────────────────

  /** POST /api/clients */
  createClient(dto: CreateClientDTO): Observable<Client> {
    return this.http.post<Client>(`${this.API}/clients`, dto).pipe(
      tap((c) => this._clients.next([c, ...this._clients.value])),
      catchError((e) => this.handleError(e)),
    );
  }

  /** GET /api/clients/:id */
  getClientById(id: string): Observable<Client> {
    return this.http
      .get<Client>(`${this.API}/clients/${id}`)
      .pipe(catchError((e) => this.handleError(e)));
  }

  /** PUT /api/clients/:id */
  updateClient(id: string, dto: Partial<CreateClientDTO>): Observable<Client> {
    return this.http.put<Client>(`${this.API}/clients/${id}`, dto).pipe(
      tap((updated) => {
        this._clients.next(
          this._clients.value.map((c) => (c._id === id ? updated : c)),
        );
      }),
      catchError((e) => this.handleError(e)),
    );
  }

  /** DELETE /api/clients/:id */
  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/clients/${id}`).pipe(
      tap(() =>
        this._clients.next(this._clients.value.filter((c) => c._id !== id)),
      ),
      catchError((e) => this.handleError(e)),
    );
  }

  /** GET /api/clients/:id/applications */
  getClientApplications(clientId: string): CreditApplication[] {
    return this._applications.value.filter((a) => a.clientId === clientId);
  }

  // ──────────────────────────────────────────
  //  US 2.1 – Créer un dossier → POST /api/applications
  //  Rôle : CHARGE_CREDIT uniquement
  //  Statut initial : toujours EN_ATTENTE (géré par le backend)
  // ──────────────────────────────────────────

  /** POST /api/applications */
  createApplication(dto: CreateApplicationDTO): Observable<CreditApplication> {
    return this.http
      .post<CreditApplication>(`${this.API}/applications`, dto)
      .pipe(
        tap((app) => {
          this._applications.next([app, ...this._applications.value]);
          this.refreshKPIs();
        }),
        catchError((e) => this.handleError(e)),
      );
  }

  // ──────────────────────────────────────────
  //  US 2.3 – Consulter les dossiers
  //  GET /api/applications?status=&search=&minAmount=&maxAmount=
  // ──────────────────────────────────────────

  /** Récupère depuis le cache local avec filtres */
  getFilteredApplications(filters?: ApplicationFilters): CreditApplication[] {
    let apps = [...this._applications.value];
    if (!filters) return apps;

    if (filters.status && filters.status !== 'ALL')
      apps = apps.filter((a) => a.status === filters.status);
    if (filters.minAmount !== undefined)
      apps = apps.filter((a) => a.amount >= filters.minAmount!);
    if (filters.maxAmount !== undefined)
      apps = apps.filter((a) => a.amount <= filters.maxAmount!);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.purpose.toLowerCase().includes(q),
      );
    }
    return apps;
  }

  /** Rafraîchit depuis le backend avec filtres (optionnel) */
  fetchApplications(
    filters?: ApplicationFilters,
  ): Observable<CreditApplication[]> {
    let params = new HttpParams();
    if (filters?.status && filters.status !== 'ALL')
      params = params.set('status', filters.status);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.minAmount)
      params = params.set('minAmount', String(filters.minAmount));
    if (filters?.maxAmount)
      params = params.set('maxAmount', String(filters.maxAmount));

    return this.http
      .get<CreditApplication[]>(`${this.API}/applications`, { params })
      .pipe(
        tap((apps) => this._applications.next(apps)),
        catchError((e) => this.handleError(e)),
      );
  }

  /** GET /api/applications/:id */
  getApplicationById(id: string): Observable<CreditApplication> {
    return this.http
      .get<CreditApplication>(`${this.API}/applications/${id}`)
      .pipe(catchError((e) => this.handleError(e)));
  }

  /** DELETE /api/applications/:id */
  deleteApplication(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/applications/${id}`).pipe(
      tap(() => {
        this._applications.next(
          this._applications.value.filter((a) => a._id !== id),
        );
        this.refreshKPIs();
      }),
      catchError((e) => this.handleError(e)),
    );
  }

  // ──────────────────────────────────────────
  //  US 2.2 – Documents
  //  POST /api/applications/:id/documents  (multipart/form-data, champ: 'document')
  //  PUT  /api/applications/:appId/documents/:docId/validate
  // ──────────────────────────────────────────

  /** Upload — le backend attend le champ 'document' (multer: upload.single('document')) */
  uploadDocument(
    applicationId: string,
    file: File,
  ): Observable<CreditDocument> {
    const fd = new FormData();
    fd.append('document', file, file.name); // champ = 'document' (multer)

    return this.http
      .post<CreditDocument>(
        `${this.API}/applications/${applicationId}/documents`,
        fd,
      )
      .pipe(
        tap((doc) => {
          const apps = [...this._applications.value];
          const idx = apps.findIndex((a) => a._id === applicationId);
          if (idx !== -1) {
            apps[idx] = {
              ...apps[idx],
              documents: [...apps[idx].documents, doc],
            };
            this._applications.next(apps);
          }
        }),
        catchError((e) => this.handleError(e)),
      );
  }

  /** Valider un document — PUT /api/applications/:appId/documents/:docId/validate */
  validateDocument(
    applicationId: string,
    documentId: string,
    validatedBy: string,
  ): Observable<void> {
    return this.http
      .put<void>(
        `${this.API}/applications/${applicationId}/documents/${documentId}/validate`,
        { validatedBy },
      )
      .pipe(
        tap(() => {
          const apps = [...this._applications.value];
          const appIdx = apps.findIndex((a) => a._id === applicationId);
          if (appIdx !== -1) {
            const docs = apps[appIdx].documents.map((d) =>
              d._id === documentId
                ? { ...d, status: 'VALIDE' as DocumentStatus, validatedBy }
                : d,
            );
            apps[appIdx] = { ...apps[appIdx], documents: docs };
            this._applications.next(apps);
          }
        }),
        catchError((e) => this.handleError(e)),
      );
  }

  /** URL publique d'un document (servi par express.static) */
  getDocumentUrl(relativePath: string): string {
    return `http://localhost:3000${relativePath}`;
  }

  // ──────────────────────────────────────────
  //  US 2.4 – Mise à jour statut
  //  PUT /api/applications/:id/status
  //  Body: { newStatus, changedBy, comment }
  //
  //  Transitions autorisées :
  //    CHARGE_CREDIT : (aucune — crée seulement EN_ATTENTE)
  //    ANALYSTE      : EN_ATTENTE → EN_ANALYSE → ACCEPTE | REFUSE
  // ──────────────────────────────────────────

  updateStatus(
    applicationId: string,
    newStatus: CreditStatus,
    changedBy: string,
    comment?: string,
  ): Observable<CreditApplication> {
    return this.http
      .put<CreditApplication>(
        `${this.API}/applications/${applicationId}/status`,
        { newStatus, changedBy, comment },
      )
      .pipe(
        tap((updated) => {
          const apps = this._applications.value.map((a) =>
            a._id === applicationId ? updated : a,
          );
          this._applications.next(apps);
          this.refreshKPIs();
        }),
        catchError((e) => this.handleError(e)),
      );
  }

  // ──────────────────────────────────────────
  //  Commentaires — POST /api/applications/:id/comments
  //  Body: { content, userName }
  // ──────────────────────────────────────────

  addComment(
    applicationId: string,
    content: string,
    userName: string,
  ): Observable<Comment> {
    return this.http
      .post<Comment>(`${this.API}/applications/${applicationId}/comments`, {
        content,
        userName,
      })
      .pipe(
        tap((comment) => {
          const apps = [...this._applications.value];
          const idx = apps.findIndex((a) => a._id === applicationId);
          if (idx !== -1) {
            apps[idx] = {
              ...apps[idx],
              comments: [...apps[idx].comments, comment],
            };
            this._applications.next(apps);
          }
        }),
        catchError((e) => this.handleError(e)),
      );
  }

  // ──────────────────────────────────────────
  //  US 2.6 – KPIs & stats
  //  GET /api/stats/kpis
  //  GET /api/stats/monthly
  // ──────────────────────────────────────────

  getKPIs(): Observable<KPIs> {
    return this.http.get<KPIs>(`${this.API}/stats/kpis`).pipe(
      tap((k) => this._kpis.next(k)),
      catchError((e) => this.handleError(e)),
    );
  }

  // getMonthlyStats(): Observable<MonthlyStat[]> {
  //   return this.http.get<MonthlyStat[]>(`${this.API}/stats/monthly`).pipe(
  //     tap(s => this._monthlyStats.next(s)),
  //     catchError(e => this.handleError(e))
  //   );
  // }

  // ──────────────────────────────────────────
  //  Helpers locaux (sans appel HTTP)
  // ──────────────────────────────────────────

  /** Transitions autorisées selon le rôle */
  getAllowedTransitions(current: CreditStatus, role: UserRole): CreditStatus[] {
    // Chargé crédit : ne change pas les statuts (il crée seulement)
    if (role === 'CHARGE_CREDIT') return [];

    // Analyste : traite les dossiers
    const map: Record<CreditStatus, CreditStatus[]> = {
      EN_ATTENTE: ['EN_ANALYSE', 'REFUSE'],
      EN_ANALYSE: ['ACCEPTE', 'REFUSE'],
      ACCEPTE: [],
      REFUSE: [],
    };
    return map[current] ?? [];
  }

  calculateMonthly(
    amount: number,
    duration: number,
    annualRate = 0.09, // 9%
  ): number {
    const monthlyRate = annualRate / 12;

    return Math.round(
      (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration)),
    );
  }

  calculateDebtRatio(client: Client, newMonthly: number): number {
    const existingMonthly =
      client.existingLoans > 0 ? client.existingLoans / 240 : 0;

    return Math.round(
      ((client.monthlyCharges + existingMonthly + newMonthly) /
        client.revenue) *
        100,
    );
  }
  getStatusLabel(s: string): string {
    return (
      (
        {
          EN_ATTENTE: 'En attente',
          EN_ANALYSE: 'En analyse',
          ACCEPTE: 'Accepté',
          REFUSE: 'Refusé',
        } as Record<string, string>
      )[s] ?? s
    );
  }

  // ──────────────────────────────────────────
  //  Gestion d'erreurs centralisée
  // ──────────────────────────────────────────

  private handleError(err: any): Observable<never> {
    this._loading.next(false);
    const msg =
      err?.error?.message ||
      err?.error?.error ||
      err?.message ||
      'Une erreur est survenue';
    console.error('[CreditService]', err);
    return throwError(() => new Error(msg));
  }
}
