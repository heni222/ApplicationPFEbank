import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const http = inject(HttpClient);

  try {
    const res: any = await firstValueFrom(
      http.get('http://localhost:3000/auth/me', {
        withCredentials: true
      })
    );

    const user = res.user;
    const allowedRoles = route.data?.['roles'] as string[];

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree(['/unauthorized']);

  } catch {
    return router.createUrlTree(['/login']);
  }
};