import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLinkActive, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
// Dans le composant
export class HeaderComponent {
  theme = signal<'light' | 'dark'>('light');
  isScrolled = false;
  mobileMenuOpen = false;

  ngOnInit() {
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  handleScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', this.theme() === 'dark');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    document.body.style.overflow = this.mobileMenuOpen ? 'hidden' : '';
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }
}