import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
<div
  class="box-border flex flex-col justify-center items-start p-[15px_34px_10px] gap-2.5
         border-2 border-[#B0B8C1] rounded-[10px] shadow-[0_2px_6px_rgba(0,0,0,0.05)] bg-white
         w-[393px] h-[150px]"
>
  <div class="flex justify-between items-center w-full">
    <h3
      class="font-nunito font-medium text-[18px] leading-[27px] max-w-[70%] m-0
             text-[#1D1D1D] whitespace-nowrap overflow-hidden text-ellipsis"
    >
      {{ heading }}
    </h3>
    <img *ngIf="icon" [src]="icon" alt="" class="w-[30px] h-[30px]" />
  </div>

  <div
    class="font-nunito font-extrabold text-[36px] leading-[55px]"
    [style.color]="countColor"
  >
    {{ count | number }}
  </div>

  <div
    class="font-nunito font-normal text-[14px] leading-[20px] text-[#908F8F]"
  >
    {{ description }}
  </div>
</div>
  `
})
export class TransactionCardComponent {
  @Input() heading!: string;
  @Input() icon?: string;
  @Input() count!: number;
  @Input() description!: string;
  @Input() countColor: string = '#C1212F'; // Default if not provided
}
