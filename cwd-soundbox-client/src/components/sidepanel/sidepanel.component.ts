import { Component, inject } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [NgFor],
  template: `
<nav
  class="fixed top-[71px] left-0 w-[200px] h-[calc(100vh-71px)] bg-[#2c3e50] text-white flex flex-col"
>
  <button
    *ngFor="let item of menuItems"
    (click)="setView(item.view)"
    class="bg-none border-none text-white p-4 text-left cursor-pointer text-base w-full hover:bg-[#34495e]"
  >
    {{ item.label }}
  </button>
</nav>

  `
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
