"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { leftoverForDebt, minimumPayments } from "@/lib/budget";
import { BRAND } from "@/lib/brand";
import { addMonths, computePayoffSchedule } from "@/lib/calculations/payoff";
import { languages } from "@/lib/i18n/languages";
import type { Strategy } from "@/lib/types";
import { InfoIcon, SparkleIcon } from "@/components/Icons";
import { useFormatMoney } from "@/components/useFormatMoney";
import { useWorkspace } from "@/components/WorkspaceProvider";

export function DashboardView() {
  const t = useTranslations("dashboard");
  const strategyT = useTranslations("strategy");
  const locale = useLocale();
  const intlLocale = languages.get(locale).intlLocale;
  const money = useFormatMoney();
  const { workspace, setStrategy } = useWorkspace();
  const { debts, profile } = workspace;
  const leftover = leftoverForDebt(workspace.income, workspace.items, debts);

  const result = useMemo(
    () => computePayoffSchedule(debts, profile.preferredStrategy, leftover),
    [debts, profile.preferredStrategy, leftover],
  );

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
        <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-6">
          <SparkleIcon size={36} className="text-teal-500" />
        </div>
        <h2 className="text-2xl font-700 text-teal-950 mb-3">{t("emptyTitle")}</h2>
        <p className="text-teal-600 max-w-sm leading-relaxed mb-8">{t("emptyBody")}</p>
        <div className="bg-teal-50 px-4 py-2 rounded-full text-sm text-teal-600 font-500">{t("emptyCta")}</div>
      </div>
    );
  }

  const totalRemaining = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalOriginal = debts.reduce((sum, debt) => sum + debt.originalBalance, 0);
  const totalPaid = Math.max(0, totalOriginal - totalRemaining);
  const payoffDate = result.payoffMonth === null ? null : addMonths(new Date(), result.payoffMonth);
  const chartData = result.snapshots
    .filter((_, index) => index % 3 === 0 || result.snapshots[index]?.balance === 0)
    .slice(0, 40)
    .map((snapshot) => ({
      label: addMonths(new Date(), snapshot.month).toLocaleDateString(intlLocale, { month: "short", year: "numeric" }),
      balance: snapshot.balance,
    }));

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white p-7 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SparkleIcon size={16} className="text-teal-300" />
              <span className="text-sm font-500 text-teal-300 uppercase tracking-wider">{t("goal")}</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-800 mb-1">
              {payoffDate ? (
                <>
                  {t("debtFreeBy")}
                  <br />
                  <span className="text-amber-300">
                    {payoffDate.toLocaleDateString(intlLocale, { month: "long", year: "numeric" })}
                  </span>
                </>
              ) : (
                t("keepGoing")
              )}
            </h1>
            <p className="text-teal-200 text-sm mt-3 max-w-xs">
              {result.payoffMonth ? t("monthsFromNow", { count: result.payoffMonth }) : t("addMore")}
            </p>
            {result.payoffMonth === 0 && <p className="text-amber-200 font-700 mt-2">{BRAND.debtFree}</p>}
          </div>
          <Donut paid={totalPaid} remaining={totalRemaining} label={t("cleared")} />
        </div>
        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
          <span className="text-xs text-teal-300 font-500">{strategyT("label")}:</span>
          <div className="flex bg-white/10 rounded-xl p-1 gap-1">
            {(["avalanche", "snowball"] as Strategy[]).map((strategy) => (
              <button
                key={strategy}
                onClick={() => setStrategy(strategy)}
                className={`px-4 py-1.5 rounded-lg text-xs font-600 transition-all ${
                  profile.preferredStrategy === strategy ? "bg-white text-teal-700" : "text-teal-200"
                }`}
              >
                {strategyT(strategy)}
              </button>
            ))}
          </div>
          <span className="flex items-center gap-1 text-teal-300 text-xs">
            <InfoIcon size={12} />
            {profile.preferredStrategy === "avalanche" ? strategyT("avalancheHint") : strategyT("snowballHint")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label={t("totalRemaining")} value={money.format(totalRemaining)} sub={t("ofOriginal", { amount: money.format(totalOriginal) })} />
        <Stat label={t("monthlyPayment")} value={money.format(minimumPayments(debts))} sub={t("minimums")} />
        <Stat label={t("interestSaved")} value={money.format(result.interestSaved)} sub={t("vsMinimum")} accent />
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6">
        <h3 className="text-base font-600 text-teal-950">{t("projected")}</h3>
        <p className="text-xs text-teal-400 mt-0.5 mb-6">{t("projectedHint")}</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => money.formatCompact(Number(value))} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={72} />
            <Tooltip formatter={(value) => money.format(Number(value))} />
            <Area type="monotone" dataKey="balance" stroke="#0d9488" strokeWidth={2.5} fill="#ccfbf1" name={t("balance")} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6">
        <h3 className="text-base font-600 text-teal-950 mb-4">{t("breakdown")}</h3>
        <div className="space-y-3">
          {debts.map((debt) => {
            const percent = debt.originalBalance > 0 ? Math.round(((debt.originalBalance - debt.balance) / debt.originalBalance) * 100) : 0;
            return (
              <div key={debt.id}>
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="font-500 text-teal-800">{debt.name}</span>
                  <span className="font-600 text-teal-950">{money.format(debt.balance)}</span>
                </div>
                <div className="h-1.5 bg-teal-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full progress-bar" style={{ width: `${percent}%`, backgroundColor: debt.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent = false }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${accent ? "bg-emerald-50 border-emerald-100" : "bg-white border-teal-100"}`}>
      <p className="text-xs font-500 text-teal-500 mb-1">{label}</p>
      <p className={`text-2xl font-700 ${accent ? "text-emerald-600" : "text-teal-950"}`}>{value}</p>
      <p className="text-xs text-teal-400 mt-1">{sub}</p>
    </div>
  );
}

function Donut({ paid, remaining, label }: { paid: number; remaining: number; label: string }) {
  const total = paid + remaining;
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div className="relative flex items-center justify-center">
      <PieChart width={160} height={160}>
        <Pie data={[{ value: paid }, { value: remaining }]} dataKey="value" cx={80} cy={80} innerRadius={52} outerRadius={72} startAngle={90} endAngle={-270} stroke="none">
          <Cell fill="#10b981" />
          <Cell fill="#ccfbf1" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-700">{percent}%</span>
        <span className="text-xs font-500 text-teal-200">{label}</span>
      </div>
    </div>
  );
}
