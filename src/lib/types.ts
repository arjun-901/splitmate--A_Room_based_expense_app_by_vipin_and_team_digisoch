export interface AppUser {
  id: string;
  email: string;
  displayName: string;
}

export interface ExpenseShare {
  userId: string;
  share: number;
}

export interface Expense {
  id: string;
  roomCode: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  splitType: "equal" | "custom";
  shares: ExpenseShare[];
  category: string;
  date: string;
  description: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Balance {
  userId: string;
  amount: number;
}

export interface Room {
  code: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: string;
}

export interface RoomSummary {
  code: string;
  name: string;
  membersCount: number;
  createdAt: string;
}

export interface Settlement {
  id: string;
  roomCode: string;
  from: string;
  to: string;
  amount: number;
  note?: string;
  status: "pending" | "settled";
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  id: string;
  expenseId: string;
  roomCode: string;
  requesterId: string;
  approverId: string;
  amount: number;
  status: "pending" | "approved";
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalExpense: number;
  monthlyExpense: number;
  yourBalance: number;
}

export interface DashboardData {
  room: Room;
  expenses: Expense[];
  balances: Balance[];
  memberProfiles: Record<string, AppUser>;
  settlements: Settlement[];
  paymentRequests: PaymentRequest[];
  summary: DashboardSummary;
}
