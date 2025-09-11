



import {
  Component,
  signal,
  computed,
  Input,
  Output,
  EventEmitter,
  OnInit,
  effect,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../src/environments/environment';

interface Transaction {
  transactionsId: string;
  deviceID: string;
  amount: number;
  mlOutput: string; // exactly backend anomaly_detected value
  confidence: string;
  timeStamp: string;
  review: string; // show exactly backend review, empty string if null
}

@Component({
  selector: 'app-fraud-results-table',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="fraud-results-container">
      <div class="fraud-header">
        <img src="assets/icons/10.svg" class="fraud-icon" alt="Fraud Icon" />
        <div class="fraud-title">ML Fraud Detection Results</div>
      </div>

      <div *ngIf="successMessage()" class="success-message">
        {{ successMessage() }}
      </div>

      <div class="fraud-table">
        <div class="table-header">
          <div class="col">Transactions ID</div>
          <div class="col">Device ID</div>
          <div class="col">Amount</div>
          <div class="col">Anomaly Detected</div>
          <div class="col">Confidence</div>
          <div class="col">Timestamp</div>
          <div class="col">Review</div>
        </div>

        <div class="table-body" tabindex="0">
          <ng-container *ngFor="let row of paginatedData(); trackBy: trackByTransactionId">
            <div class="table-row">
              <div class="col">{{ row.transactionsId }}</div>
              <div class="col">{{ row.deviceID }}</div>
              <div class="col">{{ row.amount }}</div>
              <div class="col">{{ row.mlOutput }}</div>
              <div class="col">{{ row.confidence }}</div>
              <div class="col">{{ row.timeStamp | date: 'short' }}</div>
              <div
                class="col review-cell"
                (click)="toggleExpand(row.transactionsId)"
                style="cursor: pointer;"
              >
                <ng-container *ngIf="row.mlOutput === 'Yes'; else showReviewText">
                  <img
                    src="assets/icons/18.svg"
                    alt="Review Icon"
                    class="review-icon"
                    [class.orange]="!row.review"
                    [class.red]="row.review === 'Yes'"
                    [class.green]="row.review === 'No'"
                  />
                </ng-container>
                <ng-template #showReviewText>
                  <ng-container *ngIf="row.review !== 'No'">
                    {{ row.review }}
                  </ng-container>
                </ng-template>
              </div>
            </div>

            <div *ngIf="expandedRow() === row.transactionsId" class="review-panel">
              <div class="question-text">Is this fraud activity?</div>
              <div class="btn-group">
                <button
                  class="btn yes-btn"
                  [disabled]="row.review === 'Yes'"
                  (click)="submitReview(row.transactionsId, 'Yes')"
                >
                  Yes
                </button>
                <button
                  class="btn no-btn"
                  [disabled]="row.review === 'No'"
                  (click)="submitReview(row.transactionsId, 'No')"
                >
                  No
                </button>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <div class="fraud-summary">
        <div class="summary-left">
          <span>Total Transactions - {{ totalItems() }}</span>
          <span>Review Required - {{ reviewCount() }}</span>
        </div>
        <div class="summary-right ml-status">
          <img src="assets/icons/Vector.svg" alt="Status Icon" />
          ML Model Performance : Active
        </div>
      </div>

      <div class="pagination-controls">
        <button (click)="prevPage()" [disabled]="currentPage() === 1">‹</button>
        <span>{{ startItem() }} – {{ endItem() }} of {{ totalItems() }}</span>
        <button (click)="nextPage()" [disabled]="currentPage() === totalPages()">›</button>
      </div>
    </div>
  `,
  styles: [
    `
      /* ... your existing styles ... */







      .fraud-results-container {
        width: auto;
        height: 527px;
        padding: 16px;
        box-sizing: border-box;
        background: #fff;
        border: 1px solid #dbe5ea;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        font-family: 'Nunito Sans', sans-serif;
        user-select: none;
      }
      .fraud-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }
      .fraud-icon {
        width: 25px;
        height: 25px;
        margin-right: 10px;
      }
      .fraud-title {
        font-size: 16px;
        font-weight: 600;
        color: #1d1d1d;
      }
      .fraud-table {
        border: 1px solid #eee;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-height: 0;
        overflow: hidden;
      }
      .table-header {
        display: flex;
        width: 100%;
        height: 60px;
        align-items: center;
        border-bottom: 1px solid #eee;
        font-weight: bold;
        font-size: 13px;
        background-color: #f5f7fa;
        color: #1d1d1d;
        padding: 0 8px;
        box-sizing: border-box;
        user-select: none;
      }
      .table-body {
        height: calc(70px * 4 + 24px);
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px 2px 0 8px;
        box-sizing: border-box;
        scrollbar-width: thin;
        scrollbar-color: #ccc transparent;
        display: flex;
        flex-direction: column;
        gap: 64px;
      }
      .table-body::-webkit-scrollbar {
        width: 8px;
      }
      .table-body::-webkit-scrollbar-thumb {
        background-color: #ccc;
        border-radius: 4px;
      }
      .table-row {
        display: flex;
        width: 100%;
        height: 70px;
        align-items: center;
        font-size: 13px;
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 0 4px;
        box-sizing: border-box;
        user-select: text;
        background-color: #fff;
        transition: background-color 0.2s ease;
      }
      .table-row:hover {
        background-color: #f0f8ff;
      }
      .col {
        width: 14.28%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 6px;
      }
      .fraud-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 40px;
        font-size: 14px;
        color: #414454;
        border-top: 1px solid #eee;
        padding: 0 8px;
        box-sizing: border-box;
        margin-top: 4px;
        user-select: none;
      }
      .summary-left {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        align-items: center;
      }
      .summary-right {
        display: flex;
        align-items: center;
        gap: 6px;
        color: green;
        font-size: 14px;
      }
      .summary-right img {
        width: 16px;
        height: 16px;
      }
      .pagination-controls {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        margin-top: 6px;
        user-select: none;
      }
      .pagination-controls button {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #3182ce;
        padding: 2px 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }
      .pagination-controls button:hover:not(:disabled) {
        background-color: #dbeafe;
      }
      .pagination-controls button:disabled {
        color: #ccc;
        cursor: not-allowed;
        background: none;
      }

      .review-panel {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 2px;
        border: 1px solid #eee;
        background-color: #f9f9f9;
        width: 100%;
      }

      .question-text {
        flex-grow: 1;
        font-size: 15px;
        line-height: 1;
        margin-right: 16px;
        text-align: right;
      }

      .btn-group {
        display: flex;
        gap: 8px;
        padding: 2px 2px 2px 2px;
      }

      .btn {
        width: 46px;
        height: 30px;
        font-size: 15px;
        line-height: 1;
        border: 1px solid;
        background: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        user-select: none;
      }

      .yes-btn {
        border-color: green;
        color: green;
      }

      .no-btn {
        border-color: red;
        color: red;
      }

      .success-message {
        background-color: #d1fae5;
        color: #065f46;
        padding: 8px;
        border-radius: 6px;
        margin-bottom: 10px;
        font-size: 14px;
        font-weight: 500;
      }
 
      .review-icon {
        width: 25x;
        height: 25px;
        filter: invert(48%) sepia(74%) saturate(3855%) hue-rotate(10deg) brightness(100%) contrast(104%);
        transition: filter 0.3s ease;
      }

      .review-icon.orange {
        /* Original orange color */
        filter: invert(48%) sepia(74%) saturate(3855%) hue-rotate(10deg) brightness(100%) contrast(104%);
      }

      .review-icon.red {
        /* Red color */
        filter: invert(22%) sepia(87%) saturate(7491%) hue-rotate(350deg) brightness(88%) contrast(102%);
      }

      .review-icon.green {
        /* Green color */
        filter: invert(37%) sepia(84%) saturate(495%) hue-rotate(81deg) brightness(94%) contrast(92%);
      }

      /* ... rest of your styles ... */
    `,
  ],
})
export class FraudResultsTableComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);

  private readonly mlFilterSignal = signal<string>('');
  private readonly timeFilterSignal = signal<string>('');
  private readonly searchTermSignal = signal<string>('');
  private readonly deviceFilterSignal = signal<string>('');
  readonly successMessage = signal<string | null>(null);

  @Input() set mlFilter(value: string) {
    this.mlFilterSignal.set(value?.toLowerCase() || '');
  }
  @Input() set timeFilter(value: string) {
    this.timeFilterSignal.set(value || '');
  }
  @Input() set searchTerm(value: string) {
    this.searchTermSignal.set(value?.toLowerCase() || '');
  }
  @Input() set deviceFilter(value: string) {
    this.deviceFilterSignal.set(value?.toLowerCase() || '');
  }

  @Output() statsChanged = new EventEmitter<{
    total: number;
  anomaly: number;
    review: number;
  }>();

  _allData = signal<Transaction[]>([]);
  currentPage = signal(1);
  readonly pageSize = 10;
  expandedRow = signal<string | null>(null);

  private dataFetchEffect?: any;

constructor() {
  this.dataFetchEffect = effect(() => {
    this.mlFilterSignal();
    this.timeFilterSignal();
    this.searchTermSignal();
    this.deviceFilterSignal();
    this.currentPage.set(1);
    this.expandedRow.set(null);
this.fetchData();
  });
}

ngOnInit() {
  this.fetchData();
}


  ngOnDestroy(): void {
    if (this.dataFetchEffect) {
      this.dataFetchEffect;
    }
  }

  trackByTransactionId(index: number, item: Transaction) {
    return item.transactionsId;
  }

  toggleExpand(id: string) {
    this.expandedRow.set(this.expandedRow() === id ? null : id);
  }

 private fetchData() {
  const params: any = {};
  if (this.timeFilterSignal()) params.time = this.timeFilterSignal();

  const mlFilter = this.mlFilterSignal();

  if (mlFilter === 'anomaly detected') {
    // Backend expects 'Yes' to filter anomaly detected
    params.anomaly_check = 'Yes';
  } else if (mlFilter === 'review required') {
    // Backend has no filter for review required,
    // So do NOT send anomaly_check param, fetch all data and filter on frontend
  } else if (mlFilter) {
    // For other filters (or empty), no filtering on backend
  }

  if (this.deviceFilterSignal()) params.device_id = this.deviceFilterSignal();
  if (this.searchTermSignal()) params.search = this.searchTermSignal();

  this.http.get<any>(`${environment.apiUrl}/fetchData`, { params }).subscribe({
    next: (response) => {
      const mappedData = response.transactions.map((t: any) => ({
        transactionsId: t.transaction_id,
        deviceID: t.device_id,
        amount: t.transaction_amt,
        mlOutput: t.anomaly_check, // exactly backend value
        confidence: Number(t.confidence_score).toFixed(2),
        timeStamp: t.transaction_timestamp,
        review: t.review == null ? '' : t.review,
      }));
      this._allData.set(mappedData);
      this.emitStats();
    },
    error: (err) => {
      console.error('Error fetching data:', err);
      this._allData.set([]);
      this.emitStats();
    },
  });
}


readonly totalItems = computed(() => this.filteredData().length);

  readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));
readonly paginatedData = computed(() => {
  const start = (this.currentPage() - 1) * this.pageSize;
  return this.filteredData().slice(start, start + this.pageSize);
});


readonly filteredData = computed(() => {
  const all = this._allData();
  const filter = this.mlFilterSignal().toLowerCase();

  if (filter === 'anomaly detected') {
    // Show only rows where anomaly detected === yes
    return all.filter(row => row.mlOutput.toLowerCase() === 'yes');
  }

  if (filter === 'review required') {
    // Show only anomaly detected rows with empty review
    return all.filter(
      row => row.mlOutput.toLowerCase() === 'yes' && (!row.review || row.review.trim() === '')
    );
  }

  // For any other filter, show all rows
  return all;
});


readonly reviewCount = computed(() =>
  this._allData().filter(d => d.mlOutput === 'Yes' && (!d.review || d.review === '')).length
);


  readonly startItem = computed(() =>
    this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1
  );
  readonly endItem = computed(() => Math.min(this.currentPage() * this.pageSize, this.totalItems()));

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((v) => v - 1);
      this.expandedRow.set(null);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((v) => v + 1);
      this.expandedRow.set(null);
    }
  }

  submitReview(transactionId: string, reviewValue: 'Yes' | 'No') {
    this.http
      .post(`${environment.apiUrl}/updateReview`, {
        transaction_id: transactionId,
        review: reviewValue,
      })
      .subscribe({
        next: () => {
          const updatedData = this._allData().map((item) => {
            if (item.transactionsId === transactionId) {
              return { ...item, review: reviewValue };
            }
            return item;
          });
          this._allData.set(updatedData);
          this.successMessage.set(`Review for ${transactionId} updated successfully.`);
          setTimeout(() => this.successMessage.set(null), 3000);
          this.expandedRow.set(null);
          this.emitStats();
        },
        error: (err) => {
          console.error('Error updating review:', err);
        },
      });
  }

private emitStats() {
  const anomalyCount = this._allData().filter(d => d.mlOutput === 'Yes').length;

  this.statsChanged.emit({
    total: this.totalItems(),
    anomaly: anomalyCount,
    review: this.reviewCount(),
  });
}
}
