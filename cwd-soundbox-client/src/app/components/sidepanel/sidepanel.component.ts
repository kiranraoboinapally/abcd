import { Component, inject } from '@angular/core';
import { AppStateService } from '../../shared/app-state.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [NgFor],
  template: `
    <nav class="side-panel">
      <button 
        *ngFor="let item of menuItems" 
        (click)="setView(item.view)">
        {{ item.label }}
      </button>
    </nav>
  `,
  styles: [`
    .side-panel {
      position: fixed;
      top: 71px;
      left: 0;
      width: 200px;
      height: calc(100vh - 71px);
      background-color: #2c3e50;
      color: white;
      display: flex;
      flex-direction: column;
    }

    button {
      background: none;
      border: none;
      color: white;
      padding: 15px;
      text-align: left;
      cursor: pointer;
      font-size: 16px;
      width: 100%;
    }

    button:hover {
      background-color: #34495e;
    }
  `]
})
export class SidePanelComponent {
  private appState = inject(AppStateService);

  menuItems: { label: string; view: 'dashboard' | 'settings' }[] = [
    { label: 'Dashboard', view: 'dashboard' },
    { label: 'Settings', view: 'settings' }
  ];

  setView(view: 'dashboard' | 'settings') {
    this.appState.currentView.set(view);
  }
}
