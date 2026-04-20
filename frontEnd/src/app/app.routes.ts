import { Routes } from '@angular/router';
import { HomeComponent } from '../pages/home/home.component';
import { AboutComponent } from '../pages/about/about.component';
import { LoginComponent } from '../pages/login/login.component';
import { SignupComponent } from '../pages/sing-up/sing-up.component';
import { ReinitialisationComponent } from '../pages/reinitialisation/reinitialisation.component';
import { VerifyEmailComponent } from '../components/verify-email/verify-email.component';
import { DashboardAdminComponent } from '../Admin/dashboard-admin/dashboard-admin.component';
import { authGuard } from '../guards/auth.guard';
import { roleGuard } from '../guards/role.guard';
import { ResetPasswordComponent } from '../pages/reset-password/reset-password.component';
 
export const routes: Routes = [
  // ─── Routes publiques ───────────────────────────────────────────────
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'singUp', component: SignupComponent },
  { path: 'forgot-password', component: ReinitialisationComponent },
  { path: 'auth/verify-email', component: VerifyEmailComponent },
  {path: 'reset-password/:token',component: ResetPasswordComponent},
 
  // ─── Routes protégées par rôle ──────────────────────────────────────
  {
    path: 'dashboard_admin',
    component: DashboardAdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'dashboard_credit',
    component: DashboardAdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CREDIT'] },
  },
  {
    path: 'dashboard_analyste',
    component: DashboardAdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['RISK'] },
  },
 
  // ─── 404 ────────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'home' },
];