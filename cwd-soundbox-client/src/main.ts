import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Import withInterceptors
import { App } from './app/app';
import { authInterceptor } from './app/auth.interceptor'; // Import your interceptor

bootstrapApplication(App, {
  providers: [
    // Provide HttpClient and register your interceptor here
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
}).catch(err => console.error(err));