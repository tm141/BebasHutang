"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { displayItems } from "@/lib/budget";
import { limitErrorCode } from "@/lib/limits";
import {
  deleteDebt,
  getWorkspace,
  insertSampleData,
  logPayment,
  saveDebt,
  updateBudgetAmount,
  updateCurrency,
  updateIncome,
  updateLanguage,
  updateStrategy,
} from "@/lib/supabase/queries";
import type { Debt, DebtInput, Strategy, Workspace } from "@/lib/types";

interface WorkspaceContextValue {
  workspace: Workspace;
  refresh: () => Promise<void>;
  setStrategy: (strategy: Strategy) => Promise<void>;
  saveDebt: (input: DebtInput, id?: string) => Promise<void>;
  removeDebt: (id: string) => Promise<void>;
  logPayment: (debt: Debt, amount: number, paidOn: string) => Promise<void>;
  setIncome: (income: number) => Promise<void>;
  setBudgetAmount: (spendingId: string, amount: number) => Promise<void>;
  setLanguage: (languageCode: string) => Promise<void>;
  setCurrency: (currencyCode: string) => Promise<void>;
  loadSample: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const limits = useTranslations("limits");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await getWorkspace();
    setWorkspace({
      ...next,
      items: displayItems(next.items, next.debts),
    });
  }, []);

  useEffect(() => {
    refresh().catch((err: Error) => {
      const code = limitErrorCode(err.message);
      setError(code ? limits(code) : err.message);
    });
  }, [limits, refresh]);

  const value = useMemo<WorkspaceContextValue | null>(() => {
    if (!workspace) return null;
    return {
      workspace,
      refresh,
      async setStrategy(strategy) {
        setWorkspace({ ...workspace, profile: { ...workspace.profile, preferredStrategy: strategy } });
        await updateStrategy(strategy);
      },
      async saveDebt(input, id) {
        await saveDebt(input, id);
        await refresh();
      },
      async removeDebt(id) {
        await deleteDebt(id);
        await refresh();
      },
      async logPayment(debt, amount, paidOn) {
        await logPayment(debt.id, amount, paidOn);
        await refresh();
      },
      async setIncome(income) {
        setWorkspace({ ...workspace, income });
        await updateIncome(workspace.expenseId, income);
      },
      async setBudgetAmount(spendingId, amount) {
        setWorkspace({
          ...workspace,
          items: workspace.items.map((item) => (item.id === spendingId ? { ...item, amount } : item)),
        });
        await updateBudgetAmount(spendingId, amount);
      },
      async setLanguage(languageCode) {
        await updateLanguage(languageCode);
      },
      async setCurrency(currencyCode) {
        setWorkspace({ ...workspace, profile: { ...workspace.profile, currencyCode } });
        await updateCurrency(currencyCode);
      },
      async loadSample() {
        await insertSampleData();
        await refresh();
      },
    };
  }, [refresh, workspace]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="max-w-md text-sm text-teal-700">{error}</p>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-teal-500">…</div>
    );
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
