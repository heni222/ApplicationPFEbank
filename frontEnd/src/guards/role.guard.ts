import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const http = inject(HttpClient);

  try {
    // نطلب user من backend (cookie automatiquement)
    const res: any = await http.get('http://localhost:3000/auth/me', {
      withCredentials: true
    }).toPromise();

    const user = res.user;

    const allowedRoles = route.data?.['roles'] as string[];

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    // role غير مسموح
    return router.createUrlTree(['/unauthorized']);

  } catch (error) {
    // مش logged in
    return router.createUrlTree(['/login']);
  }
};