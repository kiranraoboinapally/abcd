import { Component } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  template: `<header class="top-bar">My Angular App</header>`,
  styles: [`
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 71px;
      width: 100%;
      background-color: #ecf0f1;
      display: flex;
      align-items: center;
      padding-left: 220px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
      font-weight: bold;
    }
  `]
})
export class TopBarComponent {}
