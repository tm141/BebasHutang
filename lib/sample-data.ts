import type { DebtInput } from "@/lib/types";

export const SAMPLE_INCOME = 8_000_000;

export const SAMPLE_DEBTS: DebtInput[] = [
  {
    name: "Kartu Kredit BCA",
    category: "credit_card",
    balance: 12_500_000,
    originalBalance: 18_000_000,
    interestRate: 21,
    minimumPayment: 375_000,
    dueDay: 15,
    color: "#ef4444",
  },
  {
    name: "KTA Mandiri",
    category: "personal_loan",
    balance: 35_000_000,
    originalBalance: 45_000_000,
    interestRate: 12,
    minimumPayment: 850_000,
    dueDay: 1,
    color: "#f59e0b",
  },
  {
    name: "Cicilan Motor",
    category: "car_loan",
    balance: 18_000_000,
    originalBalance: 24_000_000,
    interestRate: 8,
    minimumPayment: 650_000,
    dueDay: 5,
    color: "#0d9488",
  },
  {
    name: "Pinjaman Pendidikan",
    category: "education_loan",
    balance: 22_000_000,
    originalBalance: 28_000_000,
    interestRate: 5,
    minimumPayment: 400_000,
    dueDay: 20,
    color: "#8b5cf6",
  },
];

export const SAMPLE_EXPENSES: Record<string, number> = {
  rent: 2_500_000,
  groceries: 1_200_000,
  transport: 600_000,
  phone: 200_000,
  entertainment: 300_000,
  healthcare: 200_000,
  personal_care: 150_000,
};
