// badge.component.ts
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'badge--' + variant">
      @if (dot) { <span class="badge__dot"></span> }
      <ng-content />
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      letter-spacing: 0.01em;

      &__dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
      }

      &--success { color: var(--color-success); background: var(--color-success-light); }
      &--warning { color: var(--color-warning); background: var(--color-warning-light); }
      &--danger  { color: var(--color-danger);  background: var(--color-danger-light);  }
      &--info    { color: var(--color-brand);   background: var(--color-brand-light);   }
      &--neutral { color: var(--color-ink-secondary); background: var(--color-surface-2); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'info';
  @Input() dot = false;
}