import { Component } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  template: `<header
  class="fixed top-0 left-0 h-[71px] w-full bg-[#ecf0f1] flex items-center pl-[220px] shadow-md z-50 font-bold"
>
  My Angular App
</header>
`
})
export class TopBarComponent {}
