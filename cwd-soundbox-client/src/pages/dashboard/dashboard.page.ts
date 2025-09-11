

import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabButtonComponent } from '../../app/components/top-bar/tab-button.component';
import { TransactionCardComponent } from '../../app/components/TransactionCardComponent';
import { FraudResultsTableComponent } from './fraud-results-table.component';
import { DeviceHealthComponent } from './device-health.component';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabButtonComponent,
    TransactionCardComponent,
    FraudResultsTableComponent,
    DeviceHealthComponent,
    HttpClientModule
  ],
  template: `
    <div class="dashboard-header" aria-label="Dashboard Header">
      Intelligent Metrics & Analytics <span class="highlight">(Dashboard)</span>
    </div>

    <div class="ml-subtitle">ML Analysis Results</div>

    <div class="tab-headers" role="tablist" aria-label="Dashboard Tabs">
      <app-tab-button
        *ngFor="let tab of tabs"
        [label]="tab.label"
        [icon]="tab.icon"
        [active]="tab.label === activeTab()"
        (tabClick)="activeTab.set(tab.label)"
        role="tab"
        [attr.aria-selected]="tab.label === activeTab()"
        tabindex="0"
      ></app-tab-button>
    </div>

    <div class="tab-tools">
      <div class="search-wrapper">
        <img src="assets/icons/6.svg" alt="Search" class="search-icon" />
        <input
          type="text"
          placeholder="Search Transactions..."
          class="search-bar"
          aria-label="Search Transactions"
          [ngModel]="searchTerm()"
          (ngModelChange)="searchTerm.set($event)"
        />
      </div>
      <button
        class="more-options"
        aria-label="Toggle More Options Panel"
        [attr.aria-expanded]="showMoreOptions()"
        (click)="onMoreOptions()"
      >
        <img src="assets/icons/7.svg" alt="More options" />
      </button>
    </div>

    <div
      class="more-options-panel"
      *ngIf="showMoreOptions()"
      role="region"
      aria-live="polite"
      [attr.aria-expanded]="showMoreOptions()"
    >
      <img src="assets/icons/12.svg" alt="Filter" class="funnel-icon" />

      <div class="dropdown time-dropdown">
        <select
          [ngModel]="selectedTimeFilter()"
          (ngModelChange)="selectedTimeFilter.set($event)"
          aria-label="Time Filter"
          class="time-select"
          style="background-image: url('assets/icons/13.svg');"
        >
          <option value="">Time</option>
          <option value="1h">1 Hour</option>
          <option value="6h">6 Hours</option>
          <option value="12h">12 Hours</option>
          <option value="1d">1 Day</option>
          <option value="1w">1 Week</option>
          <option value="1m">1 Month</option>
          <option value="3m">3 Months</option>
        </select>
      </div>

      <div class="dropdown ml-dropdown">
        <select
          [ngModel]="selectedMlOutput()"
          (ngModelChange)="selectedMlOutput.set($event)"
          aria-label="ML Output Filter"
          class="ml-select"
          [ngStyle]="{ 'background-image': 'url(assets/icons/13.svg)' }"
        >
          <option value="">All ML Output</option>
          <option value="Review Required">Review Required</option>
          <option value="Anomaly Detected">Anomaly Detected</option>
        </select>
      </div>

      <div class="dropdown device-dropdown">
        <select
          [ngModel]="selectedDeviceID()"
          (ngModelChange)="selectedDeviceID.set($event)"
          aria-label="Device ID Filter"
          class="device-select"
          [ngStyle]="{ 'background-image': 'url(assets/icons/13.svg)' }"
        >
          <option value="">All Devices</option>
          <option *ngFor="let device of deviceIDs()" [value]="device">
            {{ device }}
          </option>
        </select>
      </div>

      <button class="btn export-btn updated-export">
        <img src="assets/icons/14.svg" alt="Export Icon" class="export-icon" />
        Export
      </button>
    </div>

    <div class="tab-content" [class.shifted]="showMoreOptions()">
      <ng-container [ngSwitch]="activeTab()">
        <div *ngSwitchCase="'Transactions Anomaly'">
          <div class="cards-container" role="list">
            <app-transaction-card
              *ngFor="let card of transactionCards()"
              [heading]="card.heading"
              [icon]="card.icon"
              [count]="card.count"
              [description]="card.description"
              [countColor]="card.countColor"
              role="listitem"
            ></app-transaction-card>
          </div>

          <div style="margin-top: 16px;">
            <app-fraud-results-table
              [mlFilter]="selectedMlOutput()"
              [timeFilter]="selectedTimeFilter()"
              [searchTerm]="searchTerm()"
              [deviceFilter]="selectedDeviceID()"
              (statsChanged)="onStatsChanged($event)"
            >
            </app-fraud-results-table>
          </div>
        </div>

        <div *ngSwitchCase="'Device Health'">
          <div class="cards-container" role="list">
            <app-transaction-card
              *ngFor="let card of deviceHealthCards"
              [heading]="card.heading"
              [icon]="card.icon"
              [count]="card.count"
              [description]="card.description"
              [countColor]="card.countColor"
              role="listitem"
            ></app-transaction-card>
          </div>
          <app-device-health></app-device-health>
        </div>

        <div *ngSwitchCase="'Merchant Performance'">Merchant performance data displayed here.</div>
        <div *ngSwitchCase="'Merchant Churn'">Churn predictions for merchants shown here.</div>
        <div *ngSwitchCase="'Merchant LTV'">Merchant Lifetime Value analysis goes here.</div>
        <div *ngSwitchDefault>Select a tab to view content.</div>
      </ng-container>
    </div>
  `,
  styles: [



`
    .dashboard-header {
      position: absolute;
      top: 103px;
      left: 250px;
      font-family: 'Nunito Sans', sans-serif;
      font-weight: 500;
      font-size: 18px;
      line-height: 33px;
      color: #1D1D1D;
      text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
      user-select: none;
      z-index: 10;
    }

    .highlight {
      color: #C1212F;
      margin-left: 5px;
      font-weight: 600;
    }

    .ml-subtitle {
      position: absolute;
      top: 138px;
      left: 250px;
      font-family: 'Nunito Sans', sans-serif;
      font-weight: 400;
      font-size: 12px;
      color: #414454;
      user-select: none;
      z-index: 5;
    }

    .tab-headers {
      position: absolute;
      top: 170px;
      left: 250px;
      display: flex;
      gap: 16px;
      user-select: none;
      z-index: 5;
    }

    .tab-tools {
      position: absolute;
      top: 170px;
      right: 50px;
      display: flex;
      align-items: center;
      gap: 16px;
      user-select: none;
      z-index: 5;
    }

    .search-wrapper {
      position: relative;
      width: 298px;
      height: 40px;
    }

    .search-bar {
      width: 100%;
      height: 100%;
      padding: 0 12px 0 40px;
      border-radius: 30px;
      border: 1px solid #ccc;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 16px;
      color: #414454;
      outline: none;
      box-sizing: border-box;
    }

    .search-bar::placeholder {
      font-weight: 400;
      font-size: 14px;
      color: #908F8F;
    }

    .search-bar:focus {
      border-color: #C1212F;
      box-shadow: 0 0 0 2px rgba(193, 33, 47, 0.2);
    }

    .search-icon {
      position: absolute;
      top: 50%;
      left: 14px;
      transform: translateY(-50%);
      width: 19px;
      height: 19px;
      pointer-events: none;
      user-select: none;
      filter: grayscale(100%) brightness(80%);
    }

    .more-options {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0;
      user-select: none;
      transition: background-color 0.2s ease;
      border-radius: 6px;
    }

    .more-options:hover,
    .more-options:focus {
      outline: none;
      background-color: rgba(193, 33, 47, 0.1);
    }

    .more-options img {
      width: 24px;
      height: 24px;
      user-select: none;
    }

    .more-options-panel {
      position: absolute;
      width: 1580px;
      height: 60px;
      left: 243px;
      top: 233px;
      background: #FFFFFF;
      border: 1px solid #DBE5EA;
      box-shadow: 0px 2px 4px -2px rgba(0, 0, 0, 0.16);
      border-radius: 15px;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 10px;
      z-index: 7;
      animation: fadeInHeight 0.25s ease forwards;
    }

    .funnel-icon {
      width: 17px;
      height: 18px;
      margin-right: 10px;
    }

    .dropdown {
      display: flex;
      align-items: center;
      height: 40px;
      background-color: #F5F7FA;
      border-radius: 15px;
      padding: 0 12px;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 14px;
      color: #414454;
      position: relative;
      cursor: pointer;
    }

    .time-dropdown {
      width: 83px;
    }

    .time-dropdown .dropdown-label {
      width: 41px;
      height: 25px;
      line-height: 25px;
    }

    .ml-dropdown {
      width: 180px;
    }

    .ml-dropdown .dropdown-label {
      width: 116px;
      height: 25px;
      line-height: 25px;
    }

    .dropdown-icon {
      width: 12px;
      height: 8px;
      margin-left: 6px;
    }

    .btn.export-btn.updated-export {
      background-color: #C1212F;
      color: white;
      border: none;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 14px;
      font-weight: 400;
      border-radius: 5px;
      padding: 10px 10px 10px 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.25s ease;
      margin-left: auto;
    }

    .btn.export-btn.updated-export:hover,
    .btn.export-btn.updated-export:focus {
      background-color: #A21827;
    }

    .export-icon {
      width: 16px;
      height: 16px;
    }

    .tab-content {
      position: absolute;
      top: 260px;
      left: 250px;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 14px;
      color: #1D1D1D;
      width: calc(100% - 300px);
      transition: top 0.3s ease;
      user-select: text;
      z-index: 5;
    }
    .time-select {
      appearance: none;
      background: transparent;
      border: none;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 14px;
      color: #414454;
      padding: 0 24px 0 0;
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 12px 8px;
      height: 40px;
      width: 100%;
      cursor: pointer;
      outline: none;
    }
    .device-dropdown {
      width: 180px;
    }

    .device-select {
      appearance: none;
      background: transparent;
      border: none;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 14px;
      color: #414454;
      padding: 0 24px 0 0;
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 12px 8px;
      height: 40px;
      width: 100%;
      cursor: pointer;
      outline: none;
    }

    .ml-select {
      appearance: none;
      background: transparent;
      border: none;
      font-family: 'Nunito Sans', sans-serif;
      font-size: 14px;
      color: #414454;
      padding: 0 24px 0 0;
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 12px 8px;
      height: 40px;
      width: 100%;
      cursor: pointer;
      outline: none;
    }

    .tab-content.shifted {
      top: 330px;
    }

    .cards-container {
      display: flex;
      gap: 8px;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 8px;
      user-select: none;
    }

    @keyframes fadeInHeight {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 120px; }
    }
  `


  ],

})
export class DashboardPageComponent implements OnInit {
  // Signals for reactive state management
  searchTerm = signal('');
  selectedTimeFilter = signal('');
  selectedMlOutput = signal('');
  selectedDeviceID = signal('');
  deviceIDs = signal<string[]>([]);

  // Transaction cards as signal for reactive update
  transactionCards = signal([
    {
      heading: 'Total Transactions',
      icon: 'assets/icons/8.svg',
      count: 0,
      description: 'Total count of transactions done by devices.',
      countColor: '#2DA74E',
    },
    {
      heading: 'Anomaly Detected',
      icon: 'assets/icons/9.svg',
      count: 0,
      description: 'Total count of anomaly detected in devices.',
      countColor: '#908F8F',
    },
    {
      heading: 'Review Required',
      icon: 'assets/icons/11.svg',
      count: 0,
      description: 'Total count of review required in device.',
      countColor: '#F6A121',
    }
  ]);

  deviceHealthCards = [
    {
      heading: 'Total Device',
      icon: 'assets/icons/16.svg',
      count: 120,
      description: 'Total count of all devices used by merchant.',
      countColor: '#4B88A2',
    },
    {
      heading: 'At Risk (Next 3 Month)',
      icon: 'assets/icons/15.svg',
      count: 7,
      description: 'Total count of risk detected in device',
      countColor: '#E83B2D',
    },
    {
      heading: 'At Risk %',
      icon: 'assets/icons/15.svg',
      count: 58.3,
      description: 'Total count of risk detected (%) in device',
      countColor: '#E83B2D',
    }
  ];

  tabs = [
    { label: 'Transactions Anomaly', icon: 'assets/icons/1.svg' },
    { label: 'Device Health', icon: 'assets/icons/2.svg' },
    { label: 'Merchant Performance', icon: 'assets/icons/3.svg' },
    { label: 'Merchant Churn', icon: 'assets/icons/4.svg' },
    { label: 'Merchant LTV', icon: 'assets/icons/5.svg' },
  ];
  activeTab = signal(this.tabs[0].label);
  showMoreOptions = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchDeviceIDs();
  }

  fetchDeviceIDs(): void {
    this.http.get<{ device_ids: number[] }>('http://localhost:8080/getAllDeviceIds')
      .pipe(
        map(res => res.device_ids.map(id => id.toString()))
      )
      .subscribe({
        next: (ids) => this.deviceIDs.set(ids),
        error: (err) => console.error('Failed to fetch device IDs', err),
      });
  }

  onStatsChanged(stats: { total: number; anomaly: number; review: number }) {
    this.transactionCards.update(cards =>
      cards.map(card => {
        switch (card.heading) {
          case 'Total Transactions': return { ...card, count: stats.total };
          case 'Anomaly Detected': return { ...card, count: stats.anomaly };
          case 'Review Required': return { ...card, count: stats.review };
          default: return card;
        }
      })
    );
  }

  onMoreOptions(): void {
    this.showMoreOptions.update(value => !value);
  }

  // Computed for filtered transaction cards if needed (optional)
  get transactionCardsList() {
    return this.transactionCards();
  }
}
