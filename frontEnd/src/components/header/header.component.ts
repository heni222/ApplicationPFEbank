import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLinkActive,RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
isMenuOpen = false;
  isScrolled = false;

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }
  closeMenu() { this.isMenuOpen = false; }

  openHelp() {
    // TODO: ouvrir un drawer / modal aide
    alert('Aide: consultez la documentation ou contactez l’admin.');
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 6;
  }
}
