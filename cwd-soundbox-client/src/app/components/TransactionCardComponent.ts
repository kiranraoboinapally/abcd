import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="card">
      <div class="card-header">
        <h3 class="heading">{{ heading }}</h3>
        <img *ngIf="icon" [src]="icon" alt="" class="icon" />
      </div>
      <div class="count" [style.color]="countColor">{{ count | number }}</div>
      <div class="description">{{ description }}</div>
    </div>
  `,
  styles: [`
.card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 15px 34px 10px;
  gap: 10px;

  border: 2px solid #B0B8C1; /* light grey with a blue tint */
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  background-color: #FFFFFF;

  width: 393px;
  height: 150px;
}


    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .heading {
      font-family: 'Nunito Sans', sans-serif;
      font-weight: 500;
      font-size: 18px;
      line-height: 27px;
      max-width: 70%;
      margin: 0;
      color: #1D1D1D;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .icon {
      width: 30px;
      height: 30px;
    }

    .count {
      font-family: 'Nunito Sans', sans-serif;
      font-weight: 700;
      font-size: 36px;
      line-height: 55px;
    }

    .description {
      font-family: 'Nunito Sans', sans-serif;
      font-weight: 400;
      font-size: 14px;
      color: #908F8F;
      line-height: 20px;
    }
  `]
})
export class TransactionCardComponent {
  @Input() heading!: string;
  @Input() icon?: string;
  @Input() count!: number;
  @Input() description!: string;
  @Input() countColor: string = '#C1212F'; // Default if not provided
}
