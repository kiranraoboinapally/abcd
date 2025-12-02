import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercepts outgoing HTTP requests to add the JWT Authorization header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Retrieve the authentication token from localStorage.
  // ⚠️ Replace 'your_token_key' with the actual key you use after login.
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXhwIjoxNzY0NzQzNjk4LCJpYXQiOjE3NjQ2NTcyOTh9.xF-n_IZ3w8Kcu2svqmpFZurr7vQdU7iT7yWcE296JTM";

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