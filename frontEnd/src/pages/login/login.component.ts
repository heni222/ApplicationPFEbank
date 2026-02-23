import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  hidePassword = true;
  loading = false;
  message = '';
  form;
  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true],
    });
  }

  showError(controlName: 'email' | 'password'): boolean {
    const c = this.form.get(controlName);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  async onSubmit() {
    this.message = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      // TODO: ici tu appelles ton AuthService (API)
      // Simulation:
      await new Promise((res) => setTimeout(res, 700));

      // Exemple: redirection après succès
      this.router.navigateByUrl('/home');
    } catch (e) {
      this.message = 'Échec de connexion. Vérifiez vos identifiants.';
    } finally {
      this.loading = false;
    }
  }

  async onFaceLogin() {
    this.message = '';
    this.loading = true;

    try {
      // TODO: ici tu déclenches le flow webcam/FaceID (OpenCV/DeepFace côté backend)
      await new Promise((res) => setTimeout(res, 900));
      this.message = 'FaceID (démo) : authentification réussie ✅';
      this.router.navigateByUrl('/home');
    } catch (e) {
      this.message =
        'FaceID indisponible. Réessayez ou utilisez le login classique.';
    } finally {
      this.loading = false;
    }
  }
}
