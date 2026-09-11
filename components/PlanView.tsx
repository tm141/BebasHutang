"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { leftoverForDebt } from "@/lib/budget";
import { BRAND } from "@/lib/brand";
import { addMonths, computePayoffSchedule } from "@/lib/calculations/payoff";
import { languages } from "@/lib/i18n/languages";
import { SparkleIcon } from "@/components/Icons";
import { useFormatMoney } from "@/components/useFormatMoney";
import { useWorkspace } from "@/components/WorkspaceProvider";

export function PlanView() {
  const t = useTranslations("plan");
  const milestoneT = useTranslations("milestone");
  const locale = useLocale();
  const intlLocale = languages.get(locale).intlLocale;
  const money = useFormatMoney();
  const { workspace } = useWorkspace();
  const leftover = leftoverForDebt(workspace.income, workspace.items, workspace.debts);
  const max = Math.max(money.sliderMax, leftover);
  const [extra, setExtra] = useState(Math.min(leftover, max));

  const base = useMemo(
    () => computePayoffSchedule(workspace.debts, workspace.profile.preferredStrategy, 0),
    [workspace.debts, workspace.profile.preferredStrategy],
  );
  const extraResult = useMemo(
    () => computePayoffSchedule(workspace.debts, workspace.profile.preferredStrategy, extra),
    [workspace.debts, workspace.profile.preferredStrategy, extra],
  );

  if (workspace.debts.length === 0) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center py-20 text-center">
        <SparkleIcon size={36} className="text-teal-400 mb-4" />
        <h2 className="text-2xl font-700 text-teal-950 mb-3">{t("emptyTitle")}</h2>
        <p className="text-teal-500 max-w-sm">{t("emptyBody")}</p>
      </div>
    );
  }

  const monthsSaved =
    base.payoffMonth !== null && extraResult.payoffMonth !== null
      ? base.payoffMonth - extraResult.payoffMonth
      : 0;
  const extraDate = extraResult.payoffMonth === null ? null : addMonths(new Date(), extraResult.payoffMonth);
  const chartLength = Math.min(Math.max(base.snapshots.length, extraResult.snapshots.length), 120);
  const chartData = Array.from({ length: chartLength }, (_, index) => ({
    label: addMonths(new Date(), index).toLocaleDateString(intlLocale, { month: "short", year: "numeric" }),
    base: base.snapshots[index]?.balance ?? 0,
    extra: extraResult.snapshots[index]?.balance ?? 0,
  })).filter((_, index) => index % 3 === 0 || index === 0);

  return (
    <div className="p-6 lg:p-8 animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-700 text-teal-950">{t("title")}</h2>
        <p className="text-sm text-teal-500 mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-600 text-teal-950">{t("extra")}</h3>
            <p className="text-xs text-teal-400 mt-0.5">{t("extraHint")}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-700 text-teal-600">{money.format(extra)}</p>
            <p className="text-xs text-teal-400">{t("perMonth")}</p>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={money.sliderStep}
          value={extra}
          onChange={(event) => setExtra(Number(event.target.value))}
          className="w-full mb-4"
        />
        <div className="grid grid-cols-3 gap-4">
          <Mini label={t("payoffDate")} value={extraDate ? extraDate.toLocaleDateString(intlLocale, { month: "long", year: "numeric" }) : "—"} />
          <Mini label={t("monthsSaved")} value={monthsSaved > 0 ? t("monthsSavedValue", { count: monthsSaved }) : "—"} />
          <Mini label={t("interestSaved")} value={money.format(extraResult.interestSaved)} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6">
        <h3 className="text-base font-600 text-teal-950 mb-2">{t("timeline")}</h3>
        <p className="text-xs text-teal-400 mb-4">
          {extra > 0 && monthsSaved > 0
            ? t("gap", { months: monthsSaved, amount: money.format(extra) })
            : t("gapEmpty")}
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => money.formatCompact(Number(value))} width={72} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(value) => money.format(Number(value))} />
            <Area type="monotone" dataKey="base" name={t("minimumOnly")} stroke="#99f6e4" strokeDasharray="5 3" fill="#f0fdfa" />
            <Area type="monotone" dataKey="extra" name={t("withExtra")} stroke="#0d9488" strokeWidth={2.5} fill="#ccfbf1" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6">
        <h3 className="text-base font-600 text-teal-950 mb-4">{t("milestones")}</h3>
        <div className="space-y-3">
          {extraResult.milestones.map((milestone, index) => {
            const date = addMonths(new Date(), milestone.month).toLocaleDateString(intlLocale, { month: "short", year: "numeric" });
            const label = milestone.type === "debt_free"
              ? BRAND.debtFree
              : milestone.type === "halfway"
                ? milestoneT("halfway")
                : milestoneT("debtPaid", { name: milestone.debtName ?? "" });
            const description = milestone.type === "debt_free"
              ? ""
              : milestone.type === "halfway"
                ? milestoneT("halfwayDescription")
                : milestoneT("debtPaidDescription");
            return (
              <div key={`${milestone.type}-${index}`} className="rounded-xl border border-teal-100 bg-teal-50 p-3 flex justify-between gap-3">
                <div>
                  <p className="text-sm font-600 text-teal-800">{label}</p>
                  {description && <p className="text-xs text-teal-500 mt-0.5">{description}</p>}
                </div>
                <span className="text-xs font-600 text-teal-400">{date}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-6">
        <h3 className="text-base font-600 text-teal-950 mb-4">{t("snapshot")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-teal-100 text-left text-xs font-600 text-teal-400 uppercase">
                <th className="pb-3 pr-4">{t("month")}</th>
                <th className="pb-3 pr-4">{t("date")}</th>
                <th className="pb-3 pr-4">{t("balanceRemaining")}</th>
                <th className="pb-3">{t("cumulativeInterest")}</th>
              </tr>
            </thead>
            <tbody>
              {extraResult.snapshots.slice(0, 13).map((snapshot) => (
                <tr key={snapshot.month} className={`border-b border-teal-50 ${snapshot.balance === 0 ? "bg-emerald-50" : ""}`}>
                  <td className="py-2.5 pr-4 font-mono text-xs text-teal-400">{String(snapshot.month).padStart(2, "0")}</td>
                  <td className="py-2.5 pr-4">{addMonths(new Date(), snapshot.month).toLocaleDateString(intlLocale, { month: "short", year: "numeric" })}</td>
                  <td className="py-2.5 pr-4 font-600">{snapshot.balance === 0 ? BRAND.debtFree : money.format(snapshot.balance)}</td>
                  <td className="py-2.5 text-teal-500">{money.format(snapshot.interestPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 bg-teal-50 rounded-xl">
      <p className="text-xs text-teal-500 mb-1">{label}</p>
      <p className="text-sm font-700 text-teal-950">{value}</p>
    </div>
  );
}
