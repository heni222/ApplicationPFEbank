import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  token: string = '';
  message: string = '';
  error: string = '';
  loading: boolean = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {
    // 🔥 نجيب token من URL
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }
  ngOnInit() {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }
  submit() {
    this.message = '';
    this.error = '';

    if (this.form.invalid) {
      this.error = 'Veuillez remplir les champs correctement';
      return;
    }

    const password = this.form.value.password as string;
    const confirmPassword = this.form.value.confirmPassword as string;

    if (password !== confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.loading = true;

    this.authService
      .resetPassword(this.token, password, confirmPassword)
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.message = res.message || 'Mot de passe modifié avec succès';

          // 🔥 يرجّع login بعد 2 ثواني
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Erreur';
        },
      });
  }
}
