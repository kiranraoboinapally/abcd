import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../src/environments/environment';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import HC_exporting from 'highcharts/modules/exporting';

// Initialize additional modules
HighchartsMore(Highcharts);
HC_exporting(Highcharts);

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

@Component({
  selector: 'app-device-health',
  standalone: true,
  imports: [CommonModule, HttpClientModule,HighchartsChartModule],
  template: `
    <div class="device-health-wrapper">
      <!-- Left: Highcharts Line Chart -->
      <div class="chart-box">
        <highcharts-chart 
          [Highcharts]="Highcharts"
          [options]="chartOptions()"
          style="width: 100%; height: 500px; display: block;"
        ></highcharts-chart>
      </div>

      <!-- Right: Table -->
      <div class="table-box">
        <table class="device-table">
          <thead>
            <tr>
              <th>Block</th>
              <th>Device ID</th>
              <th>Charging Status</th>
              <th>Start Battery Level</th>
              <th>End Battery Level</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Anomaly</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of paginatedData()">
              <td>{{ item.block }}</td>
              <td>{{ item.device_id }}</td>
              <td>{{ item.charging_status }}</td>
              <td>{{ item.start_battery_level }}%</td>
              <td>{{ item.end_battery_level }}%</td>
              <td>{{ item.start_time }}</td>
              <td>{{ item.end_time }}</td>
              <td>{{ item.is_anomaly }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination-controls">
          <div class="page-info">
            Showing {{ startItem() }} to {{ endItem() }} of {{ totalItems() }} items
          </div>
          <div class="page-buttons">
            <button class="btn page-btn" (click)="prevPage()" [disabled]="currentPage() === 1">
              Previous
            </button>
            <button
              class="btn page-btn"
              (click)="nextPage()"
              [disabled]="currentPage() === totalPages()"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .chart-box {
        flex: 0 0 600px;
        height: 500px;
        padding: 1rem;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }

      .table-box {
        flex: 1;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        overflow-x: auto;
        display: flex;
        flex-direction: column;
      }

      .device-table {
        width: 100%;
        border-collapse: collapse;
        font-family: 'Nunito Sans', sans-serif;
        font-size: 14px;
      }

      .device-table th,
      .device-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }

      .device-table th {
        background-color: #e8e8e8;
        font-weight: 700;
        color: #333;
      }

      .device-table tr:hover {
        background-color: #f0f0f0;
      }

      .pagination-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-top: 1px solid #ddd;
      }

      .page-info {
        font-size: 14px;
        color: #666;
      }

      .page-buttons {
        display: flex;
        gap: 8px;
      }

      .page-btn {
        padding: 8px 16px;
        border: 1px solid #ccc;
        background-color: #f9f9f9;
        cursor: pointer;
        border-radius: 4px;
        font-family: 'Nunito Sans', sans-serif;
        font-size: 14px;
        transition: background-color 0.3s ease;
      }

      .page-btn:hover:not([disabled]) {
        background-color: #e0e0e0;
      }

      .page-btn[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }


      /* keep your existing styles unchanged */
      .device-health-wrapper {
        display: flex;
        gap: 1rem;
        flex-wrap: nowrap;
        padding: 1rem;
        background: #f9f9f9;
        min-height: 500px;
      }

      .chart-box {
        flex: 0 0 600px;
        height: 500px;
        padding: 1rem;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }

      .table-box {
        flex: 1;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        overflow-x: auto;
        display: flex;
        flex-direction: column;
      }

      .device-table {
        width: 100%;
        border-collapse: collapse;
        font-family: 'Nunito Sans', sans-serif;
        font-size: 14px;
      }

      .device-table th,
      .device-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }

      .device-table th {
        background-color: #e8e8e8;
        font-weight: 700;
        color: #333;
      }

      .device-table tr:hover {
        background-color: #f0f0f0;
      }

      .pagination-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-top: 1px solid #ddd;
      }

      .page-info {
        font-size: 14px;
        color: #666;
      }

      .page-buttons {
        display: flex;
        gap: 8px;
      }

      .page-btn {
        padding: 8px 16px;
        border: 1px solid #ccc;
        background-color: #f9f9f9;
        cursor: pointer;
        border-radius: 4px;
        font-family: 'Nunito Sans', sans-serif;
        font-size: 14px;
        transition: background-color 0.3s ease;
      }

      .page-btn:hover:not([disabled]) {
        background-color: #e0e0e0;
      }

      .page-btn[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class DeviceHealthComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  data = signal<DeviceHealth[]>([]);
  private perPage = 10;
  currentPage = signal(1);

  Highcharts: typeof Highcharts = Highcharts;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.http
      .get<{ device_health: DeviceHealth[] }>(`${this.apiUrl}/getDeviceHealthData`)
      .subscribe({
        next: (response) => {
          this.data.set(response.device_health);
        },
        error: (error) => {
          console.error('Error fetching device health data:', error);
        },
      });
  }

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

  // Highcharts options computed from data
  chartOptions = computed(() => {
    const raw = this.data();

    return {
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
          // `this` here is the tooltip context with points array
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

        const startLevel = item.start_battery_level;
        const endLevel = item.end_battery_level;

        const lineColor = endLevel < startLevel ? '#E83B2D' : '#2DA74E';

        return {
          name: `Record ${idx + 1} Device ${item.device_id}`,
          data: [
            [startTimestamp, startLevel],
            [endTimestamp, endLevel],
          ],
          color: lineColor,
          lineWidth: 2,
          marker: {
            enabled: true,
            radius: 3,
            lineColor: '#1D1D1D',
            lineWidth: 1,
          },
          connectNulls: true,
          type: 'line',
        };
      }),
    } as Highcharts.Options;
  });
}
