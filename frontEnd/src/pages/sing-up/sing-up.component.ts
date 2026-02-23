import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
  FormGroup,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';

function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sing-up.component.html',
  styleUrl: './sing-up.component.scss',
})
export class SignupComponent implements OnInit {
  hidePassword = true;
  loading = false;
  message = '';

  branches = ['Tunis Centre', 'Lac 2', 'Sfax', 'Sousse', 'Ariana'];

  selectedBadgePhoto: File | null = null;

  // ✅ Déclaration correcte
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    // ✅ this.form (pas "form")
    this.form = this.fb.group(
      {
        // ===== Identité =====
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        cin: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]],
        dob: ['', [Validators.required]],
        phone: ['', [Validators.required, Validators.pattern(/^\+?\d[\d\s-]{7,}$/)]],
        address: ['', [Validators.required, Validators.minLength(5)]],
        city: ['', [Validators.required]],

        // ===== Organisation =====
        employeeId: ['', [Validators.required, Validators.minLength(3)]],
        branch: ['', [Validators.required]],
        department: ['', [Validators.required]],
        jobTitle: ['', [Validators.required, Validators.minLength(2)]],
        manager: [''],
        contractType: ['', [Validators.required]],
        startDate: ['', [Validators.required]],

        // ===== Accès & Sécurité =====
        email: ['', [Validators.required, Validators.email]],
        role: ['', [Validators.required]],
        accessLevel: ['', [Validators.required]],
        mfaMethod: ['', [Validators.required]],
        enableFaceId: [true],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        terms: [false, [Validators.requiredTrue]],
      },
      { validators: [matchPasswords] },
    );
  }

  get passwordMismatch(): boolean {
    return !!this.form?.errors?.['passwordMismatch'];
  }

  showError(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedBadgePhoto = input.files?.[0] ?? null;
  }

  async onSubmit() {
    this.message = '';

    if (this.form.invalid || this.passwordMismatch) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    try {
      await this.userService.createCompte(
        this.form.value,
        this.selectedBadgePhoto
      ).toPromise();

      this.message = 'Compte créé avec succès ✅';
      this.router.navigateByUrl('/auth/login');

    } catch {
      this.message = "Échec d'inscription.";
    } finally {
      this.loading = false;
    }
  }
}
