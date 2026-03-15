// ===== Import les modules =====
import { CommonModule } from '@angular/common'; // directives de base: ngIf, ngFor ...
import { Component, OnInit } from '@angular/core'; // باش نعملو component و نستعملو OnInit
import {
  AbstractControl, // كل input/field في الفورم
  FormBuilder,     // باش نبنيو الفورم بسهولة
  ReactiveFormsModule, // module متاع Reactive Forms
  ValidationErrors, // نوع الخطأ اللي يرجع validation
  Validators,       // قواعد validation (required, pattern, minLength...)
  FormGroup,        // مجموعة inputs
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // باش نعملو navigation
import { UserService } from '../../services/user.service'; // service باش نعملو calls لل backend

// ===== Validator custom باش يتأكد اللي password = confirmPassword =====
function matchPasswords(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value; // ناخذ password
  const confirm = control.get('confirmPassword')?.value; // ناخذ confirmPassword
  if (!password || !confirm) return null; // إذا واحد فارغ، ما نعملوش validation
  return password === confirm ? null : { passwordMismatch: true }; // إذا ما يتساووش، نرجعو erreur
}

// ===== Déclaration du component =====
@Component({
  selector: 'app-signup', // الاسم اللي باش نستعملوه في HTML
  standalone: true,       // component مستقل
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // الموديولات اللي باش نستعملو
  templateUrl: './sing-up.component.html', // HTML متاعو
  styleUrl: './sing-up.component.scss',    // CSS/SCSS
})
export class SignupComponent implements OnInit {
  hidePassword = true; // باش نخبو password
  loading = false;     // loader وقت اللي form يبعث
  message = '';        // رسالة نجاح ولا خطأ

  branches = ['Tunis Centre', 'Lac 2', 'Sfax', 'Sousse', 'Ariana']; // list des branches

  selectedBadgePhoto: File | null = null; // نخزنو photo متاع badge

  form!: FormGroup; // الفورم

  // ===== constructeur =====
  constructor(
    private fb: FormBuilder, // باش نبنيو form
    private router: Router,  // باش نعملو redirect
    private userService: UserService, // service باش نبعثو بيانات لل backend
  ) {}

  // ===== ngOnInit =====
  ngOnInit(): void {
    // نبنيو الفورم و نحددو كل field + validators
    this.form = this.fb.group(
      {
        // ===== Identité =====
        fullName: ['', [Validators.required, Validators.minLength(3)]], // الاسم كامل
        cin: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(12)]], // CIN
        dob: ['', [Validators.required]], // تاريخ الميلاد
        phone: ['', [Validators.required, Validators.pattern(/^\+?\d[\d\s-]{7,}$/)]], // téléphone
        address: ['', [Validators.required, Validators.minLength(5)]], // adresse
        city: ['', [Validators.required]], // ville

        // ===== Organisation =====
        employeeId: ['', [Validators.required, Validators.minLength(3)]], // ID employé
        branch: ['', [Validators.required]], // branch
        department: ['', [Validators.required]], // département
        jobTitle: ['', [Validators.required, Validators.minLength(2)]], // poste
        manager: [''], // manager optionnel
        contractType: ['', [Validators.required]], // type de contrat
        startDate: ['', [Validators.required]], // date de début

        // ===== Accès & Sécurité =====
        email: ['', [Validators.required, Validators.email]], // email
        role: ['', [Validators.required]], // rôle
        accessLevel: ['', [Validators.required]], // niveau d'accès
        mfaMethod: ['', [Validators.required]], // méthode MFA
        enableFaceId: [true], // FaceID activé par défaut

        password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]], // password
        confirmPassword: ['', [Validators.required]], // confirmation password
        terms: [false, [Validators.requiredTrue]], // accepter termes
      },
      { validators: [matchPasswords] }, // validator custom pour password
    );
  }

  // ===== Getter باش نعرفو passwords mismatch =====
  get passwordMismatch(): boolean {
    return !!this.form?.errors?.['passwordMismatch'];
  }

  // ===== function باش نورّي الأخطاء في input =====
  showError(controlName: string): boolean {
    const c = this.form.get(controlName);
    return !!c && c.invalid && (c.dirty || c.touched); // إذا invalid و المستخدم لمسّو ولا غيرو
  }

  // ===== وقت يبدل المستخدم الصورة =====
  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.selectedBadgePhoto = input.files?.[0] ?? null; // ناخذ أول ملف
  }

  // ===== submit du form =====
  create() {
    this.message = '';

    // vérifier si form valide ou password mismatch
    if (this.form.invalid || this.passwordMismatch) {
      this.form.markAllAsTouched(); // نعلمو كل inputs touché باش يبان الأخطاء
      this.showToast('Corrige les erreurs du formulaire.', 'error'); // message erreur
      return;
    }

    this.loading = true; // activer loader

    // envoyer données + photo au backend
    this.userService.createCompte(this.form.value, this.selectedBadgePhoto)
      .subscribe({
        next: (res) => {
          this.showToast('Compte créé avec succès ✅', 'success'); // message succès
          console.log(this.form.value); // afficher valeurs
          this.loading = false; // désactiver loader
          setTimeout(() => this.router.navigateByUrl('/login'), 1000); // redirection login
        },
        error: (err) => {
          console.error(err);
          this.showToast(err?.error?.error || 'Erreur lors de la création', 'error'); // message erreur
        },
      });
  }

  // ===== Toast pour messages =====
  toast = {
    show: false,
    type: 'success' as 'success' | 'error' | 'info',
    text: '',
  };

  showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toast = { show: true, type, text };
    setTimeout(() => (this.toast.show = false), 3500); // hide message après 3.5s
  }
}