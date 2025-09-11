import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../src/environments/environment';

Chart.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

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
  imports: [CommonModule, NgChartsModule, HttpClientModule],
  template: `
    <div class="device-health-wrapper">
      <!-- Left: Line Chart -->
      <div class="chart-box">
        <canvas
          baseChart
          [data]="lineChartData()"
          [type]="lineChartType"
          [options]="lineChartOptions"
        >
        </canvas>
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

  // LINE CHART SETTINGS
  lineChartType: any = 'line';

  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const datasetIndex = ctx.datasetIndex;
            const raw = this.data();
            const record = raw[datasetIndex];
            const batteryLevel = ctx.parsed.y;
            const time = new Date(ctx.parsed.x).toLocaleString();

            return [
              `Block: ${record.block}`,
              `Device ID: ${record.device_id}`,
              `Battery Level: ${batteryLevel}%`,
              `Time: ${time}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'PPpp',
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Battery Level (%)',
        },
        min: 0,
        max: 100,
      },
    },
  };

  lineChartData = computed(() => {
    const raw = this.data();

    return {
      datasets: raw.map((item, idx) => {
        const startTimestamp = new Date(item.start_time).getTime();
        const endTimestamp = new Date(item.end_time).getTime();

        const startLevel = item.start_battery_level;
        const endLevel = item.end_battery_level;

        const lineColor = endLevel < startLevel ? '#E83B2D' : '#2DA74E';

        return {
          label: `Record ${idx + 1} Device ${item.device_id}`,
          data: [
            { x: startTimestamp, y: startLevel },
            { x: endTimestamp, y: endLevel },
          ],
          fill: false,
          borderColor: lineColor, // line color red or green
          backgroundColor: lineColor, // line background color (not for points)
          pointRadius: 1,
          //pointBackgroundColor: '#1D1D1D', // black fill for points
          pointBorderColor: '#1D1D1D', // black border for points
          borderWidth: 2,
          tension: 0.2,
          showLine: true,
          spanGaps: true,
        };
      }),
    };
  });
}
