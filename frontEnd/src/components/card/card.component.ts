// card.component.ts
import { ChangeDetectionStrategy, Component, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardElevation = 'flat' | 'sm' | 'md' | 'lg';
export type CardAccent    = 'none' | 'brand' | 'success';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [ngClass]="classes">
      @if (title || hasHeaderActions) {
        <header class="card__header">
          <span class="card__title">{{ title }}</span>
          <ng-content select="[slot=header-actions]" />
        </header>
      }
      <div class="card__body">
        <ng-content />
      </div>
      <ng-content select="[slot=footer]" />
    </div>
  `,
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() title       = '';
  @Input() elevation: CardElevation = 'md';
  @Input() accent: CardAccent       = 'none';
  @Input({ transform: booleanAttribute }) glass   = false;
  @Input({ transform: booleanAttribute }) hover   = false;
  @Input({ transform: booleanAttribute }) padded  = false;
  hasHeaderActions = false;

  get classes(): Record<string, boolean> {
    return {
      [`card--${this.elevation}`]:  true,
      'card--glass':                this.glass,
      'card--hover':                this.hover,
      'card--padded':               this.padded,
      'card--accent-top':           this.accent === 'brand',
      'card--accent-success':       this.accent === 'success',
    };
  }
}