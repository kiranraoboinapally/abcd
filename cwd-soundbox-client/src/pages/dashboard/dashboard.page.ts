import { Component, signal, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabButtonComponent } from '../../app/components/top-bar/tab-button.component';
import { TransactionCardComponent } from '../../app/components/TransactionCardComponent';
import { FraudResultsTableComponent } from './fraud-results-table.component';
import { DeviceHealthComponent, AtRiskDevice } from './device-health.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import { environment } from '../../environments/environment';

// Import the slider library
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';

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
    HttpClientModule,
    HighchartsChartModule,
    NgxSliderModule
  ],
  styles: [`
    :host ::ng-deep .ngx-slider .ngx-slider-bar {
      background: #D1D5DB; /* Gray color for the unfilled track */
      height: 6px;
    }
    :host ::ng-deep .ngx-slider .ngx-slider-selection {
      background: #3B82F6; /* Blue color for the filled part */
    }
    :host ::ng-deep .ngx-slider .ngx-slider-pointer {
      width: 18px;
      height: 18px;
      top: -6px; /* Center the handle on the bar */
      background-color: #3B82F6; /* Blue color for the handle */
    }
    :host ::ng-deep .ngx-slider .ngx-slider-pointer:after {
      display: none; /* Hide inner circle */
    }
  `],
  template: `
    <div class="absolute top-[103px] left-[250px] font-nunito font-medium text-[18px] leading-[33px] text-[#1D1D1D] select-none z-10">
      Intelligent Metrics & Analytics <span class="text-redCustom font-semibold ml-1">(Dashboard)</span>
    </div>

    <div class="absolute top-[138px] left-[250px] font-nunito text-sm text-[#414454] select-none z-10">
      ML Analysis Results
    </div>

    <div class="absolute top-[170px] left-[250px] flex gap-4 select-none z-10" role="tablist" aria-label="Dashboard Tabs">
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

    <div class="absolute top-[170px] right-[50px] flex items-center gap-4 select-none z-10">
      <div class="relative w-[298px] h-10">
        <img src="assets/icons/6.svg" alt="Search" class="absolute top-1/2 left-3 transform -translate-y-1/2 w-[19px] h-[19px] pointer-events-none filter grayscale brightness-80" />
        <input
          type="text"
          class="w-full h-full pl-[40px] pr-3 rounded-full border border-gray-300 text-[#414454] text-base font-nunito placeholder-[#908F8F] focus:outline-none focus:border-redCustom focus:ring-2 focus:ring-redCustom/20"
          [placeholder]="activeTab() === 'Transactions Anomaly' ? 'Search Transactions...' : 'Search Device Health...'"
          [attr.aria-label]="activeTab() === 'Transactions Anomaly' ? 'Search Transactions' : 'Search Device Health'"
          [ngModel]="activeTab() === 'Transactions Anomaly' ? searchTerm() : deviceHealthSearchTerm()"
          (ngModelChange)="activeTab() === 'Transactions Anomaly' ? searchTerm.set($event) : deviceHealthSearchTerm.set($event)"
        />
      </div>

      <button
        class="flex items-center p-2 rounded-md hover:bg-redCustom/20 focus:outline-none transition"
        aria-label="Toggle More Options Panel"
        [attr.aria-expanded]="showMoreOptions()"
        (click)="onMoreOptions()"
      >
        <img src="assets/icons/7.svg" alt="More options" class="w-6 h-6" />
      </button>
    </div>

    <div *ngIf="showMoreOptions()" class="absolute left-[243px] top-[233px] w-[1580px] h-[60px] bg-white border border-[#DBE5EA] shadow-sm rounded-xl flex items-center gap-4 px-4 z-20 animate-fade-in-height" role="region" aria-live="polite" [attr.aria-expanded]="showMoreOptions()">
      <img src="assets/icons/12.svg" alt="Filter" class="w-[17px] h-[18px] mr-2" />

      <ng-container *ngIf="activeTab() === 'Transactions Anomaly'">
        <div class="bg-[#F5F7FA] rounded-xl h-10 flex items-center px-3 w-[83px]">
          <select class="bg-transparent border-none text-sm text-[#414454] w-full appearance-none focus:outline-none" [ngModel]="selectedTimeFilter()" (ngModelChange)="selectedTimeFilter.set($event)" aria-label="Time Filter">
            <option value="">Time</option>
            <option value="1h">1 Hour</option>
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
          </select>
        </div>
        <div class="bg-[#F5F7FA] rounded-xl h-10 flex items-center px-3 w-[180px]">
          <select class="bg-transparent border-none text-sm text-[#414454] w-full appearance-none focus:outline-none" [ngModel]="selectedMlOutput()" (ngModelChange)="selectedMlOutput.set($event)" aria-label="ML Output Filter">
            <option value="">All ML Output</option>
            <option value="Review Required">Review Required</option>
            <option value="Anomaly Detected">Anomaly Detected</option>
          </select>
        </div>
        <div class="bg-[#F5F7FA] rounded-xl h-10 flex items-center px-3 w-[180px]">
          <select class="bg-transparent border-none text-sm text-[#414454] w-full appearance-none focus:outline-none" [ngModel]="selectedDeviceID()" (ngModelChange)="selectedDeviceID.set($event)" aria-label="Device ID Filter">
            <option value="">All Devices</option>
            <option *ngFor="let device of deviceIDs()" [value]="device">{{ device }}</option>
          </select>
        </div>
        
        <div class="bg-[#F5F7FA] rounded-xl h-10 flex items-center px-3 w-[250px]">
          <label for="confidence" class="text-sm text-[#414454] mr-2 whitespace-nowrap">Confidence:</label>
          <div class="w-full px-2">
            <ngx-slider
              [options]="sliderOptions"
              [value]="liveConfidenceThreshold()"
              (valueChange)="liveConfidenceThreshold.set($event)"
              (userChangeEnd)="finalConfidenceThreshold.set($event.value)">
            </ngx-slider>
          </div>
          <span class="text-sm text-[#414454] w-10 text-right">{{ liveConfidenceThreshold() }}%</span>
        </div>

      </ng-container>

      <ng-container *ngIf="activeTab() === 'Device Health'">
        <div class="bg-[#F5F7FA] rounded-xl h-10 flex items-center px-3 w-[180px]">
          <select
            class="bg-transparent border-none text-sm text-[#414454] w-full appearance-none focus:outline-none"
            [ngModel]="selectedDeviceHealthDeviceID()"
            (ngModelChange)="selectedDeviceHealthDeviceID.set($event)"
            aria-label="Device ID Filter"
          >
            <option value="">All Devices</option>
            <option *ngFor="let device of deviceHealthDeviceIDs()" [value]="device">
              {{ device }}
            </option>
          </select>
        </div>
        <div class="bg-[#F5F7FA] rounded-xl h-10 flex items-center px-3 w-[180px]">
          <select
            class="bg-transparent border-none text-sm text-[#414454] w-full appearance-none focus:outline-none"
            [ngModel]="selectedChargingStatus()"
            (ngModelChange)="selectedChargingStatus.set($event)"
            aria-label="Charging Status Filter"
          >
            <option value="">Charging Status</option>
            <option value="Charging">Charging</option>
            <option value="Discharging">Discharging</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
        <div class="bg-[#F5F7FA] rounded-xl h-10 flex items-center px-3 w-[180px]">
          <select
            class="bg-transparent border-none text-sm text-[#414454] w-full appearance-none focus:outline-none"
            [ngModel]="selectedDeviceHealthStatus()"
            (ngModelChange)="selectedDeviceHealthStatus.set($event)"
            aria-label="Device Health Status Filter"
          >
            <option value="">Status</option>
            <option value="Anomaly">Anomaly</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </ng-container>

      <button class="ml-auto bg-redCustom text-white text-sm font-normal rounded-md py-2 px-4 flex items-center gap-2 hover:bg-redCustom/90 transition">
        <img src="assets/icons/14.svg" alt="Export Icon" class="w-4 h-4" />
        Export
      </button>
    </div>

    <div [ngClass]="{ 'absolute left-[250px] w-[calc(100%-300px)] z-10 transition-all duration-300': true, 
                       'top-[330px]': showMoreOptions(), 
                       'top-[260px]': !showMoreOptions() }" class="font-nunito text-[#1D1D1D]">
      <ng-container [ngSwitch]="activeTab()">
        <div *ngSwitchCase="'Transactions Anomaly'">
          <div class="flex gap-2 overflow-x-auto pb-2 select-none">
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
          <div class="mt-4">
            <app-fraud-results-table
              [mlFilter]="selectedMlOutput()"
              [timeFilter]="selectedTimeFilter()"
              [searchTerm]="searchTerm()"
              [deviceFilter]="selectedDeviceID()"
              (statsChanged)="onStatsChanged($event)"
            ></app-fraud-results-table>
          </div>
        </div>

        <div *ngSwitchCase="'Device Health'">
          <div class="flex gap-2 overflow-x-auto pb-2 select-none">
            <app-transaction-card
              *ngFor="let card of deviceHealthCards()"
              [heading]="card.heading"
              [icon]="card.icon"
              [count]="card.count"
              [description]="card.description"
              [countColor]="card.countColor"
              role="listitem"
            ></app-transaction-card>
            <div class="w-[380px] h-[150px] border-2 border-gray-400 bg-white rounded-lg shadow-md flex flex-col p-5 box-border">
              <h2 class="text-md font-lg m-0 text-gray-900">Battery Score{{ selectedAtRiskDevice() ? ' for Device ' + selectedAtRiskDevice() : '' }}</h2>
              <div class="flex-grow flex items-center justify-center">
                <highcharts-chart
                  *ngIf="selectedAtRiskDevice(); else noDeviceSelected"
                  [Highcharts]="Highcharts"
                  [options]="gaugeOptions()"
                  style="width: 100%; height: 100px; display: block;"
                ></highcharts-chart>
                 <ng-template #noDeviceSelected>
                    <div class="text-gray-500">Select a device</div>
                 </ng-template>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <app-device-health
              [searchTerm]="deviceHealthSearchTerm()"
              [deviceFilter]="selectedDeviceHealthDeviceID()"
              [chargingStatusFilter]="selectedChargingStatus()"
              [statusFilter]="selectedDeviceHealthStatus()"
              (deviceSelected)="onDeviceSelected($event)"
            ></app-device-health>
          </div>
        </div>

        <div *ngSwitchDefault>
          Select a tab to view content.
        </div>
      </ng-container>
    </div>
  `
})
export class DashboardPageComponent implements OnInit {
  private apiUrl = environment.apiUrl;
  searchTerm = signal('');
  selectedTimeFilter = signal('');
  selectedMlOutput = signal('');
  selectedDeviceID = signal('');
  
  // This signal tracks the slider's value in real-time for the UI.
  liveConfidenceThreshold = signal(100);
  // This signal is only updated when the user stops sliding and is used for filtering.
  finalConfidenceThreshold = signal(100);
  
  deviceIDs = signal<string[]>([]);
  selectedDeviceHealthDeviceID = signal('');
  deviceHealthDeviceIDs = signal<string[]>([]);
  selectedChargingStatus = signal('');
  selectedDeviceHealthStatus = signal('');
  deviceHealthSearchTerm = signal('');
  selectedAtRiskDevice = signal<number | null>(null);
  atRiskDevices = signal<AtRiskDevice[]>([]);

  // Configuration for the ngx-slider library
  sliderOptions: Options = {
    floor: 0,
    ceil: 100,
    hideLimitLabels: true
  };

  transactionCards = signal([
    { heading: 'Total Transactions', icon: 'assets/icons/8.svg', count: 0, description: 'Total count of transactions done by devices.', countColor: '#2DA74E' },
    { heading: 'Anomaly Detected', icon: 'assets/icons/9.svg', count: 0, description: 'Total count of anomaly detected in devices.', countColor: '#908F8F' },
    { heading: 'Review Required', icon: 'assets/icons/11.svg', count: 0, description: 'Total count of review required in device.', countColor: '#F6A121' }
  ]);

  deviceHealthCards = signal([
    { heading: 'Total Device', icon: 'assets/icons/16.svg', count: 0, description: 'Total count of all devices used by merchant.', countColor: '#4B88A2' },
    { heading: 'At Risk', icon: 'assets/icons/15.svg', count: 0, description: 'Total count of risk detected in device.', countColor: '#E83B2D' },
    { heading: 'At Risk %', icon: 'assets/icons/15.svg', count: 0, description: 'Percentage of devices at risk.', countColor: '#E83B2D' }
  ]);

  tabs = [
    { label: 'Transactions Anomaly', icon: 'assets/icons/1.svg' },
    { label: 'Device Health', icon: 'assets/icons/2.svg' },
    { label: 'Merchant Performance', icon: 'assets/icons/3.svg' },
    { label: 'Merchant Churn', icon: 'assets/icons/4.svg' },
    { label: 'Merchant LTV', icon: 'assets/icons/5.svg' },
  ];
  activeTab = signal(this.tabs[0].label);
  showMoreOptions = signal(false);
  Highcharts: typeof Highcharts = Highcharts;

  constructor(private http: HttpClient) {
    // Effect for fetching Device Health KPIs when filters change
    effect(() => {
      this.deviceHealthSearchTerm();
      this.selectedDeviceHealthDeviceID();
      this.fetchAtRiskKPIs();
    });

    // Effect to update confidence threshold on the backend when the slider value changes.
    effect(() => {
      // Read the signal to create a dependency.
      const threshold = this.finalConfidenceThreshold();
      
      // Prepare the payload as expected by your Go backend.
      const payload = { confidence_threshold: threshold };
      
      // Send the POST request.
      this.http.post(`${this.apiUrl}/updateConfidenceThreshold`, payload)
        .subscribe({
          next: (response) => console.log('✅ Confidence threshold updated successfully:', response),
          error: (err) => console.error('❌ Failed to update confidence threshold:', err)
        });
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.fetchDeviceIDs();
    this.fetchDeviceHealthIDs();
  }

  fetchDeviceIDs(): void {
    this.http.get<{ device_ids: number[] }>(`${this.apiUrl}/getAllDeviceIds`)
      .pipe(map(res => res.device_ids.map(id => id.toString())))
      .subscribe({
        next: (ids) => this.deviceIDs.set(ids),
        error: (err) => console.error('Failed to fetch transaction device IDs', err),
      });
  }

  fetchDeviceHealthIDs(): void {
    this.http.get<{ device_ids: number[] }>(`${this.apiUrl}/getDeviceHealthIds`)
      .pipe(map(res => res.device_ids.map(id => id.toString())))
      .subscribe({
        next: (ids) => this.deviceHealthDeviceIDs.set(ids),
        error: (err) => console.error('Failed to fetch device health IDs', err),
      });
  }

  fetchAtRiskKPIs(): void {
    let url = `${this.apiUrl}/getAtRiskKPIs`;
    const params: { [key: string]: string } = {};
    if (this.deviceHealthSearchTerm()) params['search'] = this.deviceHealthSearchTerm();
    if (this.selectedDeviceHealthDeviceID()) params['device_id'] = this.selectedDeviceHealthDeviceID();

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;

    this.http.get<{ kpi: { total_devices: number; at_risk: number; at_risk_percent: number }; at_risk_devices: AtRiskDevice[] }>(url)
      .subscribe({
        next: (res) => {
          this.deviceHealthCards.update(cards =>
            cards.map(card => {
              switch (card.heading) {
                case 'Total Device': return { ...card, count: res.kpi.total_devices };
                case 'At Risk': return { ...card, count: res.kpi.at_risk };
                case 'At Risk %': return { ...card, count: parseFloat(res.kpi.at_risk_percent.toFixed(1)) };
                default: return card;
              }
            })
          );
          this.atRiskDevices.set(res.at_risk_devices || []);
        },
        error: (err) => console.error('Failed to fetch at risk KPIs', err),
      });
  }
  
  onDeviceSelected(deviceId: number | null): void {
    this.selectedAtRiskDevice.set(deviceId);
  }
  
  onStatsChanged(stats: { total: number; anomaly: number; review: number }): void {
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

  gaugeOptions = computed((): Highcharts.Options => {
    const deviceId = this.selectedAtRiskDevice();
    const bs = this.atRiskDevices().find(item => item.device_id === deviceId)?.device_bs || 0;

    return {
      chart: {
        type: 'solidgauge',
        height: 100
      },
      title: {
        text: ''
      },
      pane: {
        center: ['50%', '50%'],
        size: '125%',
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            backgroundColor: '#EEE',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc'
          }
        ]
      },
      tooltip: {
        enabled: false
      },
      yAxis: {
        stops: [
          [0.5, '#DF5353'], // red
          [0.8, '#DDDF0D'], // yellow
          [1.0, '#55BF3B']  // green
        ],
        lineWidth: 0,
        tickAmount: 2,
        min: 0,
        max: 100,
        title: {
          text: ''
        },
        labels: {
          y: 10,
          style: {
            fontSize: '10px'
          }
        }
      },
      plotOptions: {
        solidgauge: {
          dataLabels: {
            y: 0,
            borderWidth: 0,
            useHTML: true
          }
        }
      },
      series: [
        {
          type: 'solidgauge',
          name: 'Battery Score',
          data: [bs],
          dataLabels: {
            format: '<div style="text-align:center"><span style="font-size:16px">{y:.1f}</span><br/><span style="font-size:8px;opacity:0.4">%</span></div>'
          },
          tooltip: {
            valueSuffix: ' %'
          }
        }
      ]
    };
  });

  get transactionCardsList() {
    return this.transactionCards();
  }
}