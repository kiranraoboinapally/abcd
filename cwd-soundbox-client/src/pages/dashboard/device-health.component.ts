import {
  Component,
  OnInit,
  OnChanges,
  signal,
  computed,
  Input,
  SimpleChanges,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../src/environments/environment';
import * as Highcharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
import HC_solidgauge from 'highcharts/modules/solid-gauge';
import HC_accessibility from 'highcharts/modules/accessibility';
import { HighchartsChartModule } from 'highcharts-angular';

HC_more(Highcharts);
HC_solidgauge(Highcharts);
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

export interface AtRiskDevice {
  device_id: number;
  device_bs: number;
}

@Component({
  selector: 'app-device-health',
  standalone: true,
  imports: [CommonModule, HttpClientModule, HighchartsChartModule],
  template: `
    <div class="flex flex-nowrap gap-2 p-1 bg-gray-100 min-h-[648px]">
      <div class="w-[400px] h-[648px] bg-white rounded-lg shadow-md flex flex-col box-border p-2">
        <div class="w-full h-[27px] font-bold text-lg text-gray-800 mb-2 select-none">
          At Risk Devices
        </div>
        <table class="w-full border-collapse text-sm select-none">
          <thead>
            <tr class="h-[38px] bg-gray-200">
              <th class="p-3 text-center font-bold text-gray-800 border-b border-gray-400">Device ID</th>
              <th class="p-3 text-center font-bold text-gray-800 border-b border-gray-400">Battery Score</th>
            </tr>
          </thead>
        </table>
        <div class="w-full flex-grow overflow-y-auto mt-1 border border-gray-300 rounded">
          <table class="w-full border-collapse text-sm">
            <tbody>
              <tr *ngFor="let item of paginatedAtRiskData()" 
                  class="h-[48px] border-b border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
                  [class.bg-blue-100]="item.device_id === selectedDevice()"
                  (click)="selectDevice(item.device_id)">
                <td class="px-4 py-3 text-center whitespace-nowrap">{{ item.device_id }}</td>
                <td class="px-4 py-3 text-center whitespace-nowrap">{{ item.device_bs | number:'1.1-1' }}%</td>
              </tr>
              <tr *ngIf="atRiskData().length === 0">
                <td colspan="2" class="text-center text-gray-500 p-4">No at-risk devices found.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end items-center gap-2 text-xs mt-1 select-none border-t border-gray-300 pt-3 mt-auto">
          <button (click)="atRiskPrevPage()" [disabled]="atRiskCurrentPage() === 1" class="px-2 py-1 text-lg leading-none rounded hover:bg-blue-100 disabled:text-gray-300">‹</button>
          <span>{{ atRiskStartItem() }} – {{ atRiskEndItem() }} of {{ atRiskTotalItems() }}</span>
          <button (click)="atRiskNextPage()" [disabled]="atRiskCurrentPage() === atRiskTotalPages()" class="px-2 py-1 text-lg leading-none rounded hover:bg-blue-100 disabled:text-gray-300">›</button>
        </div>
      </div>

      <div class="flex flex-col gap-2 flex-grow h-[648px] box-border">
        <div class="h-[300px] p-2 bg-white rounded-lg shadow-md flex flex-col items-start">
          <div class="w-full h-12 flex items-center border-b border-gray-300 mb-3">
            <h2 class="m-0 font-bold text-xl text-gray-700">Battery Status Over Time{{ selectedDevice() ? ' for Device ' + selectedDevice() : '' }}</h2>
          </div>
          <highcharts-chart *ngIf="filteredData().length > 0; else noDataChart" [Highcharts]="Highcharts" [options]="chartOptions()" style="width: 100%; height: 200px; display: block;"></highcharts-chart>
          <ng-template #noDataChart><div class="flex items-center justify-center w-full h-full text-gray-500">No battery data to display.</div></ng-template>
        </div>

        <div class="flex-1 bg-white rounded-lg shadow-md flex flex-col p-2 box-border">
          <div class="w-full h-[27px] font-bold text-lg text-gray-800 mb-2 select-none">
            Device Health Records
          </div>
          <table class="w-full border-collapse text-sm select-none">
            <thead>
              <tr class="h-[38px] bg-gray-200">
                <th class="p-3 text-center font-bold text-gray-800 border-b">Block</th>
                <th class="p-3 text-center font-bold text-gray-800 border-b">Device ID</th>
                <th class="p-3 text-center font-bold text-gray-800 border-b">Charging Status</th>
                <th class="p-3 text-center font-bold text-gray-800 border-b">Start Battery</th>
                <th class="p-3 text-center font-bold text-gray-800 border-b">End Battery</th>
                <th class="p-3 text-center font-bold text-gray-800 border-b">Start Time</th>
                <th class="p-3 text-center font-bold text-gray-800 border-b">End Time</th>
                <th class="p-3 text-center font-bold text-gray-800 border-b">Anomaly</th>
              </tr>
            </thead>
          </table>
          <div class="w-full flex-grow mt-1 border border-gray-300 rounded overflow-y-auto">
            <table class="w-full border-collapse text-sm">
              <tbody>
                <tr *ngFor="let item of paginatedData()" class="h-[48px] border-b border-gray-300 hover:bg-gray-100">
                  <td class="px-4 py-3 text-center">{{ item.block }}</td>
                  <td class="px-4 py-3 text-center">{{ item.device_id }}</td>
                  <td class="px-4 py-3 text-center">{{ item.charging_status }}</td>
                  <td class="px-4 py-3 text-center">{{ item.start_battery_level }}%</td>
                  <td class="px-4 py-3 text-center">{{ item.end_battery_level }}%</td>
                  <td class="px-4 py-3 text-center">{{ item.start_time }}</td>
                  <td class="px-4 py-3 text-center">{{ item.end_time }}</td>
                  <td class="px-4 py-3 text-center">{{ item.is_anomaly }}</td>
                </tr>
                 <tr *ngIf="filteredData().length === 0">
                    <td colspan="8" class="text-center text-gray-500 p-4">No health records to display.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end items-center gap-2 text-xs mt-1 select-none border-t border-gray-300 pt-3 mt-auto">
             <button (click)="prevPage()" [disabled]="currentPage() === 1" class="px-2 py-1 text-lg leading-none rounded hover:bg-blue-100 disabled:text-gray-300">‹</button>
            <span>{{ startItem() }} – {{ endItem() }} of {{ totalItems() }}</span>
            <button (click)="nextPage()" [disabled]="currentPage() === totalPages()" class="px-2 py-1 text-lg leading-none rounded hover:bg-blue-100 disabled:text-gray-300">›</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DeviceHealthComponent implements OnInit, OnChanges {
  private apiUrl = environment.apiUrl;

  data = signal<DeviceHealth[]>([]);
  atRiskData = signal<AtRiskDevice[]>([]);
  selectedDevice = signal<number | null>(null);
  
  private perPage = 4;
  private atRiskPerPage = 10;
  currentPage = signal(1);
  atRiskCurrentPage = signal(1);
  Highcharts: typeof Highcharts = Highcharts;

  @Input() searchTerm: string = '';
  @Input() deviceFilter: string = '';
  @Input() chargingStatusFilter: string = '';
  @Input() statusFilter: string = '';
  @Output() deviceSelected = new EventEmitter<number | null>();

  // **FIX**: This computed signal correctly filters the main table and chart
  // based on the device selected either from the filter or the 'At Risk' list.
  filteredData = computed(() => {
    const allData = this.data();
    const selected = this.selectedDevice();
    if (selected === null) {
      return [];
    }
    return allData.filter(d => d.device_id === selected);
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
    this.fetchAtRiskData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const shouldRefetch = changes['deviceFilter'] || changes['chargingStatusFilter'] || changes['statusFilter'] || changes['searchTerm'];
    
    if (shouldRefetch) {
      this.fetchData();
      this.fetchAtRiskData();
      this.currentPage.set(1);
      this.atRiskCurrentPage.set(1);
    }

    if (changes['deviceFilter']) {
      const newFilterValue = changes['deviceFilter'].currentValue;
      if (newFilterValue) {
        this.selectDevice(parseInt(newFilterValue, 10));
      } else {
        this.selectDevice(null);
      }
    }
  }

  selectDevice(deviceId: number | null): void {
    this.selectedDevice.set(deviceId);
    this.deviceSelected.emit(deviceId);
    this.currentPage.set(1);
  }

  fetchData() {
    let url = `${this.apiUrl}/getDeviceHealthData`;
    const params: { [key: string]: string } = {};
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.deviceFilter) params['device_id'] = this.deviceFilter;
    if (this.chargingStatusFilter) params['charging_status'] = this.chargingStatusFilter;
    if (this.statusFilter) params['is_anomaly'] = this.statusFilter === 'Anomaly' ? 'Yes' : 'No';

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;

    this.http
      .get<{ battery_health: DeviceHealth[] }>(url)
      .subscribe({
        next: (res) => {
          this.data.set(res.battery_health || []);
        },
        error: (err) => console.error('Error fetching device health data:', err),
      });
  }

  fetchAtRiskData() {
    let url = `${this.apiUrl}/getAtRiskKPIs`;
    const params: { [key: string]: string } = {};
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.deviceFilter) params['device_id'] = this.deviceFilter;

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;

    this.http
      .get<{ kpi: any; at_risk_devices: AtRiskDevice[] }>(url)
      .subscribe({
        next: (res) => {
          const atRiskDevices = res.at_risk_devices || [];
          this.atRiskData.set(atRiskDevices);
          
          if (!this.deviceFilter && this.selectedDevice() === null && atRiskDevices.length > 0) {
              this.selectDevice(atRiskDevices[0].device_id);
          }
        },
        error: (err) => console.error('Error fetching at risk data:', err),
      });
  }

  // Pagination for Main Health Records Table
  totalItems = computed(() => this.filteredData().length);
  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage;
    return this.filteredData().slice(start, start + this.perPage);
  });
  totalPages = computed(() => Math.ceil(this.totalItems() / this.perPage) || 1);
  nextPage = () => this.currentPage.update((p) => Math.min(p + 1, this.totalPages()));
  prevPage = () => this.currentPage.update((p) => Math.max(p - 1, 1));
  startItem = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.perPage + 1);
  endItem = computed(() => Math.min(this.currentPage() * this.perPage, this.totalItems()));

  // Pagination for At Risk Devices Table
  atRiskTotalItems = computed(() => this.atRiskData().length);
  paginatedAtRiskData = computed(() => {
    const start = (this.atRiskCurrentPage() - 1) * this.atRiskPerPage;
    return this.atRiskData().slice(start, start + this.atRiskPerPage);
  });
  atRiskTotalPages = computed(() => Math.ceil(this.atRiskTotalItems() / this.atRiskPerPage) || 1);
  atRiskNextPage = () => this.atRiskCurrentPage.update((p) => Math.min(p + 1, this.atRiskTotalPages()));
  atRiskPrevPage = () => this.atRiskCurrentPage.update((p) => Math.max(p - 1, 1));
  atRiskStartItem = computed(() => this.atRiskTotalItems() === 0 ? 0 : (this.atRiskCurrentPage() - 1) * this.atRiskPerPage + 1);
  atRiskEndItem = computed(() => Math.min(this.atRiskCurrentPage() * this.perPage, this.atRiskTotalItems()));

  // Highcharts Options
  chartOptions = computed((): Highcharts.Options => ({
    chart: { type: 'line', height: 200 },
    title: { text: '' },
    xAxis: { type: 'datetime', title: { text: 'Time' } },
    yAxis: { min: 0, max: 100, title: { text: 'Battery Level (%)' } },
    tooltip: {
      headerFormat: '<span style="font-size: 12px">Time: {point.key:%e %b %Y, %H:%M}</span><br/>',
      pointFormat: '<b>Device ID:</b> {series.options.custom.deviceId}<br/>' +
                   '<b>Block:</b> {series.name}<br/>' +
                   '<b>Status:</b> {series.options.custom.chargingStatus}<br/>' +
                   '<b>Battery:</b> {point.y:.1f}%',
      useHTML: true,
    },
    legend: { enabled: false },
    series: this.filteredData().map(item => ({
      name: `${item.block}`, // Using just the block number as the series name
      type: 'line',
      data: [
        [new Date(item.start_time).getTime(), item.start_battery_level],
        [new Date(item.end_time).getTime(), item.end_battery_level],
      ],
      // Custom data to be used in the tooltip
      custom: {
        deviceId: item.device_id,
        chargingStatus: item.charging_status,
      },
      color: item.is_anomaly === 'Yes' ? '#E83B2D' : (item.end_battery_level < item.start_battery_level ? '#F6A121' : '#2DA74E'),
    })),
  }));
}