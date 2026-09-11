import type { Strategy } from "@/lib/calculations/payoff";

export type { Strategy };

export interface Debt {
  id: string;
  name: string;
  category: string;
  balance: number;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDay: number;
  color: string;
}

export interface DebtInput {
  name: string;
  category: string;
  balance: number;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDay: number;
  color: string;
}

export interface BudgetItem {
  id: string;
  typeId: string;
  key: string;
  icon: string;
  isDebt: boolean;
  amount: number;
}

export interface Profile {
  id: string;
  languageCode: string;
  currencyCode: string;
  preferredStrategy: Strategy;
}

export interface Workspace {
  profile: Profile;
  debts: Debt[];
  income: number;
  expenseId: string;
  month: string;
  items: BudgetItem[];
  isAnonymous: boolean;
}

export const DEBT_CATEGORIES = [
  "credit_card",
  "personal_loan",
  "car_loan",
  "education_loan",
  "mortgage",
  "medical",
  "other",
] as const;

export const DEBT_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#0d9488",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
] as const;
