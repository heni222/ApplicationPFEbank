import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateUserPayload {
  // Identité
  fullName: string;
  cin: string;
  dob: string;
  phone: string;
  address: string;
  city: string;

  // Organisation
  employeeId: string;
  branch: string;
  department: string;
  jobTitle: string;
  manager?: string;
  status: string;
  contractType: string;
  startDate: string;

  // Sécurité
  email: string;
  role: string;
  accessLevel: string;
  mfaMethod: string;
  enableFaceId: boolean;
  password: string;
  terms: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private apiUrl = 'http://localhost:5000/users';


  constructor(private http: HttpClient) { }

  createCompte(
    payload: CreateUserPayload,
    badgePhoto?: File | null
  ): Observable<any> {

    // 🔵 Si tu as une image → multipart/form-data
    if (badgePhoto) {
      const formData = new FormData();

      formData.append('data', JSON.stringify(payload));

      formData.append('badgePhoto', badgePhoto);
      console.log('les données envoyées',formData)

      return this.http.post(`${this.apiUrl}/create`, formData);
    }

    // 🔵 Sinon JSON simple
    return this.http.post(`${this.apiUrl}/create`, payload);
  }
}
