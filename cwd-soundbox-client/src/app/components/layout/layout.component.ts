import { Component } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SidePanelComponent } from '../sidepanel/sidepanel.component';
import { DashboardPageComponent } from '../../../pages/dashboard/dashboard.page';
import { SettingsPageComponent } from '../../../pages/settings/settings.page';
import { AppStateService } from '../../shared/app-state.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    TopBarComponent,
    SidePanelComponent,
    DashboardPageComponent,
    SettingsPageComponent,
    NgIf
  ],
  template: `
    <app-top-bar></app-top-bar>
<app-side-panel></app-side-panel>

<div
  class="ml-[200px] mt-[71px] h-[calc(100vh-71px)] p-5 bg-[#f5f6fa] overflow-y-auto"
>
  <app-dashboard-page *ngIf="state.currentView() === 'dashboard'"></app-dashboard-page>
  <app-settings-page *ngIf="state.currentView() === 'settings'"></app-settings-page>
</div>

  `
})
export class LayoutComponent {
  constructor(public state: AppStateService) {}
}
