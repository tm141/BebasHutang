import { currencies } from "@/lib/currency/registry";
import type { DebtInput } from "@/lib/types";

/** IDR-shaped base. Other currencies scale from these figures at insert time. */
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

/** Typical monthly take-home, not an exchange rate. Unknown codes use USD. */
const SAMPLE_INCOME_BY_CURRENCY: Record<string, number> = {
  IDR: 8_000_000,
  MYR: 6_500,
  USD: 4_500,
  AUD: 5_500,
  EUR: 3_200,
  GBP: 2_800,
  SGD: 5_000,
  JPY: 350_000,
};

const GENERIC_DEBT_NAMES = ["Visa card", "Personal loan", "Car loan", "Student loan"];

const DEBT_NAMES_BY_CURRENCY: Record<string, string[]> = {
  IDR: ["Kartu Kredit BCA", "KTA Mandiri", "Cicilan Motor", "Pinjaman Pendidikan"],
  MYR: ["CIMB Credit Card", "Maybank Personal Loan", "Proton X50 Car Loan", "PTPTN Study Loan"],
};

export interface SampleData {
  income: number;
  debts: DebtInput[];
  expenses: Record<string, number>;
}

function roundMoney(amount: number, step: number, fractionDigits: number): number {
  const snapped = Math.round(amount / step) * step;
  const factor = 10 ** fractionDigits;
  const rounded = Math.round(snapped * factor) / factor;
  if (amount > 0 && rounded <= 0) return step;
  return rounded;
}

function resolveCurrency(currencyCode: string): string {
  const code = currencyCode.toUpperCase();
  return SAMPLE_INCOME_BY_CURRENCY[code] == null ? "USD" : code;
}

/**
 * Sample pack sized for the workspace currency.
 * `languageCode` is accepted so callers pass the profile language; debt names follow currency, not UI language.
 */
export function getSampleData(currencyCode: string, languageCode = "en"): SampleData {
  void languageCode;
  const code = resolveCurrency(currencyCode);
  const income = SAMPLE_INCOME_BY_CURRENCY[code] ?? SAMPLE_INCOME_BY_CURRENCY.USD;
  const names = DEBT_NAMES_BY_CURRENCY[code] ?? GENERIC_DEBT_NAMES;

  if (income === SAMPLE_INCOME) {
    return {
      income,
      debts: SAMPLE_DEBTS.map((debt, index) => ({ ...debt, name: names[index] ?? debt.name })),
      expenses: { ...SAMPLE_EXPENSES },
    };
  }

  const definition = currencies.get(code) ?? currencies.get("USD");
  const step = definition?.sliderStep ?? 25;
  const fractionDigits = definition?.fractionDigits ?? 2;
  const scale = income / SAMPLE_INCOME;

  return {
    income,
    debts: SAMPLE_DEBTS.map((debt, index) => {
      const balance = roundMoney(debt.balance * scale, step, fractionDigits);
      const originalBalance = Math.max(balance, roundMoney(debt.originalBalance * scale, step, fractionDigits));
      return {
        ...debt,
        name: names[index] ?? debt.name,
        balance,
        originalBalance,
        minimumPayment: roundMoney(debt.minimumPayment * scale, step, fractionDigits),
      };
    }),
    expenses: Object.fromEntries(
      Object.entries(SAMPLE_EXPENSES).map(([key, amount]) => [
        key,
        roundMoney(amount * scale, step, fractionDigits),
      ]),
    ),
  };
}
