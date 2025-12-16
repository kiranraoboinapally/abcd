import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercepts outgoing HTTP requests to add the JWT Authorization header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Retrieve the authentication token from localStorage.
  // ⚠️ Replace 'your_token_key' with the actual key you use after login.
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXhwIjoxNzY1OTU0ODE1LCJpYXQiOjE3NjU4Njg0MTV9.Oulo_q07TweOKh2eRoRKSxNLOSt4apk0KSgXG--TIWk";

  // If a token exists, clone the request to add the new header.
  if (token) {
    const clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    // Pass the cloned request with the header to the next handler.
    return next(clonedRequest);
  }

  // If no token is found, pass the original request along.
  return next(req);
};