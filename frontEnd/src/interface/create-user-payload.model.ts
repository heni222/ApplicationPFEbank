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