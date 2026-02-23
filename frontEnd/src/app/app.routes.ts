import { Routes } from '@angular/router';
import { HomeComponent } from '../pages/home/home.component';
import { AboutComponent } from '../pages/about/about.component';
import { LoginComponent } from '../pages/login/login.component';
import { SignupComponent } from '../pages/sing-up/sing-up.component';
import { ReinitialisationComponent } from '../pages/reinitialisation/reinitialisation.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'login', component: LoginComponent },
  { path: 'singUp', component: SignupComponent },
  { path: 'forgot-password', component: ReinitialisationComponent },
];
