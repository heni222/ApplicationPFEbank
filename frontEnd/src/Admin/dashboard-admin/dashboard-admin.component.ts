// dashboard-admin.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  cin?: string;
  phone?: string;
  address?: string;
  city?: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: 'ADMIN' | 'CREDIT' | 'ANALYST'; // ← rôles réels du système
  permissions: string[];
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  requiredPermission?: string;
}

// Permissions disponibles par catégorie
const ALL_PERMISSIONS: Permission[] = [
  // Utilisateurs
  { id: 'view_users', name: 'Voir utilisateurs', description: 'Afficher la liste des utilisateurs', category: 'Utilisateurs' },
  { id: 'create_users', name: 'Créer utilisateurs', description: 'Ajouter de nouveaux utilisateurs', category: 'Utilisateurs' },
  { id: 'edit_users', name: 'Modifier utilisateurs', description: 'Modifier les infos des utilisateurs', category: 'Utilisateurs' },
  { id: 'delete_users', name: 'Supprimer utilisateurs', description: 'Supprimer des utilisateurs', category: 'Utilisateurs' },
  { id: 'manage_roles', name: 'Gérer rôles', description: 'Modifier les rôles des utilisateurs', category: 'Utilisateurs' },
  { id: 'manage_permissions', name: 'Gérer permissions', description: 'Modifier les permissions des utilisateurs', category: 'Utilisateurs' },
  // Crédit
  { id: 'view_credits', name: 'Voir crédits', description: 'Consulter les dossiers de crédit', category: 'Crédit' },
  { id: 'create_credits', name: 'Créer crédits', description: 'Créer des dossiers de crédit', category: 'Crédit' },
  { id: 'upload_documents', name: 'Upload documents', description: 'Déposer des documents', category: 'Crédit' },
  // Analyse / Risque
  { id: 'analyze_credits', name: 'Analyser crédits', description: 'Analyser et décider sur les dossiers', category: 'Risque' },
  { id: 'approve_credits', name: 'Approuver crédits', description: 'Accepter ou refuser un dossier', category: 'Risque' },
  { id: 'validate_documents', name: 'Valider documents', description: 'Valider les documents soumis', category: 'Risque' },
  // Dashboard
  { id: 'view_dashboard', name: 'Voir dashboard', description: 'Accès au tableau de bord', category: 'Dashboard' },
  { id: 'view_analytics', name: 'Voir analytics', description: 'Accès aux statistiques', category: 'Dashboard' },
  { id: 'view_reports', name: 'Voir rapports', description: 'Accès aux rapports', category: 'Dashboard' },
  // Système
  { id: 'manage_settings', name: 'Gérer paramètres', description: 'Modifier les paramètres système', category: 'Système' },
];

// Permissions par défaut selon le rôle
const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ALL_PERMISSIONS.map(p => p.id), // tout
  CREDIT: [
    'view_credits', 'create_credits', 'upload_documents',
    'view_dashboard', 'view_reports'
  ],
  ANALYST: [
    'view_credits', 'analyze_credits', 'approve_credits',
    'validate_documents', 'upload_documents',
    'view_dashboard', 'view_analytics'
  ],
};

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
})
export class DashboardAdminComponent implements OnInit {

  // ── Data ──
  users: User[] = [];
  availablePermissions: Permission[] = ALL_PERMISSIONS;
  loading = false;
  message = '';

  // ── Filters ──
  searchTerm = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  filterRole: 'ALL' | 'CREDIT' | 'ANALYST' = 'ALL';  // ADMIN exclu de la liste

  // ── UI ──
  sidebarCollapsed = false;
  currentView = 'overview';
  showUserModal = false;
  showPermissionsModal = false;
  showProfileModal = false;
  editingUser: User | null = null;
  selectedUserPermissions: string[] = [];

  // ── KPIs ──
  totalUsers = 0;
  activeUsers = 0;
  creditCount = 0;  // rôle CREDIT
  riskCount = 0;  // rôle RISK

  // ── Profil actuel ──
  currentUser: any = {
    _id: '', fullName: '', email: '', role: '', avatar: '', permissions: [], photoUrl: ''
  };

  sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Aperçu', icon: '📊', active: true, requiredPermission: 'view_dashboard' },
    { id: 'users', label: 'Utilisateurs', icon: '👥', active: false, requiredPermission: 'view_users' },
    { id: 'analytics', label: 'Analytiques', icon: '📈', active: false, requiredPermission: 'view_analytics' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️', active: false, requiredPermission: 'manage_settings' },
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.getUsers();
    this.setupKeyboardShortcuts();
  }

  // ──────────────────────────────────────────
  //  Auth / Profil
  // ──────────────────────────────────────────

  loadCurrentUser(): void {
    this.authService.getMe().subscribe({
      next: (res: any) => {
        const user = res.user || res;
        this.currentUser = {
          ...user,
          avatar: (user.fullName || 'A').charAt(0).toUpperCase(),
          permissions: user.permissions?.length
            ? user.permissions
            : ROLE_DEFAULT_PERMISSIONS[user.role] ?? []
        };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.filterSidebarByPermissions();
        this.cdr.markForCheck();
      },
      error: err => console.error('loadCurrentUser:', err)
    });
  }

  filterSidebarByPermissions(): void {
    this.sidebarItems = this.sidebarItems.filter(item => {
      if (!item.requiredPermission) return true;
      return this.hasPermission(item.requiredPermission);
    });
  }

  hasPermission(permission: string): boolean {
    return this.currentUser.role === 'ADMIN' ||
      (this.currentUser.permissions || []).includes(permission);
  }

  // ──────────────────────────────────────────
  //  Utilisateurs — CRUD
  //  NB : l'API doit filtrer les ADMIN côté backend
  //  On filtre aussi côté front : on n'affiche pas les ADMIN
  // ──────────────────────────────────────────

  getUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (res: any[]) => {
        // Exclure les ADMIN de la liste (un admin ne gère pas les autres admins)
        this.users = res.filter(u => u.role !== 'ADMIN');
        this.updateKPIs();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.showMsg('Erreur chargement utilisateurs', 'error');
      }
    });
  }

  updateKPIs(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.status === 'ACTIVE').length;
    this.creditCount = this.users.filter(u => u.role === 'CREDIT').length;
    this.riskCount = this.users.filter(u => u.role === 'ANALYST').length;
  }

  get filteredUsers(): User[] {
    let list = [...this.users];
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    if (this.filterStatus !== 'ALL') list = list.filter(u => u.status === this.filterStatus);
    if (this.filterRole !== 'ALL') list = list.filter(u => u.role === this.filterRole);
    return list;
  }

  // ── Activer / Désactiver ──
  toggleStatus(user: User): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.updateStatus(user._id, newStatus).subscribe({
      next: () => {
        user.status = newStatus;
        this.updateKPIs();
        this.showMsg(`Statut de ${user.fullName} modifié`, 'success');
        this.cdr.markForCheck();
      },
      error: err => { console.error(err); this.showMsg('Erreur modification statut', 'error'); }
    });
  }

  // ── Changer rôle (valeurs réelles : CREDIT / RISK) ──
  changeRole(user: User, event: Event): void {
    const newRole = (event.target as HTMLSelectElement).value as User['role'];
    this.adminService.updateRole(user._id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        // Réinitialiser les permissions par défaut du nouveau rôle
        user.permissions = [...(ROLE_DEFAULT_PERMISSIONS[newRole] ?? [])];
        this.updateKPIs();
        this.showMsg(`Rôle de ${user.fullName} → ${this.getRoleLabel(newRole)}`, 'success');
        this.cdr.markForCheck();
      },
      error: err => { console.error(err); this.showMsg('Erreur modification rôle', 'error'); }
    });
  }

  // ── Modal création / édition ──
  openUserModal(user?: User): void {
    this.editingUser = user
      ? { ...user }
      : { _id: '', fullName: '', email: '', status: 'ACTIVE', role: 'CREDIT', permissions: [...(ROLE_DEFAULT_PERMISSIONS['CREDIT'] ?? [])] };
    this.showUserModal = true;
  }

  closeUserModal(): void { this.showUserModal = false; this.editingUser = null; }

  saveUser(): void {
    if (!this.editingUser) return;
    this.loading = true;

    const obs = this.editingUser._id
      ? this.adminService.updateUser(this.editingUser._id, this.editingUser)
      : this.adminService.createUser(this.editingUser);

    obs.subscribe({
      next: (saved: any) => {
        if (this.editingUser!._id) {
          const idx = this.users.findIndex(u => u._id === saved._id);
          if (idx !== -1) this.users[idx] = saved;
        } else {
          if (saved.role !== 'ADMIN') this.users.push(saved);
        }
        this.updateKPIs();
        this.showMsg(this.editingUser!._id ? 'Utilisateur modifié ✓' : 'Utilisateur créé ✓', 'success');
        this.closeUserModal();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error(err);
        this.showMsg(err.message || 'Erreur', 'error');
        this.loading = false;
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Supprimer ${user.fullName} ?`)) return;
    this.adminService.deleteUser(user._id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u._id !== user._id);
        this.updateKPIs();
        this.showMsg(`${user.fullName} supprimé`, 'success');
        this.cdr.markForCheck();
      },
      error: err => { console.error(err); this.showMsg('Erreur suppression', 'error'); }
    });
  }

  resetFilters(): void { this.searchTerm = ''; this.filterStatus = 'ALL'; this.filterRole = 'ALL'; }

  // ──────────────────────────────────────────
  //  Permissions
  // ──────────────────────────────────────────

  openPermissionsModal(user: User): void {
    if (!this.hasPermission('manage_permissions')) {
      this.showMsg('Permission insuffisante', 'error'); return;
    }
    this.editingUser = { ...user };
    // Permissions actuelles ou celles par défaut du rôle
    this.selectedUserPermissions = [
      ...(user.permissions?.length
        ? user.permissions
        : ROLE_DEFAULT_PERMISSIONS[user.role] ?? [])
    ];
    this.showPermissionsModal = true;
  }

  closePermissionsModal(): void {
    this.showPermissionsModal = false;
    this.editingUser = null;
    this.selectedUserPermissions = [];
  }

  togglePermission(permId: string): void {
    const idx = this.selectedUserPermissions.indexOf(permId);
    if (idx > -1) this.selectedUserPermissions.splice(idx, 1);
    else this.selectedUserPermissions.push(permId);
  }

  isPermissionSelected(permId: string): boolean {
    return this.selectedUserPermissions.includes(permId);
  }

  /** Sélectionner / désélectionner toute une catégorie */
  toggleCategory(category: string): void {
    const catPerms = this.getPermissionsByCategory(category).map(p => p.id);
    const allSelected = catPerms.every(id => this.selectedUserPermissions.includes(id));
    if (allSelected) {
      this.selectedUserPermissions = this.selectedUserPermissions.filter(id => !catPerms.includes(id));
    } else {
      catPerms.forEach(id => { if (!this.selectedUserPermissions.includes(id)) this.selectedUserPermissions.push(id); });
    }
  }

  isCategoryFullySelected(category: string): boolean {
    return this.getPermissionsByCategory(category).every(p => this.selectedUserPermissions.includes(p.id));
  }

  /** Réinitialiser aux permissions par défaut du rôle */
  resetToRoleDefaults(): void {
    if (!this.editingUser) return;
    this.selectedUserPermissions = [...(ROLE_DEFAULT_PERMISSIONS[this.editingUser.role] ?? [])];
  }

  savePermissions(): void {
    if (!this.editingUser) return;
    this.loading = true;
    this.adminService.updatePermissions(this.editingUser._id, this.selectedUserPermissions).subscribe({
      next: () => {
        const idx = this.users.findIndex(u => u._id === this.editingUser!._id);
        if (idx !== -1) this.users[idx].permissions = [...this.selectedUserPermissions];
        this.showMsg('Permissions mises à jour ✓', 'success');
        this.closePermissionsModal();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error(err);
        this.showMsg('Erreur mise à jour permissions', 'error');
        this.loading = false;
      }
    });
  }

  getPermissionCategories(): string[] {
    return [...new Set(this.availablePermissions.map(p => p.category))];
  }

  getPermissionsByCategory(cat: string): Permission[] {
    return this.availablePermissions.filter(p => p.category === cat);
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
        this.showMsg('Profil mis à jour ✓', 'success');
        this.closeProfileModal();
        this.cdr.markForCheck();
      },
      error: err => { console.error(err); this.showMsg('Erreur mise à jour profil', 'error'); }
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
  //  Helpers
  // ──────────────────────────────────────────

  getRoleLabel(role: string): string {
    return ({ ADMIN: 'Administrateur', CREDIT: 'Chargé crédit', ANALYST: 'Analyste risque' } as Record<string, string>)[role] ?? role;
  }

  getRoleClass(role: string): string {
    return ({ ADMIN: 'role--admin', CREDIT: 'role--credit', ANALYST: 'role--ANALYST' } as Record<string, string>)[role] ?? '';
  }

  getStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'status-badge--active' : 'status-badge--inactive';
  }

  getKPITrend(type: string): { value: string } {
    const map: Record<string, string> = { total: '+12%', active: '+8%', credit: '+3', ANALYST: '+2' };
    return { value: map[type] ?? '0' };
  }

  setActiveView(viewId: string): void {
    const item = this.sidebarItems.find(i => i.id === viewId);
    if (item?.requiredPermission && !this.hasPermission(item.requiredPermission)) {
      this.showMsg('Permission insuffisante', 'error'); return;
    }
    this.sidebarItems.forEach(i => i.active = i.id === viewId);
    this.currentView = viewId;
  }

  toggleSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }

  showMsg(msg: string, type: 'success' | 'error' = 'success'): void {
    this.message = msg;
    setTimeout(() => { this.message = ''; this.cdr.markForCheck(); }, 3500);
  }

  confirmLogout(): void {
    if (confirm('Voulez-vous vous déconnecter ?')) this.logout();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => { localStorage.removeItem('currentUser'); localStorage.removeItem('authToken'); this.router.navigate(['/login']); },
      error: () => this.router.navigate(['/login'])
    });
  }

  setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); this.toggleSidebar(); }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); this.openProfile(); }
      if (e.ctrlKey && e.key === 'q') { e.preventDefault(); this.confirmLogout(); }
    });
  }
  selectAllPermissions(): void {
    this.selectedUserPermissions = this.availablePermissions.map(
      (p: Permission) => p.id
    );
  }

  clearAllPermissions(): void {
    this.selectedUserPermissions = [];
  }
}