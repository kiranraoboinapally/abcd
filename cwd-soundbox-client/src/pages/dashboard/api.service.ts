import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // Adjusted path for typical project structure

// INTERFACES
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

interface Transaction {
  transactionsId: string;
  deviceID: string;
  amount: number;
  mlOutput: string;
  confidence: string;
  timeStamp: string;
  review: string;
}

interface AtRiskKPIsResponse {
  kpi: {
    total_devices: number;
    at_risk: number;
    at_risk_percent: number;
  };
  at_risk_devices: AtRiskDevice[];
}


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDeviceHealthData(filters: {
    search?: string;
    device_id?: string;
    charging_status?: string;
    is_anomaly?: string;
  } = {}): Observable<DeviceHealth[]> {
    let url = `${this.apiUrl}/getDeviceHealthData`;
    const params: { [key: string]: string } = {};

    if (filters.search) params['search'] = filters.search;
    if (filters.device_id) params['device_id'] = filters.device_id;
    if (filters.charging_status) params['charging_status'] = filters.charging_status;
    if (filters.is_anomaly) params['is_anomaly'] = filters.is_anomaly;

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;

    return this.http.get<{ battery_health: DeviceHealth[] }>(url).pipe(
      map(response => response.battery_health || [])
    );
  }

  getAtRiskKPIs(filters: {
    search?: string;
    device_id?: string;
  } = {}): Observable<AtRiskDevice[]> {
    let url = `${this.apiUrl}/getAtRiskKPIs`;
    const params: { [key: string]: string } = {};

    if (filters.search) params['search'] = filters.search;
    if (filters.device_id) params['device_id'] = filters.device_id;

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;

    return this.http.get<{ kpi: any; at_risk_devices: AtRiskDevice[] }>(url).pipe(
      map(response => response.at_risk_devices || [])
    );
  }

  getAtRiskKPIsFull(filters: {
    search?: string;
    device_id?: string;
  } = {}): Observable<AtRiskKPIsResponse> {
    let url = `${this.apiUrl}/getAtRiskKPIs`;
    const params: { [key: string]: string } = {};

    if (filters.search) params['search'] = filters.search;
    if (filters.device_id) params['device_id'] = filters.device_id;

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;
    
    // ✨ No more manual token or header logic needed here!
    return this.http.get<AtRiskKPIsResponse>(url);
  }

  getTransactionData(filters: {
    time?: string;
    anomaly_check?: string;
    device_id?: string;
    search?: string;
  } = {}): Observable<Transaction[]> {
    let url = `${this.apiUrl}/fetchData`;
    const params: { [key: string]: string } = {};

    if (filters.time) params['time'] = filters.time;
    if (filters.anomaly_check) params['anomaly_check'] = filters.anomaly_check;
    if (filters.device_id) params['device_id'] = filters.device_id;
    if (filters.search) params['search'] = filters.search;

    const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    if (queryString) url += `?${queryString}`;

    return this.http.get<{ transactions: any[] }>(url).pipe(
      map(response => response.transactions.map(t => ({
        transactionsId: t.transaction_id,
        deviceID: t.device_id,
        amount: t.transaction_amt,
        mlOutput: t.anomaly_check,
        confidence: Number(t.confidence_score).toFixed(2),
        timeStamp: t.transaction_timestamp,
        review: t.review == null ? '' : t.review
      })))
    );
  }

  updateReview(transactionId: string, reviewValue: 'Yes' | 'No'): Observable<any> {
    return this.http.post(`${this.apiUrl}/updateReview`, {
      transaction_id: transactionId,
      review: reviewValue
    });
  }

  getAllDeviceIds(): Observable<string[]> {
    return this.http.get<{ device_ids: number[] }>(`${this.apiUrl}/getAllDeviceIds`).pipe(
      map(res => res.device_ids.map(id => id.toString()))
    );
  }

  getDeviceHealthIds(): Observable<string[]> {
    return this.http.get<{ device_ids: number[] }>(`${this.apiUrl}/getDeviceHealthIds`).pipe(
      map(res => res.device_ids.map(id => id.toString()))
    );
  }

  updateConfidenceThreshold(threshold: number): Observable<any> {
    const payload = { confidence_threshold: threshold };
    return this.http.post(`${this.apiUrl}/updateConfidenceThreshold`, payload);
  }
}