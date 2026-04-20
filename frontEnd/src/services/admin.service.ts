import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) {}

  // 🔥 récupérer users
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  // 🔥 activer / désactiver user
  updateStatus(userId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/status`, {
      status
    });
  }

  // 🔥 changer rôle
  updateRole(userId: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/role`, {
      role
    });
  }
}