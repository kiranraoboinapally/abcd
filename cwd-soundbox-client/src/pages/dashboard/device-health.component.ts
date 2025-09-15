import {
  Component,
  OnInit,
  signal,
  computed,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../src/environments/environment';

import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';

// Optional: Remove warning
import HC_accessibility from 'highcharts/modules/accessibility';
HC_accessibility(Highcharts);

interface DeviceHealth {
  block: number;
  device_id: number;
  charging_status: string;
  start_battery_level: number;
  end_battery_level: number;
  start_time: string;
  end_time: string;
  is_anomaly: string;
}

interface AtRiskDevice {
  device_id: number;
  device_bs: number;
}

@Component({
  selector: 'app-device-health',
  standalone: true,
  imports: [CommonModule, HttpClientModule, HighchartsChartModule],
  template: `
<div class="flex flex-nowrap gap-4 p-4 bg-gray-100 min-h-[648px]">
  <!-- Chart Box -->
  <div class="w-[520px] h-[648px] p-5 bg-white rounded-lg shadow-md flex flex-col items-start">
    <div class="w-full h-12 flex items-center pl-2 border-b border-gray-300 mb-3">
      <h2 class="m-0 font-bold text-2xl text-red-600">At Risk</h2>
    </div>
    <highcharts-chart
      *ngIf="data().length > 0"
      [Highcharts]="Highcharts"
      [options]="chartOptions()"
      style="width: 400px; height: 500px; display: block; margin: auto"
    ></highcharts-chart>
  </div>

  <!-- At Risk Devices Table -->
  <div class="w-[520px] h-[648px] bg-white rounded-lg shadow-md flex flex-col p-5 box-border">
    <div class="w-full h-[27px] font-bold text-lg text-gray-800 mb-2 select-none">
      At Risk Devices
    </div>

    <table class="w-full border-collapse text-sm select-none">
      <thead>
        <tr class="h-[38px] bg-gray-200">
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">Device ID</th>
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">Battery Score (%)</th>
        </tr>
      </thead>
    </table>

    <div class="w-full h-[420px] overflow-y-auto mt-1 border border-gray-300 rounded">
      <table class="w-full border-collapse text-sm">
        <tbody>
          <tr *ngFor="let item of paginatedAtRiskData()" class="h-[48px] border-b border-gray-300 hover:bg-gray-100 transition-colors">
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.device_id }}</td>
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.device_bs | number:'1.1-1' }}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls for At Risk Devices -->
    <div class="flex justify-between items-center pt-3 border-t border-gray-300 mt-auto">
      <div class="text-sm text-gray-600 select-none">
        Showing {{ atRiskStartItem() }} to {{ atRiskEndItem() }} of {{ atRiskTotalItems() }} items
      </div>
      <div class="flex gap-2">
        <button
          (click)="atRiskPrevPage()"
          [disabled]="atRiskCurrentPage() === 1"
          class="px-4 py-2 border border-gray-300 bg-gray-100 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          (click)="atRiskNextPage()"
          [disabled]="atRiskCurrentPage() === atRiskTotalPages()"
          class="px-4 py-2 border border-gray-300 bg-gray-100 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>

  <!-- Device Health Records Table -->
  <div class="w-[520px] h-[648px] bg-white rounded-lg shadow-md flex flex-col p-5 box-border">
    <div class="w-full h-[27px] font-bold text-lg text-gray-800 mb-2 select-none">
      Device Health Records
    </div>

    <table class="w-full border-collapse text-sm select-none">
      <thead>
        <tr class="h-[38px] bg-gray-200">
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">Block</th>
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">Device ID</th>
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">Charging Status</th>
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">Start Battery</th>
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">End Battery</th>
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">Start Time</th>
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">End Time</th>
          <th class="p-3 text-left font-bold text-gray-800 border-b border-gray-400">Anomaly</th>
        </tr>
      </thead>
    </table>

    <div class="w-full h-[420px] overflow-y-auto mt-1 border border-gray-300 rounded">
      <table class="w-full border-collapse text-sm">
        <tbody>
          <tr *ngFor="let item of paginatedData()" class="h-[48px] border-b border-gray-300 hover:bg-gray-100 transition-colors">
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.block }}</td>
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.device_id }}</td>
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.charging_status }}</td>
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.start_battery_level }}%</td>
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.end_battery_level }}%</td>
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.start_time }}</td>
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.end_time }}</td>
            <td class="px-4 py-3 text-left whitespace-nowrap">{{ item.is_anomaly }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls for Device Health Records -->
    <div class="flex justify-between items-center pt-3 border-t border-gray-300 mt-auto">
      <div class="text-sm text-gray-600 select-none">
        Showing {{ startItem() }} to {{ endItem() }} of {{ totalItems() }} items
      </div>
      <div class="flex gap-2">
        <button
          (click)="prevPage()"
          [disabled]="currentPage() === 1"
          class="px-4 py-2 border border-gray-300 bg-gray-100 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          (click)="nextPage()"
          [disabled]="currentPage() === totalPages()"
          class="px-4 py-2 border border-gray-300 bg-gray-100 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</div>
`
})
export class DeviceHealthComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  data = signal<DeviceHealth[]>([]);
  atRiskData = signal<AtRiskDevice[]>([]);
  private perPage = 10;
  currentPage = signal(1);
  atRiskCurrentPage = signal(1);
  Highcharts: typeof Highcharts = Highcharts;

  @Input() searchTerm: string = '';
  @Input() deviceFilter: string = '';
  @Input() chargingStatusFilter: string = '';
  @Input() statusFilter: string = '';
  @Input() timeFilter: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
    this.fetchAtRiskData();
  }

  fetchData() {
    let url = `${this.apiUrl}/getDeviceHealthData`;
    const params: { [key: string]: string } = {};
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.deviceFilter) params['device_id'] = this.deviceFilter;
    if (this.chargingStatusFilter) params['charging_status'] = this.chargingStatusFilter;
    if (this.statusFilter) params['is_anomaly'] = this.statusFilter === 'Anomaly' ? 'Yes' : 'No';
    if (this.timeFilter) params['time'] = this.timeFilter;

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;

    this.http
      .get<{ device_health: DeviceHealth[] }>(url)
      .subscribe({
        next: (res) => {
          console.log('Fetched device health data:', res.device_health);
          this.data.set(res.device_health);
        },
        error: (err) => console.error('Error fetching data:', err),
      });
  }

  fetchAtRiskData() {
    let url = `${this.apiUrl}/getAtRiskKPIs`;
    const params: { [key: string]: string } = {};
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.deviceFilter) params['device_id'] = this.deviceFilter;
    if (this.timeFilter) params['time'] = this.timeFilter;

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;

    this.http
      .get<{ kpi: any; at_risk_devices: AtRiskDevice[] }>(url)
      .subscribe({
        next: (res) => {
          console.log('Fetched at risk devices:', res.at_risk_devices);
          this.atRiskData.set(res.at_risk_devices);
        },
        error: (err) => console.error('Error fetching at risk data:', err),
      });
  }

  // Pagination for Device Health Records
  totalItems = computed(() => this.data().length);
  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage;
    return this.data().slice(start, start + this.perPage);
  });
  totalPages = computed(() => Math.ceil(this.totalItems() / this.perPage));
  nextPage = () => this.currentPage.update((p) => Math.min(p + 1, this.totalPages()));
  prevPage = () => this.currentPage.update((p) => Math.max(p - 1, 1));
  startItem = computed(() =>
    this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.perPage + 1
  );
  endItem = computed(() => Math.min(this.currentPage() * this.perPage, this.totalItems()));

  // Pagination for At Risk Devices
  atRiskTotalItems = computed(() => this.atRiskData().length);
  paginatedAtRiskData = computed(() => {
    const start = (this.atRiskCurrentPage() - 1) * this.perPage;
    return this.atRiskData().slice(start, start + this.perPage);
  });
  atRiskTotalPages = computed(() => Math.ceil(this.atRiskTotalItems() / this.perPage));
  atRiskNextPage = () => this.atRiskCurrentPage.update((p) => Math.min(p + 1, this.atRiskTotalPages()));
  atRiskPrevPage = () => this.atRiskCurrentPage.update((p) => Math.max(p - 1, 1));
  atRiskStartItem = computed(() =>
    this.atRiskTotalItems() === 0 ? 0 : (this.atRiskCurrentPage() - 1) * this.perPage + 1
  );
  atRiskEndItem = computed(() => Math.min(this.atRiskCurrentPage() * this.perPage, this.atRiskTotalItems()));

  // Highcharts Options
  chartOptions = computed((): Highcharts.Options => {
    const raw = this.data();

    return {
      accessibility: {
        enabled: false,
      },
      chart: {
        type: 'line',
        height: 500,
      },
      title: {
        text: 'Device Health Battery Levels Over Time',
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Time',
        },
      },
      yAxis: {
        min: 0,
        max: 100,
        title: {
          text: 'Battery Level (%)',
        },
      },
      tooltip: {
        shared: true,
        formatter: function () {
          let s = `<b>${Highcharts.dateFormat('%Y-%m-%d %H:%M', this.x as number)}</b><br/>`;
          this.points?.forEach((point) => {
            s += `${point.series.name}: <b>${point.y}%</b><br/>`;
          });
          return s;
        },
      },
      legend: {
        enabled: false,
      },
      series: raw.map((item, idx) => {
        const startTimestamp = new Date(item.start_time).getTime();
        const endTimestamp = new Date(item.end_time).getTime();

        return {
          name: `Device ${item.device_id}`,
          data: [
            [startTimestamp, item.start_battery_level],
            [endTimestamp, item.end_battery_level],
          ],
          color: item.end_battery_level < item.start_battery_level ? '#E83B2D' : '#2DA74E',
          type: 'line',
        };
      }),
    };
  });
}