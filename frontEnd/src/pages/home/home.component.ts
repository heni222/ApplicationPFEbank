// home.component.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink }    from '@angular/router';
import { BtnComponent }  from '../../components/button/button.component';
import { CardComponent } from '../../components/card/card.component';
import { BadgeComponent } from '../../components/badge/badge.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, BtnComponent, CardComponent, BadgeComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  theme = signal<'light' | 'dark'>('light');

  toggleTheme() {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '');
  }

  features = [
    {
      icon: '📁',
      label: 'Dossiers de crédit',
      desc: 'Création, saisie et suivi du statut en temps réel. Historique complet et traçabilité.',
      link: '/dossiers',
      linkLabel: 'Gérer les dossiers',
      badge: 'info' as const,
      badgeText: 'Actif',
    },
    {
      icon: '🧠',
      label: 'Scoring de risque',
      desc: 'Modèle ML basé sur ratio d\'endettement, capacité de remboursement et stabilité.',
      link: '/scoring',
      linkLabel: 'Explorer le scoring',
      badge: 'success' as const,
      badgeText: 'ML v2',
    },
    {
      icon: '📊',
      label: 'Dashboard décisionnel',
      desc: 'Répartition des statuts, niveaux de risque et visualisations analytiques.',
      link: '/dashboard',
      linkLabel: 'Voir le dashboard',
      badge: 'neutral' as const,
      badgeText: 'Live',
    },
    {
      icon: '🔐',
      label: 'Authentification sécurisée',
      desc: 'Connexion robuste avec gestion des rôles, sessions chiffrées et audit log.',
      link: '/auth/login',
      linkLabel: 'Se connecter',
      badge: 'warning' as const,
      badgeText: 'Sécurisé',
    },
  ];

  steps = [
    { n: '01', title: 'Créer un dossier', desc: 'Saisir les informations client et télécharger les pièces justificatives requises.' },
    { n: '02', title: 'Calculer le risque', desc: 'Générer automatiquement un score et une classification faible / moyen / élevé.' },
    { n: '03', title: 'Décider & suivre',  desc: 'Mettre à jour le statut du dossier et consulter les indicateurs décisionnels.' },
  ];

  kpis = [
    { value: '3', label: 'Rôles métiers',    sub: 'Admin · Crédit · Risque' },
    { value: '4', label: 'Statuts dossier',  sub: 'En cours · Analyse · Accepté · Refusé' },
    { value: 'ML', label: 'Scoring risque',  sub: 'Faible · Moyen · Élevé' },
  ];
}