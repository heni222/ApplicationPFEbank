import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const http = inject(HttpClient);

  try {
    await firstValueFrom(
      http.get('http://localhost:3000/auth/me', {
        withCredentials: true
      })
    );

    return true;
  } catch {
    return router.createUrlTree(['/login']);
  }
};