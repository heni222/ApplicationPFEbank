import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reinitialisation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reinitialisation.component.html',
  styleUrls: ['./reinitialisation.component.scss'], // ✅ tableau obligatoire
})
export class ReinitialisationComponent {
  loading = false;
  message = '';
  form!: FormGroup;
  error: any;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  showError(controlName: 'email'): boolean {
    const c = this.form.get(controlName);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  onSubmit() {
    const email = this.form.value.email;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        console.log(res);
        this.message = res.message;
      },
      error: (err) => {
        this.error = err.error.message;
      },
    });
  }
}
