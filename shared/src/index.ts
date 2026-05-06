export const ACCOUNTS = ["hand", "sbi", "canara"] as const;

export type AccountName = (typeof ACCOUNTS)[number];
export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  reason: string;
  category: string;
  account: AccountName;
  date: string;
  time: string;
  createdAt: number;
}

export interface Account {
  name: AccountName;
  balance: number;
  limit: number;
}

export interface DailySummary {
  id: string;
  total_income: number;
  total_expense: number;
  savings: number;
  transactions: string[];
}

export const DEFAULT_ACCOUNT_LIMITS: Record<AccountName, number> = {
  hand: 30000,
  sbi: 100000,
  canara: 100000
};
