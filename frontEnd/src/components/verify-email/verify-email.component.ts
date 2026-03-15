import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule,RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent {
token: string | null = null;
  verificationStatus: 'pending' | 'success' | 'error' = 'pending';
  errorMessage: string = '';
  userEmail: string = '';
  showResendForm: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.verifyEmail();
      }
    });

    // Alternative avec paramètre dans le chemin
    this.route.paramMap.subscribe(params => {
      if (!this.token) {
        this.token = params.get('token');
        if (this.token) {
          this.verifyEmail();
        }
      }
    });
  }

  verifyEmail() {
    if (this.token) {
      this.authService.verifyEmail(this.token).subscribe({
        next: (response) => {
          this.verificationStatus = 'success';
          // Redirection automatique après 3 secondes
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 3000);
        },
        error: (error) => {
          this.verificationStatus = 'error';
          this.errorMessage = error.error?.message || 'Le lien de vérification est invalide ou a expiré.';
          this.showResendForm = true;
        }
      });
    }
  }

 
}
