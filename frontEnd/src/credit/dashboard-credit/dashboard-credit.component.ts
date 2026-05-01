// dashboard-credit.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  duration: number;
  monthlyPayment: number;
  purpose: string;
  status: 'EN_ATTENTE' | 'EN_ANALYSE' | 'ACCEPTE' | 'REFUSE';
  documents: any[];
  comments: any[];
  createdAt: Date;
  updatedAt: Date;
  processedBy?: string;
  rejectionReason?: string;
}

@Component({
  selector: 'app-dashboard-credit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-credit.component.html',
  styleUrls: ['./dashboard-credit.component.scss']
})
export class DashboardCreditComponent implements OnInit {
  // Données
  applications: CreditApplication[] = [];
  clients: Client[] = [];
  loading = false;
  message = '';
  
  // UI State
  sidebarCollapsed = false;
  currentView = 'dashboard';
  searchTerm = '';
  filterStatus: string = 'ALL';
  filterAmount: string = 'ALL';
  selectedApplication: CreditApplication | null = null;
  showNewApplicationModal = false;
  
  // Nouvelle demande
  newApplication: any = {
    clientId: '',
    amount: 0,
    duration: 0,
    monthlyPayment: 0,
    purpose: ''
  };
  
  showDebtWarning = false;
  
  // Sidebar items
  sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', active: true },
    { id: 'applications', label: 'Dossiers', icon: '📋', active: false },
    { id: 'clients', label: 'Clients', icon: '👥', active: false },
    { id: 'documents', label: 'Documents', icon: '📎', active: false },
    { id: 'analytics', label: 'Analytiques', icon: '📈', active: false },
  ];
  
  // KPIs
  totalApplications = 0;
  pendingApplications = 0;
  analyzingApplications = 0;
  acceptedApplications = 0;
  totalAmount = 0;
  approvalRate = 0;
  acceptanceRateChange = 0;
  
  // Statistiques
  monthlyStats: any[] = [];
  maxMonthlyCount = 0;
  amountDistribution = {
    small: 0,
    medium: 0,
    large: 0
  };
  
  ngOnInit(): void {
    this.loadData();
    this.setupKeyboardShortcuts();
  }
  
  loadData(): void {
    this.loading = true;
    
    // Simuler chargement des données
    setTimeout(() => {
      this.loadApplications();
      this.loadClients();
      this.updateKPIs();
      this.calculateStatistics();
      this.loading = false;
    }, 500);
  }
  
  loadApplications(): void {
    // Données simulées
    this.applications = [
      {
        _id: '1',
        clientId: '1',
        clientName: 'Jean Dupont',
        amount: 25000,
        duration: 60,
        monthlyPayment: 467,
        purpose: 'ACHAT_VEHICULE',
        status: 'EN_ATTENTE',
        documents: [],
        comments: [{
          userId: 'user1',
          userName: 'Système',
          content: 'Demande créée',
          createdAt: new Date()
        }],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        _id: '2',
        clientId: '2',
        clientName: 'Marie Martin',
        amount: 150000,
        duration: 240,
        monthlyPayment: 985,
        purpose: 'ACHAT_IMMOBILIER',
        status: 'EN_ANALYSE',
        documents: [],
        comments: [{
          userId: 'user1',
          userName: 'Système',
          content: 'Demande créée',
          createdAt: new Date()
        }],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12')
      },
      {
        _id: '3',
        clientId: '1',
        clientName: 'Jean Dupont',
        amount: 5000,
        duration: 24,
        monthlyPayment: 219,
        purpose: 'CONSOMMATION',
        status: 'ACCEPTE',
        documents: [],
        comments: [],
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2023-12-05')
      }
    ];
  }
  
  loadClients(): void {
    this.clients = [
      {
        _id: '1',
        fullName: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '0612345678',
        address: '15 rue de Paris, 75001 Paris',
        cin: '123456789',
        profession: 'Ingénieur',
        revenue: 3500,
        monthlyCharges: 1200,
        existingLoans: 0,
        createdAt: new Date()
      },
      {
        _id: '2',
        fullName: 'Marie Martin',
        email: 'marie.martin@email.com',
        phone: '0698765432',
        address: '8 avenue de la République, 69001 Lyon',
        cin: '987654321',
        profession: 'Médecin',
        revenue: 5500,
        monthlyCharges: 1800,
        existingLoans: 120000,
        createdAt: new Date()
      },
      {
        _id: '3',
        fullName: 'Pierre Bernard',
        email: 'pierre.bernard@email.com',
        phone: '0678912345',
        address: '3 rue des Lilas, 13001 Marseille',
        cin: '456789123',
        profession: 'Commercial',
        revenue: 2800,
        monthlyCharges: 1000,
        existingLoans: 5000,
        createdAt: new Date()
      }
    ];
  }
  
  updateKPIs(): void {
    this.totalApplications = this.applications.length;
    this.pendingApplications = this.applications.filter(a => a.status === 'EN_ATTENTE').length;
    this.analyzingApplications = this.applications.filter(a => a.status === 'EN_ANALYSE').length;
    this.acceptedApplications = this.applications.filter(a => a.status === 'ACCEPTE').length;
    this.totalAmount = this.applications.filter(a => a.status === 'ACCEPTE').reduce((sum, a) => sum + a.amount, 0);
    this.approvalRate = this.totalApplications > 0 ? Math.round((this.acceptedApplications / this.totalApplications) * 100) : 0;
    this.acceptanceRateChange = 5; // Simulé
  }
  
  calculateStatistics(): void {
    // Calcul distribution des montants
    this.amountDistribution = {
      small: this.applications.filter(a => a.amount < 10000).length,
      medium: this.applications.filter(a => a.amount >= 10000 && a.amount <= 50000).length,
      large: this.applications.filter(a => a.amount > 50000).length
    };
    
    // Statistiques mensuelles (simulées)
    this.monthlyStats = [
      { month: 'Jan', count: 12 },
      { month: 'Fév', count: 15 },
      { month: 'Mar', count: 18 },
      { month: 'Avr', count: 22 },
      { month: 'Mai', count: 20 },
      { month: 'Juin', count: 25 }
    ];
    this.maxMonthlyCount = Math.max(...this.monthlyStats.map(m => m.count));
  }
  
  // US2.1 - Créer une demande
  openNewApplicationModal(): void {
    this.newApplication = {
      clientId: '',
      amount: 0,
      duration: 0,
      monthlyPayment: 0,
      purpose: ''
    };
    this.showDebtWarning = false;
    this.showNewApplicationModal = true;
  }
  
  closeNewApplicationModal(): void {
    this.showNewApplicationModal = false;
  }
  
  onClientSelect(): void {
    this.calculateMonthlyPayment();
    this.checkDebtRatio();
  }
  
  calculateMonthlyPayment(): void {
    if (this.newApplication.amount && this.newApplication.duration) {
      const rate = 0.05; // Taux d'intérêt annuel de 5%
      const monthlyRate = rate / 12;
      const numberOfPayments = this.newApplication.duration;
      
      const monthlyPayment = this.newApplication.amount * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
      this.newApplication.monthlyPayment = Math.round(monthlyPayment);
      this.checkDebtRatio();
    }
  }
  
  checkDebtRatio(): void {
    if (this.newApplication.clientId) {
      const client = this.clients.find(c => c._id === this.newApplication.clientId);
      if (client) {
        const totalMonthlyPayments = this.newApplication.monthlyPayment + 
          (client.existingLoans / 12); // Simplification
        const debtRatio = (totalMonthlyPayments / client.revenue) * 100;
        this.showDebtWarning = debtRatio > 33;
      }
    }
  }
  
  isApplicationValid(): boolean {
    return this.newApplication.clientId && 
           this.newApplication.amount > 0 && 
           this.newApplication.duration > 0 && 
           !this.showDebtWarning;
  }
  
  submitApplication(): void {
    const client = this.clients.find(c => c._id === this.newApplication.clientId);
    if (client) {
      const newApp: CreditApplication = {
        _id: Date.now().toString(),
        clientId: client._id,
        clientName: client.fullName,
        amount: this.newApplication.amount,
        duration: this.newApplication.duration,
        monthlyPayment: this.newApplication.monthlyPayment,
        purpose: this.newApplication.purpose,
        status: 'EN_ATTENTE',
        documents: [],
        comments: [{
          userId: 'current_user',
          userName: 'Chargé de crédit',
          content: 'Demande créée',
          createdAt: new Date()
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.applications.unshift(newApp);
      this.updateKPIs();
      this.showMessage('Demande de crédit créée avec succès', 'success');
      this.closeNewApplicationModal();
    }
  }
  
  // US2.3 - Consulter les dossiers
  get filteredApplications(): CreditApplication[] {
    let filtered = [...this.applications];
    
    if (this.searchTerm) {
      filtered = filtered.filter(app => 
        app.clientName.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(app => app.status === this.filterStatus);
    }
    
    if (this.filterAmount !== 'ALL') {
      if (this.filterAmount === '0-10000') {
        filtered = filtered.filter(app => app.amount < 10000);
      } else if (this.filterAmount === '10000-50000') {
        filtered = filtered.filter(app => app.amount >= 10000 && app.amount <= 50000);
      } else if (this.filterAmount === '50000+') {
        filtered = filtered.filter(app => app.amount > 50000);
      }
    }
    
    return filtered;
  }
  
  viewApplication(application: CreditApplication): void {
    this.selectedApplication = application;
  }
  
  closeApplicationDetail(): void {
    this.selectedApplication = null;
  }
  
  // US2.4 - Mettre à jour le statut
  updateStatus(application: CreditApplication): void {
    // Cette méthode peut ouvrir un modal ou directement appeler updateApplicationStatus
    console.log('Update status for:', application.clientName);
  }
  
  startAnalysis(application: CreditApplication): void {
    this.updateApplicationStatus(application, 'EN_ANALYSE');
  }
  
  acceptApplication(application: CreditApplication): void {
    const reason = prompt('Ajouter un commentaire (optionnel)');
    this.updateApplicationStatus(application, 'ACCEPTE', reason || undefined);
  }
  
  rejectApplication(application: CreditApplication): void {
    const reason = prompt('Motif du refus :');
    if (reason) {
      this.updateApplicationStatus(application, 'REFUSE', reason);
    }
  }
  
  updateApplicationStatus(application: CreditApplication, newStatus: any, comment?: string): void {
    const index = this.applications.findIndex(a => a._id === application._id);
    if (index !== -1) {
      this.applications[index].status = newStatus;
      this.applications[index].updatedAt = new Date();
      
      if (comment) {
        if (!this.applications[index].comments) {
          this.applications[index].comments = [];
        }
        this.applications[index].comments.push({
          userId: 'current_user',
          userName: 'Chargé de crédit',
          content: `Statut mis à jour : ${this.getStatusLabel(newStatus)}. ${comment}`,
          createdAt: new Date()
        });
      }
      
      this.updateKPIs();
      this.showMessage(`Dossier ${this.getStatusLabel(newStatus)} avec succès`, 'success');
      
      if (this.selectedApplication && this.selectedApplication._id === application._id) {
        this.selectedApplication = this.applications[index];
      }
    }
  }
  
  // US2.5 - Consulter les informations clients
  viewClientDetails(client: Client): void {
    // Ouvrir modal avec détails client
    console.log('View client details:', client);
    this.showMessage(`Consultation des informations de ${client.fullName}`, 'success');
  }
  
  getClientFinancials(clientId: string): any {
    const client = this.clients.find(c => c._id === clientId);
    return client || { revenue: 0, monthlyCharges: 0, existingLoans: 0 };
  }
  
  getRemainingCapacity(clientId: string): number {
    const client = this.clients.find(c => c._id === clientId);
    if (client) {
      const monthlyPayments = client.existingLoans / 12;
      return client.revenue - client.monthlyCharges - monthlyPayments;
    }
    return 0;
  }
  
  getDebtRatio(clientId: string): number {
    const client = this.clients.find(c => c._id === clientId);
    if (client) {
      const monthlyPayments = client.existingLoans / 12;
      const ratio = ((monthlyPayments + client.monthlyCharges) / client.revenue) * 100;
      return Math.round(ratio);
    }
    return 0;
  }
  
  // KPIs Trends
  getKPITrend(type: string): { value: string; positive: boolean } {
    const trends = {
      pending: { value: '+3', positive: true },
      amount: { value: '+15%', positive: true },
      rate: { value: '+2%', positive: true }
    };
    return trends[type as keyof typeof trends] || { value: '0%', positive: true };
  }
  
  // Documents
  uploadDocument(application: CreditApplication): void {
    // Implémenter upload de documents
    console.log('Upload document for:', application.clientName);
    this.showMessage('Fonctionnalité d\'upload de documents à implémenter', 'success');
  }
  
  downloadDocument(doc: any): void {
    // Implémenter téléchargement
    console.log('Download document:', doc.name);
  }
  
  // Utilitaires
  getStatusClass(status: string): string {
    switch(status) {
      case 'EN_ATTENTE': return 'status-badge--pending';
      case 'EN_ANALYSE': return 'status-badge--analyzing';
      case 'ACCEPTE': return 'status-badge--accepted';
      case 'REFUSE': return 'status-badge--rejected';
      default: return '';
    }
  }
  
  getStatusLabel(status: string): string {
    switch(status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_ANALYSE': return 'En analyse';
      case 'ACCEPTE': return 'Accepté';
      case 'REFUSE': return 'Refusé';
      default: return status;
    }
  }
  
  getDocStatusClass(status: string): string {
    return status === 'VALIDE' ? 'doc-status--valid' : 'doc-status--pending';
  }
  
  getDocStatusLabel(status: string): string {
    return status === 'VALIDE' ? 'Validé' : 'En attente';
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'ALL';
    this.filterAmount = 'ALL';
  }
  
  filterByStatus(status: string): void {
    this.filterStatus = status;
    this.setActiveView('applications');
  }
  
  refreshData(): void {
    this.loadData();
  }
  
  setActiveView(viewId: string): void {
    this.sidebarItems.forEach(item => {
      item.active = item.id === viewId;
    });
    this.currentView = viewId;
  }
  
  setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.openNewApplicationModal();
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        this.sidebarCollapsed = !this.sidebarCollapsed;
      }
    });
  }
  
  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
  
  openNewClientModal(): void {
    console.log('Open new client modal');
    this.showMessage('Fonctionnalité d\'ajout de client à implémenter', 'success');
  }
  
  // Méthodes additionnelles pour la compatibilité avec le template
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
  
  confirmLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.logout();
    }
  }
  
  logout(): void {
    // Implémenter la déconnexion
    console.log('Logout');
  }
  
  openProfile(): void {
    console.log('Open profile');
  }
}