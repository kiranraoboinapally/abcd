import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  // Define the currentView signal here
  currentView = signal<'dashboard' | 'settings'>('dashboard');
}
