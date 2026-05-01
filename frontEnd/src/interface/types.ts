// types.ts - Nouveaux modèles
export interface Client {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  cin: string;
  profession: string;
  revenue: number;
  monthlyCharges: number;
  existingLoans: number;
  createdAt: Date;
}

export interface CreditApplication {
  _id: string;
  clientId: string;
  clientName: string;
  amount: number;
  duration: number; // en mois
  monthlyPayment: number;
  purpose: string;
  status: 'EN_ATTENTE' | 'EN_ANALYSE' | 'ACCEPTE' | 'REFUSE';
  documents: Document[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  processedBy?: string;
  rejectionReason?: string;
}

export interface Document {
  _id: string;
  type: 'CNI' | 'REVENUS' | 'DOMICILE' | 'TRAVAIL' | 'AUTRE';
  name: string;
  url: string;
  uploadedAt: Date;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';
}

export interface Comment {
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}