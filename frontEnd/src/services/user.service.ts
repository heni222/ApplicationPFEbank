import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateUserPayload } from '../interface/create-user-payload.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

 createCompte(payload: any, badgePhoto?: File | null) {
  const formData = new FormData();

  // ✅ ajouter tous les champs
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  // ✅ fichier optionnel
  if (badgePhoto) {
    formData.append('badgePhoto', badgePhoto);
  }

  return this.http.post(`${this.apiUrl}/create`,formData);
}
}
