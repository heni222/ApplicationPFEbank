import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  showError(controlName: 'email'): boolean {
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
      await new Promise((res) => setTimeout(res, 900));

      this.message =
        "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.";
    } catch {
      this.message = "Erreur lors de l’envoi. Veuillez réessayer.";
    } finally {
      this.loading = false;
    }
  }
}
