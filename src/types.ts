export interface Expense {
  id?: string;
  uid: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface BorrowLend {
  id?: string;
  uid: string;
  type: 'borrow' | 'lend';
  personName: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface EMI {
  id?: string;
  uid: string;
  providerName: string;
  totalAmount: number;
  monthlyAmount: number;
  startDate: string;
  dueDate: number;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface SIP {
  id?: string;
  uid: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly';
  startDate: string;
  nextDueDate: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
}
