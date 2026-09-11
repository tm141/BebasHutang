import type { BudgetItem, Debt } from "@/lib/types";

export function minimumPayments(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
}

export function leftoverForDebt(income: number, items: BudgetItem[], debts: Debt[]): number {
  const other = items
    .filter((item) => !item.isDebt)
    .reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, income - other - minimumPayments(debts));
}

export function displayItems(items: BudgetItem[], debts: Debt[]): BudgetItem[] {
  const minimums = minimumPayments(debts);
  return items.map((item) => (item.isDebt ? { ...item, amount: minimums } : item));
}
