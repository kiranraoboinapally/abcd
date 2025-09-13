
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
    <div class="w-auto h-[527px] p-4 box-border bg-white border border-gray-300 rounded-lg flex flex-col font-sans select-none">
  <div class="flex items-center mb-3">
    <img src="assets/icons/10.svg" alt="Fraud Icon" class="w-[25px] h-[25px] mr-2.5" />
    <div class="text-lg font-semibold text-gray-900">ML Fraud Detection Results</div>
  </div>

  <div *ngIf="successMessage()" class="bg-green-100 text-green-800 p-2 rounded-md mb-2.5 text-sm font-medium">
    {{ successMessage() }}
  </div>

  <div class="border border-gray-200 rounded-md flex flex-col flex-grow min-h-0 overflow-hidden">
    <div
      class="flex w-full h-[50px] items-center justify-between font-semibold text-sm bg-gray-100 text-gray-800 border-gray-300 px-2 box-border"
    >
      <div class="flex-1 text-center px-1 text-[18px] font-semibold">Transactions ID</div>
      <div class="flex-1 text-center px-1 text-[18px] font-semibold">Device ID</div>
      <div class="flex-1 text-center px-1 text-[18px] font-semibold">Amount</div>
      <div class="flex-1 text-center px-1 text-[18px] font-semibold">Anomaly Detected</div>
      <div class="flex-1 text-center px-1 text-[18px] font-semibold">Confidence</div>
      <div class="flex-1 text-center px-1 text-[18px] font-semibold">Timestamp</div>
      <div class="flex-1 text-center px-1 text-[18px] font-semibold">Review</div>
    </div>

    <div
      class="flex-grow overflow-y-auto py-2 flex flex-col gap-12"
      tabindex="0"
    >
      <ng-container *ngFor="let row of paginatedData(); trackBy: trackByTransactionId">
        <div
          class="flex items-center p-4 pl-0 justify-between h-12 bg-white rounded-md px-2 text-xs transition-colors duration-200 hover:bg-blue-50"
        >
          <div class="flex-1 text-center px-1 truncate text-[14px]">{{ row.transactionsId }}</div>
          <div class="flex-1 text-center px-1 truncate text-[14px]">{{ row.deviceID }}</div>
          <div class="flex-1 text-center px-1 truncate text-[14px]">{{ row.amount }}</div>
          <div class="flex-1 text-center px-1 truncate text-[14px]">{{ row.mlOutput }}</div>
          <div class="flex-1 text-center px-1 truncate text-[14px]">{{ row.confidence }}</div>
          <div class="flex-1 text-center px-1 truncate text-[14px]">{{ row.timeStamp | date: 'short' }}</div>
          <div
            class="flex-1 text-center px-1 cursor-pointer select-none review-cell flex items-center justify-center"
            (click)="toggleExpand(row.transactionsId)"
          >
            <ng-container *ngIf="row.mlOutput === 'Yes'; else showReviewText">
              <img
                src="assets/icons/18.svg"
                alt="Review Icon"
                class="w-[25px] h-[25px] transition-colors duration-300"
                [ngClass]="{
                  'text-orange-500': row.mlOutput === 'Yes' && (row.review === '' || row.review == null),
                  'text-red-500': row.mlOutput === 'Yes' && row.review === 'Yes',
                  'text-green-500': row.mlOutput === 'Yes' && row.review === 'No'
                }"
              />
            </ng-container>
            <ng-template #showReviewText>
              <ng-container *ngIf="row.review !== 'No'">
                {{ row.review }}
              </ng-container>
            </ng-template>
          </div>
        </div>

        <div
          *ngIf="expandedRow() === row.transactionsId"
          class="flex items-center justify-end bg-gray-50 w-full p-2"
        >
          <div class="flex-grow text-right text-base mr-4">Is this fraud activity?</div>
          <div class="flex gap-2">
            <button
              class="w-[46px] h-[30px] text-base border border-green-600 rounded select-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-green-600"
              [disabled]="row.review === 'Yes'"
              (click)="submitReview(row.transactionsId, 'Yes')"
            >
              Yes
            </button>
            <button
              class="w-[46px] h-[30px] text-base border border-red-600 rounded select-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-red-600"
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

  <div
    class="flex justify-between items-center h-10 text-sm text-gray-700 border-t border-gray-200 px-2 box-border mt-1 select-none flex-wrap gap-5"
  >
    <div class="flex gap-5 items-center flex-wrap">
      <span>Total Transactions - {{ totalItems() }}</span>
      <span>Review Required - {{ reviewCount() }}</span>
    </div>
    <div class="flex items-center gap-1.5 text-green-600 text-sm">
      <img src="assets/icons/Vector.svg" alt="Status Icon" class="w-4 h-4" />
      ML Model Performance : Active
    </div>
  </div>

  <div class="flex justify-end items-center gap-2 text-xs mt-1 select-none">
    <button
      class="bg-transparent border-none text-lg text-blue-600 p-0.5 rounded hover:bg-blue-100 disabled:text-gray-300 disabled:cursor-not-allowed"
      (click)="prevPage()"
      [disabled]="currentPage() === 1"
      aria-label="Previous page"
    >
      ‹
    </button>
    <span>{{ startItem() }} – {{ endItem() }} of {{ totalItems() }}</span>
    <button
      class="bg-transparent border-none text-lg text-blue-600 p-0.5 rounded hover:bg-blue-100 disabled:text-gray-300 disabled:cursor-not-allowed"
      (click)="nextPage()"
      [disabled]="currentPage() === totalPages()"
      aria-label="Next page"
    >
      ›
    </button>
  </div>
</div>
`
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
