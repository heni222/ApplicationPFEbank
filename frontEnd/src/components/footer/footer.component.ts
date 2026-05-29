import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  imports: [ReactiveFormsModule,FormsModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();
  // Dans le composant HomeComponent
  newsletterEmail: string = '';

  onNewsletterSubmit() {
    if (this.newsletterEmail && this.newsletterEmail.includes('@')) {
      console.log('Newsletter subscription:', this.newsletterEmail);
      // Ici, appelez votre service d'inscription à la newsletter
      this.newsletterEmail = '';
      // Afficher une notification de succès
    }
  }
}
