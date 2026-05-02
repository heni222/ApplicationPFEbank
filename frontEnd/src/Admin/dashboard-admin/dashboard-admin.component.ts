import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

// Interface User compatible avec AdminService
export interface User {
  _id: string;
  fullName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: 'ADMIN' | 'USER' | 'CHARGE_CREDIT' | 'ANALYST';
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

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
})
export class DashboardAdminComponent implements OnInit {
  users: User[] = [];
  permissions: Permission[] = [];
  loading = false;
  error = '';
  message = '';
  searchTerm = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  filterRole: 'ALL' | 'ADMIN' | 'USER' | 'CHARGE_CREDIT' | 'ANALYST' = 'ALL';
  sidebarCollapsed = false;
  currentView = 'overview';
  showUserModal = false;
  showPermissionsModal = false;
  showProfileModal = false;
  editingUser: User | null = null;
  selectedUserPermissions: string[] = [];

  // KPIs
  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;
  adminUsers = 0;
  analystsCount = 0;
  regularUsersCount = 0;
  chargeCreditCount = 0;

  managersCount = 0; // Alias pour chargeCreditCount

  currentUser: any = {
    _id: '',
    fullName: '',
    email: '',
    role: '',
    avatar: '',
    permissions: [],
    photoUrl: '',
  };

  sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Aperçu', icon: '📊', active: true, requiredPermission: 'view_dashboard' },
    { id: 'users', label: 'Utilisateurs', icon: '👥', active: false, requiredPermission: 'view_users' },
    { id: 'permissions', label: 'Permissions', icon: '🔑', active: false, requiredPermission: 'manage_permissions' },
    { id: 'roles', label: 'Rôles', icon: '👑', active: false, requiredPermission: 'manage_roles' },
    { id: 'analytics', label: 'Analytiques', icon: '📈', active: false, requiredPermission: 'view_analytics' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️', active: false, requiredPermission: 'manage_settings' },
  ];

  availablePermissions: Permission[] = [
    { id: 'view_users', name: 'Voir utilisateurs', description: 'Afficher la liste des utilisateurs', category: 'Utilisateurs' },
    { id: 'create_users', name: 'Créer utilisateurs', description: 'Ajouter des utilisateurs', category: 'Utilisateurs' },
    { id: 'edit_users', name: 'Modifier utilisateurs', description: 'Modifier les utilisateurs', category: 'Utilisateurs' },
    { id: 'delete_users', name: 'Supprimer utilisateurs', description: 'Supprimer les utilisateurs', category: 'Utilisateurs' },
    { id: 'manage_roles', name: 'Gérer rôles', description: 'Gestion des rôles', category: 'Utilisateurs' },
    { id: 'manage_permissions', name: 'Gérer permissions', description: 'Gestion des permissions', category: 'Utilisateurs' },
    { id: 'view_credits', name: 'Voir crédits', description: 'Voir les crédits', category: 'Crédit' },
    { id: 'create_credits', name: 'Créer crédits', description: 'Créer crédits', category: 'Crédit' },
    { id: 'approve_credits', name: 'Approuver crédits', description: 'Validation crédits', category: 'Crédit' },
    { id: 'analyze_credits', name: 'Analyser crédits', description: 'Analyse crédits', category: 'Crédit' },
    { id: 'upload_documents', name: 'Upload documents', description: 'Uploader documents', category: 'Crédit' },
    { id: 'validate_documents', name: 'Validation documents', description: 'Valider documents', category: 'Crédit' },
    { id: 'view_dashboard', name: 'Voir dashboard', description: 'Accès dashboard', category: 'Dashboard' },
    { id: 'view_analytics', name: 'Voir analytics', description: 'Voir analytics', category: 'Dashboard' },
    { id: 'view_reports', name: 'Voir rapports', description: 'Voir rapports', category: 'Dashboard' },
    { id: 'manage_settings', name: 'Gérer paramètres', description: 'Modifier paramètres', category: 'Système' },
  ];

  rolePermissions: { [key: string]: string[] } = {
    ADMIN: [
      'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'manage_permissions',
      'view_credits', 'create_credits', 'approve_credits', 'analyze_credits', 'upload_documents', 'validate_documents',
      'view_dashboard', 'view_analytics', 'view_reports', 'manage_settings'
    ],
    CHARGE_CREDIT: [
      'view_credits', 'create_credits', 'approve_credits', 'upload_documents', 'validate_documents',
      'view_dashboard', 'view_reports'
    ],
    ANALYST: [
      'view_credits', 'analyze_credits', 'upload_documents', 'validate_documents',
      'view_dashboard', 'view_analytics'
    ],
    USER: ['create_credits', 'upload_documents', 'view_dashboard']
  };

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.getUsers();
    this.setupKeyboardShortcuts();
  }

  loadCurrentUser(): void {
    this.authService.getMe().subscribe({
      next: (res: any) => {
        const user = res.user;
        this.currentUser = {
          ...user,
          avatar: (user.fullName || 'U').charAt(0).toUpperCase(),
          permissions: user.permissions?.length ? user.permissions : this.getDefaultPermissionsForRole(user.role)
        };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.filterSidebarByPermissions();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  getDefaultPermissionsForRole(role: string): string[] {
    return this.rolePermissions[role] || this.rolePermissions['USER'];
  }

  filterSidebarByPermissions(): void {
    const permissions = this.currentUser.permissions || [];
    this.sidebarItems = this.sidebarItems.filter(item => {
      if (!item.requiredPermission) return true;
      return permissions.includes(item.requiredPermission) || this.currentUser.role === 'ADMIN';
    });
  }

  hasPermission(permission: string): boolean {
    return this.currentUser.permissions?.includes(permission) || this.currentUser.role === 'ADMIN';
  }

  setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        this.openProfile();
      }
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        this.confirmLogout();
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  setActiveView(viewId: string): void {
    const item = this.sidebarItems.find(i => i.id === viewId);
    if (item?.requiredPermission && !this.hasPermission(item.requiredPermission)) {
      this.showMessage('Permission insuffisante', 'error');
      return;
    }
    this.sidebarItems.forEach(item => { item.active = item.id === viewId; });
    this.currentView = viewId;
  }

  getUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (res: any[]) => {
        this.users = res;
        this.updateKPIs();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.showMessage('Erreur chargement utilisateurs', 'error');
      }
    });
  }

  updateKPIs(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.status === 'ACTIVE').length;
    this.inactiveUsers = this.users.filter(u => u.status === 'INACTIVE').length;
    this.adminUsers = this.users.filter(u => u.role === 'ADMIN').length;
    this.chargeCreditCount = this.users.filter(u => u.role === 'CHARGE_CREDIT').length;
    this.analystsCount = this.users.filter(u => u.role === 'ANALYST').length;
    this.regularUsersCount = this.users.filter(u => u.role === 'USER').length;
    this.managersCount = this.chargeCreditCount;
  }

  get filteredUsers(): User[] {
    let filtered = [...this.users];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
      );
    }
    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(user => user.status === this.filterStatus);
    }
    if (this.filterRole !== 'ALL') {
      filtered = filtered.filter(user => user.role === this.filterRole);
    }
    return filtered;
  }

  toggleStatus(user: User): void {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.updateStatus(user._id, newStatus).subscribe({
      next: () => {
        user.status = newStatus;
        this.updateKPIs();
        this.showMessage('Statut modifié avec succès', 'success');
      },
      error: (err) => { console.error(err); }
    });
  }

  changeRole(user: User, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newRole = target.value as User['role'];
    this.adminService.updateRole(user._id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        user.permissions = this.getDefaultPermissionsForRole(newRole);
        this.updateKPIs();
        this.showMessage('Rôle modifié avec succès', 'success');
      },
      error: (err) => { console.error(err); }
    });
  }

  openUserModal(user?: User): void {
    if (user) {
      this.editingUser = { ...user };
    } else {
      this.editingUser = {
        _id: '',
        fullName: '',
        email: '',
        status: 'ACTIVE',
        role: 'USER',
        permissions: this.getDefaultPermissionsForRole('USER')
      };
    }
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.editingUser = null;
  }

  saveUser(): void {
    if (!this.editingUser) return;
    this.loading = true;

    if (this.editingUser._id) {
      this.adminService.updateUser(this.editingUser._id, this.editingUser).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u._id === updatedUser._id);
          if (index !== -1) this.users[index] = updatedUser;
          this.updateKPIs();
          this.showMessage('Utilisateur modifié avec succès', 'success');
          this.closeUserModal();
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    } else {
      this.adminService.createUser(this.editingUser).subscribe({
        next: (newUser) => {
          this.users.push(newUser);
          this.updateKPIs();
          this.showMessage('Utilisateur ajouté avec succès', 'success');
          this.closeUserModal();
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Supprimer ${user.fullName} ?`)) {
      this.adminService.deleteUser(user._id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u._id !== user._id);
          this.updateKPIs();
          this.showMessage('Utilisateur supprimé', 'success');
        },
        error: (err) => { console.error(err); }
      });
    }
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
    this.filterRole = 'ALL';
  }

  getStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'status-badge--active' : 'status-badge--inactive';
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'role-badge--admin';
      case 'CHARGE_CREDIT': return 'role-badge--manager';
      case 'ANALYST': return 'role-badge--analyst';
      default: return 'role-badge--user';
    }
  }

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
        this.showMessage('Profil mis à jour', 'success');
        this.closeProfileModal();
      },
      error: (err) => { console.error(err); }
    });
  }

  // Permissions methods
  openPermissionsModal(user: User): void {
    if (!this.hasPermission('manage_permissions')) {
      this.showMessage('Permission insuffisante', 'error');
      return;
    }
    this.editingUser = { ...user };
    this.selectedUserPermissions = [...(user.permissions || this.getDefaultPermissionsForRole(user.role))];
    this.showPermissionsModal = true;
  }

  closePermissionsModal(): void {
    this.showPermissionsModal = false;
    this.editingUser = null;
    this.selectedUserPermissions = [];
  }

  togglePermission(permissionId: string): void {
    const index = this.selectedUserPermissions.indexOf(permissionId);
    if (index > -1) {
      this.selectedUserPermissions.splice(index, 1);
    } else {
      this.selectedUserPermissions.push(permissionId);
    }
  }

  savePermissions(): void {
    if (!this.editingUser) return;
    this.loading = true;
    this.adminService.updatePermissions(this.editingUser._id, this.selectedUserPermissions).subscribe({
      next: () => {
        this.editingUser!.permissions = this.selectedUserPermissions;
        const index = this.users.findIndex(u => u._id === this.editingUser!._id);
        if (index !== -1) this.users[index].permissions = this.selectedUserPermissions;
        this.showMessage('Permissions mises à jour', 'success');
        this.closePermissionsModal();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getPermissionCategories(): string[] {
    return [...new Set(this.availablePermissions.map(p => p.category))];
  }

  getPermissionsByCategory(category: string): Permission[] {
    return this.availablePermissions.filter(p => p.category === category);
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.selectedUserPermissions.includes(permissionId);
  }

  // Utility methods
  getKPITrend(type: string): { value: string; positive: boolean } {
    const trends = { total: { value: '+12%', positive: true }, active: { value: '+8%', positive: true }, admin: { value: '+5%', positive: true } };
    return trends[type as keyof typeof trends] || { value: '0%', positive: true };
  }

  confirmLogout(): void {
    if (confirm('Voulez-vous vous déconnecter ?')) this.logout();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/login']);
      }
    });
  }

  showMessage(msg: string, type: 'success' | 'error' = 'success'): void {
    this.message = msg;
    setTimeout(() => { this.message = ''; }, 3000);
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.currentUser.photoUrl = reader.result as string;
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    };
    reader.readAsDataURL(file);
  }
}