"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { leftoverForDebt } from "@/lib/budget";
import { useFormatMoney } from "@/components/useFormatMoney";
import { useWorkspace } from "@/components/WorkspaceProvider";

const COLORS = ["#0d9488", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316"];

export function BudgetView() {
  const t = useTranslations("budget");
  const common = useTranslations("common");
  const expenses = useTranslations("expenses");
  const money = useFormatMoney();
  const { workspace, setIncome, setBudgetAmount } = useWorkspace();
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(String(workspace.income));
  const items = workspace.items;
  const leftover = leftoverForDebt(workspace.income, items, workspace.debts);
  const otherTotal = items.filter((item) => !item.isDebt).reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = otherTotal + items.filter((item) => item.isDebt).reduce((sum, item) => sum + item.amount, 0);
  const leftoverPct = workspace.income > 0 ? Math.round((leftover / workspace.income) * 100) : 0;
  const chartData = items.filter((item) => item.amount > 0).map((item) => ({
    name: expenses(item.key as "rent"),
    value: item.amount,
  }));

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-700 text-teal-950">{t("title")}</h2>
        <p className="text-sm text-teal-500 mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <p className="text-sm font-500 text-teal-200 mb-1">{t("income")}</p>
        {editingIncome ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setIncome(Number(incomeInput) || 0);
              setEditingIncome(false);
            }}
            className="flex items-center gap-3"
          >
            <span className="text-2xl font-700">{money.symbol}</span>
            <input autoFocus type="number" min={0} value={incomeInput} onChange={(e) => setIncomeInput(e.target.value)} className="bg-white/20 border border-white/30 rounded-xl px-4 py-2 text-2xl font-700 text-white w-48" />
            <button type="submit" className="px-4 py-2 bg-white text-teal-700 rounded-xl font-600 text-sm">{common("save")}</button>
          </form>
        ) : (
          <button
            onClick={() => {
              setIncomeInput(String(workspace.income));
              setEditingIncome(true);
            }}
            className="text-3xl font-700"
          >
            {money.format(workspace.income)}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-sm font-600 text-teal-700 uppercase tracking-wide">{t("expenses")}</h3>
          {items.map((item, index) => (
            <div key={item.id} className={`rounded-xl border p-4 flex items-center gap-4 ${item.isDebt ? "border-teal-200 bg-teal-50/40" : "border-teal-100 bg-white"}`}>
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-500 text-teal-800">{expenses(item.key as "rent")}</p>
                  {item.isDebt && <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-600 rounded-full">{t("debtPayments")}</span>}
                </div>
              </div>
              {item.isDebt ? (
                <span className="text-sm font-600 text-teal-950">{money.format(item.amount)}</span>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={item.amount}
                  onChange={(event) => setBudgetAmount(item.id, Number(event.target.value) || 0)}
                  className="w-28 text-right text-sm font-600 text-teal-950 bg-teal-50 border border-teal-100 rounded-lg px-2 py-1.5"
                />
              )}
              <span className="sr-only">{COLORS[index % COLORS.length]}</span>
            </div>
          ))}
          <div className="bg-teal-50 rounded-xl border border-teal-200 p-4 flex items-center justify-between">
            <span className="text-sm font-600 text-teal-700">{t("total")}</span>
            <span className="text-base font-700 text-teal-950">{money.format(totalExpenses)}</span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-teal-100 p-5 shadow-sm">
            <h3 className="text-sm font-600 text-teal-700 mb-3">{t("allocation")}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={chartData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={2} stroke="none">
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => money.format(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm ${leftover >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <p className="text-sm font-500 text-teal-700 mb-1">{t("leftover")}</p>
            <p className={`text-3xl font-800 ${leftover >= 0 ? "text-emerald-600" : "text-red-500"}`}>{money.format(Math.abs(leftover))}</p>
            <p className="text-xs mt-1 text-teal-500">
              {leftover >= 0 ? t("leftoverGood", { percent: leftoverPct }) : t("leftoverBad")}
            </p>
            {leftover > 0 && <p className="mt-3 text-xs font-600 text-emerald-700">{t("leftoverNote")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
