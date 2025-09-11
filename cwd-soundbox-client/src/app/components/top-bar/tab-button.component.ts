import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="tab-button"
      [class.active]="active"
      (click)="tabClick.emit()"
      [attr.aria-pressed]="active"
    >
      <img
        *ngIf="icon"
        [src]="icon"
        alt=""
        class="tab-icon"
        [class.active-icon]="active"
        aria-hidden="true"
      />
      <span class="tab-label">{{ label }}</span>
    </button>
  `,
  styles: [`
    button.tab-button {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 8px 12px;
      gap: 8px;
      background: #F8FAFB;
      border-radius: 30px;
      border: none;
      cursor: pointer;
      font-family: 'Nunito Sans', sans-serif;
      font-weight: 400;
      font-size: 16px;
      color: #908F8F;
      box-shadow: 0px 1px 7.5px 1px rgba(29, 29, 29, 0.1);
      transition: color 0.3s, background-color 0.3s;
    }

    button.tab-button.active {
      color: #C1212F;
      background: #F9EEEF;
      box-shadow: 0px 0px 10px #C1212F;
    }

    .tab-icon {
      width: 20px;
      height: 20px;
      filter: grayscale(100%) brightness(80%);
      transition: filter 0.3s;
    }

    .tab-icon.active-icon {
      filter: brightness(0) saturate(100%) invert(18%) sepia(84%) saturate(4534%) hue-rotate(352deg) brightness(95%) contrast(106%);
    }

    .tab-label {
      display: flex;
      align-items: center;
    }
  `]
})
export class TabButtonComponent {
  @Input() label!: string;
  @Input() icon?: string;
  @Input() active = false;

  @Output() tabClick = new EventEmitter<void>();
}
