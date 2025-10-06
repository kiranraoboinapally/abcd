import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="flex flex-row items-center justify-center px-3 py-2 gap-2 bg-gray-50 rounded-full border-none cursor-pointer font-nunito text-base text-gray-500 shadow-md transition-colors duration-300"
      [class]="active ? 'text-redCustom bg-red-50 shadow-[0_0_10px_#C1212F]' : ''"
      (click)="tabClick.emit()"
      [attr.aria-pressed]="active"
    >
      <img
        *ngIf="icon"
        [src]="icon"
        alt=""
        class="w-5 h-5 grayscale brightness-75 transition-filter duration-300"
        [class]="active ? 'filter-active-icon' : ''"
        aria-hidden="true"
      />
      <span class="flex items-center">{{ label }}</span>
    </button>
  `
})
export class TabButtonComponent {
  @Input() label!: string;
  @Input() icon?: string;
  @Input() active = false;

  @Output() tabClick = new EventEmitter<void>();
}