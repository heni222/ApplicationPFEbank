import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
private apiUrl = '/api/auth';

  // 🔥 état login
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // 🔥 user (اختياري)
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ✅ vérifier email
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-email?token=${token}`);
  }

  // ✅ login
  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data, {
      withCredentials: true, // 🔥 لازم
    });
  }
  // ✅ récupérer user depuis cookie
  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`, {
      withCredentials: true,
    });
  }

  // 🔥 check auth au démarrage
  checkAuth() {
    this.getMe().subscribe({
      next: (res) => {
        this.isLoggedInSubject.next(true);
        this.userSubject.next(res.user);
      },
      error: () => {
        this.isLoggedInSubject.next(false);
        this.userSubject.next(null);
      },
    });
  }

  // 🔥 après login
  setLoggedIn(user: any) {
    this.isLoggedInSubject.next(true);
    this.userSubject.next(user);
  }

  // 🔥 logout
  logout(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  clearAuth() {
    this.isLoggedInSubject.next(false);
    this.userSubject.next(null);
  }
  // 🔥 forgot password (envoyer email)
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  // 🔥 reset password
  resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password/${token}`, {
      password,
      confirmPassword,
    });
  }
}
