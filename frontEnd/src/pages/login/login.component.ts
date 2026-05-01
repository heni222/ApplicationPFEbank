import { CommonModule } from '@angular/common'; // Module Angular de base (ngIf, ngFor, etc.)
import { Component } from '@angular/core'; // Décorateur pour créer un composant
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Outils pour les formulaires réactifs
import { Router, RouterLink } from '@angular/router'; // Navigation entre les pages
import { AuthService } from '../../services/auth.service'; // Service d'authentification

@Component({
  selector: 'app-login', // Nom du composant utilisé dans le HTML
  standalone: true, // Composant autonome (sans module)
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // Modules utilisés
  templateUrl: './login.component.html', // Fichier HTML
  styleUrl: './login.component.scss', // Fichier CSS/SCSS
})
export class LoginComponent {
  hidePassword = true; // Permet de masquer/afficher le mot de passe
  loading = false; // Indique si une opération est en cours
  message = ''; // Message pour afficher les erreurs ou infos
  form; // Formulaire

  constructor(
    private fb: FormBuilder, // Pour créer le formulaire
    private router: Router, // Pour rediriger entre les pages
    private authservice: AuthService, // Service login
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Champ email obligatoire + format email
      password: ['', [Validators.required, Validators.minLength(6)]], // Mot de passe obligatoire + min 6 caractères
      remember: [true], // Option "se souvenir de moi"
    });
  }

  showError(controlName: 'email' | 'password'): boolean {
    const c = this.form.get(controlName); // Récupérer le champ
    return !!c && c.invalid && (c.dirty || c.touched);
    // Retourne true si le champ est invalide et modifié/touché
  }

  login() {
    this.message = ''; // Réinitialiser le message

    if (this.form.invalid) {
      // Si le formulaire est invalide
      this.form.markAllAsTouched(); // Marquer tous les champs pour afficher les erreurs
      return; // Stop
    }

    this.loading = true; // Activer le loading
    console.log(this.form.value); // Afficher les données dans la console

    try {
      this.authservice.login(this.form.value).subscribe({
        next: () => {
          // نجيب user من backend
          this.authservice.checkAuth();
          this.authservice.getMe().subscribe((res) => {
            const user = res.user;

            if (user.role === 'ADMIN') {
              this.router.navigate(['/dashboard_admin']);
            } else if (user.role === 'CREDIT') {
              this.router.navigate(['/dashboard_credit']);
            } else if (user.role === 'RISK') {
              this.router.navigate(['/dashboard_analyste']);
            }
          });
        },
      });
    } catch (e) {
      // Gestion d'erreur générale (ne capture pas les erreurs du subscribe)
      this.message = 'Échec de connexion. Vérifiez vos identifiants.';
    } finally {
      this.loading = false; // Désactiver le loading
    }
  }
}
