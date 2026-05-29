// button.component.ts
import {
  ChangeDetectionStrategy, Component, Input, booleanAttribute
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type BtnSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BtnComponent {
  @Input() variant: BtnVariant = 'primary';
  @Input() size: BtnSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading   = false;
  @Input({ transform: booleanAttribute }) full      = false;
  @Input() iconLeft  = '';
  @Input() iconRight = '';

  get classes(): Record<string, boolean> {
    return {
      [`btn--${this.variant}`]: true,
      [`btn--${this.size}`]:    true,
      'btn--loading':           this.loading,
      'btn--full':              this.full,
    };
  }
}