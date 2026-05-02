// admin.service.ts (version complète avec toutes les fonctions)
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  cin?: string;
  phone?: string;
  address?: string;
  city?: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: 'ADMIN' | 'USER' | 'CHARGE_CREDIT' | 'ANALYST';
  permissions: string[];
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateProfileDTO {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  cin?: string;
  photoUrl?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  // ============================================
  // GESTION DU PROFIL (ADMIN)
  // ============================================

  getMe(): Observable<{ user: any }> {
    return this.http.get<{ user: any }>(`${this.apiUrl}/me`).pipe(
      tap((response) => {
        if (response.user) {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
      }),
      catchError(this.handleError)
    );
  }

  updateProfile(profileData: UpdateProfileDTO): Observable<{ user: any; message: string }> {
    return this.http.put<{ user: any; message: string }>(`${this.apiUrl}/profile`, profileData).pipe(
      tap((response) => {
        if (response.user) {
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          const updatedUser = { ...currentUser, ...response.user };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }),
      catchError(this.handleError)
    );
  }

  // ============================================
  // GESTION DES UTILISATEURS
  // ============================================

  // 🔥 Récupérer tous les utilisateurs
  getUsers(filters?: { status?: string; role?: string; search?: string }): Observable<User[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.role) params = params.set('role', filters.role);
      if (filters.search) params = params.set('search', filters.search);
    }
    
    return this.http.get<User[]>(`${this.apiUrl}/users`, { params })
      .pipe(catchError(this.handleError));
  }

  // 🔥 Récupérer un utilisateur par ID
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`)
      .pipe(catchError(this.handleError));
  }

  // 🔥 Créer un utilisateur
  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, userData)
      .pipe(catchError(this.handleError));
  }

  // 🔥 Mettre à jour un utilisateur
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}`, userData)
      .pipe(catchError(this.handleError));
  }

  // 🔥 Supprimer un utilisateur
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`)
      .pipe(catchError(this.handleError));
  }

  // 🔥 Activer / Désactiver utilisateur
  updateStatus(userId: string, status: 'ACTIVE' | 'INACTIVE'): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  // 🔥 Changer le rôle d'un utilisateur
  updateRole(userId: string, role: 'ADMIN' | 'USER' | 'CHARGE_CREDIT' | 'ANALYST'): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}/role`, { role })
      .pipe(catchError(this.handleError));
  }

  // 🔥 Mettre à jour les permissions d'un utilisateur
  updatePermissions(userId: string, permissions: string[]): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}/permissions`, { permissions })
      .pipe(catchError(this.handleError));
  }

  // 🔥 Réinitialiser le mot de passe d'un utilisateur
  resetUserPassword(userId: string): Observable<{ message: string; temporaryPassword: string }> {
    return this.http.post<{ message: string; temporaryPassword: string }>(`${this.apiUrl}/users/${userId}/reset-password`, {})
      .pipe(catchError(this.handleError));
  }

  // 🔥 Verrouiller/Déverrouiller un utilisateur
  toggleUserLock(userId: string, locked: boolean): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}/lock`, { locked })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // GESTION DES RÔLES
  // ============================================

  // 🔥 Récupérer tous les rôles
  getRoles(): Observable<{ id: string; name: string; description: string; permissions: string[]; userCount: number }[]> {
    return this.http.get<{ id: string; name: string; description: string; permissions: string[]; userCount: number }[]>(`${this.apiUrl}/roles`)
      .pipe(catchError(this.handleError));
  }

  // 🔥 Récupérer un rôle par ID
  getRoleById(roleId: string): Observable<{ id: string; name: string; description: string; permissions: string[]; userCount: number }> {
    return this.http.get<{ id: string; name: string; description: string; permissions: string[]; userCount: number }>(`${this.apiUrl}/roles/${roleId}`)
      .pipe(catchError(this.handleError));
  }

  // 🔥 Créer un nouveau rôle
  createRole(roleData: Partial<{ id: string; name: string; description: string; permissions: string[] }>): Observable<any> {
    return this.http.post(`${this.apiUrl}/roles`, roleData)
      .pipe(catchError(this.handleError));
  }

  // 🔥 Mettre à jour un rôle
  updateRoleDefinition(roleId: string, roleData: Partial<{ name: string; description: string; permissions: string[] }>): Observable<any> {
    return this.http.put(`${this.apiUrl}/roles/${roleId}`, roleData)
      .pipe(catchError(this.handleError));
  }

  // 🔥 Supprimer un rôle
  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${roleId}`)
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // GESTION DES PERMISSIONS
  // ============================================

  // 🔥 Récupérer toutes les permissions disponibles
  getPermissions(): Observable<{ id: string; name: string; description: string; category: string }[]> {
    return this.http.get<{ id: string; name: string; description: string; category: string }[]>(`${this.apiUrl}/permissions`)
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // GESTION DES ERREURS
  // ============================================

  private handleError(error: any): Observable<never> {
    console.error('AdminService Error:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Impossible de se connecter au serveur';
    } else if (error.status === 401) {
      errorMessage = 'Non autorisé - Veuillez vous reconnecter';
    } else if (error.status === 403) {
      errorMessage = 'Accès interdit - Permissions insuffisantes';
    } else if (error.status === 404) {
      errorMessage = 'Ressource non trouvée';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur - Veuillez réessayer plus tard';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}