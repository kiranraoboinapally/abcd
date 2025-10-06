import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { App } from './app';
import { authInterceptor } from './services/auth.interceptor';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
}).catch(err => console.error(err));
