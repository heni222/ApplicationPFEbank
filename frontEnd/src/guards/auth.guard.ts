import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const http = inject(HttpClient);

  try {
    await http.get('http://localhost:3000/auth/me', {
      withCredentials: true
    }).toPromise();

    return true;
  } catch {
    return router.createUrlTree(['/login']);
  }
};
