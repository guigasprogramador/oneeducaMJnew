export type FinancialTransaction = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'overdue' | 'canceled';
  dueDate: string;
  paidAt?: string;
  profileId?: string;
  providerId?: string;
  relatedContractId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Scholarship = {
  id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  createdAt: string;
  updatedAt: string;
};

export type ProfileScholarship = {
  id: string;
  profileId: string;
  scholarshipId: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
};
