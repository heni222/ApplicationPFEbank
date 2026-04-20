import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: 'ADMIN' | 'USER' | 'MANAGER';
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.scss',
})
export class DashboardAdminComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';
  message = '';
  searchTerm = '';
  filterStatus: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ALL';
  filterRole: 'ALL' | 'ADMIN' | 'USER' | 'MANAGER' = 'ALL';
  sidebarCollapsed = false;
  currentView = 'users';
  showUserModal = false;
  editingUser: User | null = null;
  showProfileModal = false;

  // Current user info (à remplacer par les vraies données de session)
 currentUser: any = {
  fullName: 'Admin User',
  email: 'admin@example.com',
  role: 'ADMIN',
  avatar: 'A',
  cin: '',
  dob: '',
  phone: '',
  address: '',
  city: '',
  employeeId: '',
  branch: '',
  department: '',
  jobTitle: '',
  manager: '',
  status: '',
  contractType: '',
  startDate: '',
  accessLevel: '',
  mfaMethod: '',
  enableFaceId: false,
  isVerified: false,
  newPassword: '',
  photoUrl: '',
};


  // Sidebar items
  sidebarItems: SidebarItem[] = [
    { id: 'overview', label: 'Aperçu', icon: '📊', active: true },
    { id: 'users', label: 'Utilisateurs', icon: '👥', active: false },
    { id: 'analytics', label: 'Analytiques', icon: '📈', active: false },
    { id: 'settings', label: 'Paramètres', icon: '⚙️', active: false },
  ];

  // KPI calculés
  totalUsers = 0;
  activeUsers = 0;
  adminUsers = 0;
  inactiveUsers = 0;
  managersCount = 0;
  regularUsersCount = 0;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private authService:AuthService,
  ) {}

  ngOnInit(): void {
    this.getUsers();
    this.setupKeyboardShortcuts();
    this.loadCurrentUser();

  }
loadCurrentUser(): void {
  this.authService.getMe().subscribe({
    next: (res) => {
      const user = res.user;

      this.currentUser = {
        ...user,
        avatar: (user.fullName || 'U').charAt(0).toUpperCase(),
        newPassword: ''
      };

      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    },
    error: (err) => {
      console.error("Erreur lors du chargement du profil", err);
    }
  });
}

  setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
      // Ctrl + P pour ouvrir le profil
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        this.openProfile();
      }
      // Ctrl + Q pour se déconnecter
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
    this.sidebarItems.forEach((item) => {
      item.active = item.id === viewId;
    });
    this.currentView = viewId;
  }

  // 🔥 Charger users
  getUsers(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getUsers().subscribe({
      next: (res: User[]) => {
        this.users = res;
        this.updateKPIs();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
      },
    });
  }

  updateKPIs(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter((u) => u.status === 'ACTIVE').length;
    this.adminUsers = this.users.filter((u) => u.role === 'ADMIN').length;
    this.inactiveUsers = this.users.filter(
      (u) => u.status === 'INACTIVE',
    ).length;
    this.managersCount = this.users.filter((u) => u.role === 'MANAGER').length;
    this.regularUsersCount = this.users.filter((u) => u.role === 'USER').length;
  }

  get filteredUsers(): User[] {
    let filtered = [...this.users];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term),
      );
    }

    // Status filter
    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter((user) => user.status === this.filterStatus);
    }

    // Role filter
    if (this.filterRole !== 'ALL') {
      filtered = filtered.filter((user) => user.role === this.filterRole);
    }

    return filtered;
  }

  // 🔥 Toggle status
  toggleStatus(user: User): void {
    const newStatus: 'ACTIVE' | 'INACTIVE' =
      user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    this.adminService.updateStatus(user._id, newStatus).subscribe({
      next: () => {
        user.status = newStatus;
        this.updateKPIs();
        this.showMessage(
          `Statut ${user.fullName} mis à jour avec succès`,
          'success',
        );
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors du changement de statut';
        this.showMessage('Erreur lors du changement de statut', 'error');
      },
    });
  }

  // 🔥 Change role
  changeRole(user: User, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newRole = target.value as User['role'];

    this.adminService.updateRole(user._id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        this.updateKPIs();
        this.showMessage(
          `Rôle de ${user.fullName} mis à jour avec succès`,
          'success',
        );
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors du changement de rôle';
        this.showMessage('Erreur lors du changement de rôle', 'error');
      },
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
      };
    }
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.editingUser = null;
  }

  saveUser(): void {
    if (this.editingUser) {
      // Simuler la sauvegarde - à adapter selon votre API
      if (this.editingUser._id) {
        // Update existing user
        const index = this.users.findIndex(
          (u) => u._id === this.editingUser?._id,
        );
        if (index !== -1) {
          this.users[index] = { ...this.editingUser };
          this.updateKPIs();
          this.showMessage(
            `${this.editingUser.fullName} a été modifié avec succès`,
            'success',
          );
        }
      } else {
        // Add new user (simulation)
        const newUser = {
          ...this.editingUser,
          _id: Date.now().toString(),
        };
        this.users.push(newUser);
        this.updateKPIs();
        this.showMessage(
          `${newUser.fullName} a été ajouté avec succès`,
          'success',
        );
      }
      this.closeUserModal();
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.fullName} ?`)) {
      // Simuler la suppression - à adapter selon votre API
      this.users = this.users.filter((u) => u._id !== user._id);
      this.updateKPIs();
      this.showMessage(
        `${user.fullName} a été supprimé avec succès`,
        'success',
      );
    }
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
    this.filterRole = 'ALL';
  }

  getStatusClass(status: string): string {
    return status === 'ACTIVE'
      ? 'status-badge--active'
      : 'status-badge--inactive';
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'role-badge--admin';
      case 'MANAGER':
        return 'role-badge--manager';
      default:
        return 'role-badge--user';
    }
  }

  // Profile methods
  openProfile(): void {
    this.showProfileModal = true;
    this.setActiveView('profile');
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  updateProfile(): void {
    // Mettre à jour le profil dans le localStorage
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.showMessage('Profil mis à jour avec succès', 'success');
    this.closeProfileModal();
  }

  // Logout methods
  confirmLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.logout();
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // 🔥 تنظيف local storage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');

        // 🔥 message
        this.showMessage('Déconnexion réussie', 'success');

        // 🔥 redirect
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },

      error: (err) => {
        console.error('Logout error:', err);
        this.router.navigate(['/login']);
      },
    });
  }

  // 🔥 Message
  showMessage(msg: string, type: 'success' | 'error' = 'success'): void {
    this.message = msg;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  // KPI Trends (simulés)
  getKPITrend(type: string): { value: string; positive: boolean } {
    const trends = {
      total: { value: '+12%', positive: true },
      active: { value: '+8%', positive: true },
      admin: { value: '+5%', positive: true },
    };
    return (
      trends[type as keyof typeof trends] || { value: '0%', positive: true }
    );
  }
  onProfileImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = () => {
    this.currentUser.photoUrl = reader.result as string;

    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.showMessage('Photo mise à jour avec succès', 'success');
  };

  reader.readAsDataURL(file);
}
}
