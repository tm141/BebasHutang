export type Strategy = "avalanche" | "snowball";
export type MilestoneType = "debt_paid" | "halfway" | "debt_free";

export interface SimulationDebt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

export interface MonthlySnapshot {
  month: number;
  balance: number;
  interestPaid: number;
}

export interface Milestone {
  month: number;
  type: MilestoneType;
  debtId?: string;
  debtName?: string;
}

export interface PayoffResult {
  snapshots: MonthlySnapshot[];
  milestones: Milestone[];
  payoffOrder: string[];
  totalInterest: number;
  interestSaved: number;
  payoffMonth: number | null;
}

const MAX_MONTHS = 360;
const EPSILON = 0.01;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

interface WorkingDebt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

function prioritize(debts: WorkingDebt[], strategy: Strategy): WorkingDebt[] {
  return [...debts].sort((a, b) => {
    if (strategy === "avalanche") {
      if (b.interestRate !== a.interestRate) return b.interestRate - a.interestRate;
      return a.balance - b.balance;
    }
    if (a.balance !== b.balance) return a.balance - b.balance;
    return b.interestRate - a.interestRate;
  });
}

function simulate(
  debts: SimulationDebt[],
  strategy: Strategy,
  extraMonthly: number,
): Omit<PayoffResult, "interestSaved"> {
  const working: WorkingDebt[] = debts
    .filter((debt) => debt.balance > EPSILON)
    .map((debt) => ({
      id: debt.id,
      name: debt.name,
      balance: roundMoney(debt.balance),
      interestRate: debt.interestRate,
      minimumPayment: Math.max(0, debt.minimumPayment),
    }));

  const startingBalance = roundMoney(working.reduce((sum, debt) => sum + debt.balance, 0));
  const halfwayBalance = startingBalance / 2;
  const snapshots: MonthlySnapshot[] = [
    { month: 0, balance: startingBalance, interestPaid: 0 },
  ];
  const milestones: Milestone[] = [];
  const payoffOrder: string[] = [];
  let halfwayMarked = startingBalance <= EPSILON;
  let totalInterest = 0;
  let snowball = 0;
  const extra = Math.max(0, extraMonthly);

  if (startingBalance <= EPSILON) {
    milestones.push({ month: 0, type: "debt_free" });
    return {
      snapshots,
      milestones,
      payoffOrder,
      totalInterest: 0,
      payoffMonth: 0,
    };
  }

  for (let month = 0; month < MAX_MONTHS; month++) {
    const active = working.filter((debt) => debt.balance > EPSILON);
    if (active.length === 0) break;

    for (const debt of active) {
      const interest = debt.balance * (debt.interestRate / 12 / 100);
      totalInterest += interest;
      debt.balance = roundMoney(debt.balance + interest);
    }

    const paidThisMonth: WorkingDebt[] = [];

    for (const debt of working.filter((item) => item.balance > EPSILON)) {
      const payment = Math.min(debt.minimumPayment, debt.balance);
      debt.balance = roundMoney(debt.balance - payment);
      if (debt.balance <= EPSILON) {
        debt.balance = 0;
        paidThisMonth.push(debt);
      }
    }

    let extraPool = extra + snowball;
    for (const target of prioritize(
      working.filter((debt) => debt.balance > EPSILON),
      strategy,
    )) {
      if (extraPool <= EPSILON) break;
      const payment = Math.min(extraPool, target.balance);
      target.balance = roundMoney(target.balance - payment);
      extraPool = roundMoney(extraPool - payment);
      if (target.balance <= EPSILON) {
        target.balance = 0;
        paidThisMonth.push(target);
      }
    }

    for (const debt of paidThisMonth) {
      snowball = roundMoney(snowball + debt.minimumPayment);
      if (!payoffOrder.includes(debt.id)) {
        payoffOrder.push(debt.id);
        milestones.push({
          month: month + 1,
          type: "debt_paid",
          debtId: debt.id,
          debtName: debt.name,
        });
      }
    }

    const remaining = roundMoney(working.reduce((sum, debt) => sum + Math.max(0, debt.balance), 0));
    const interestPaid = roundMoney(totalInterest);
    snapshots.push({ month: month + 1, balance: remaining, interestPaid });

    if (!halfwayMarked && remaining <= halfwayBalance) {
      halfwayMarked = true;
      milestones.push({ month: month + 1, type: "halfway" });
    }

    if (remaining <= EPSILON) {
      milestones.push({ month: month + 1, type: "debt_free" });
      break;
    }
  }

  const free = snapshots.find((snapshot) => snapshot.balance <= EPSILON);
  milestones.sort((a, b) => a.month - b.month || a.type.localeCompare(b.type));

  return {
    snapshots,
    milestones,
    payoffOrder,
    totalInterest: roundMoney(totalInterest),
    payoffMonth: free ? free.month : null,
  };
}

export function computePayoffSchedule(
  debts: SimulationDebt[],
  strategy: Strategy,
  extraMonthly: number,
): PayoffResult {
  const withExtra = simulate(debts, strategy, extraMonthly);
  const baseline = extraMonthly > 0 ? simulate(debts, strategy, 0) : withExtra;
  return {
    ...withExtra,
    interestSaved: Math.max(0, roundMoney(baseline.totalInterest - withExtra.totalInterest)),
  };
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}
