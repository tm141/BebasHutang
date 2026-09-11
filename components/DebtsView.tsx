"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AddDebtModal } from "@/components/AddDebtModal";
import { EditIcon, PlusIcon, SortIcon, SparkleIcon, TrashIcon } from "@/components/Icons";
import { LogPaymentModal } from "@/components/LogPaymentModal";
import { useFormatMoney } from "@/components/useFormatMoney";
import { useWorkspace } from "@/components/WorkspaceProvider";
import type { Debt } from "@/lib/types";

type SortKey = "balance" | "interest" | "name" | "progress";

export function DebtsView() {
  const t = useTranslations("debts");
  const categories = useTranslations("categories");
  const common = useTranslations("common");
  const money = useFormatMoney();
  const { workspace, saveDebt, removeDebt, logPayment, loadSample } = useWorkspace();
  const [sortKey, setSortKey] = useState<SortKey>("interest");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [paying, setPaying] = useState<Debt | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const debts = workspace.debts;

  const sorted = [...debts].sort((a, b) => {
    if (sortKey === "name") return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    const value = (debt: Debt) => {
      if (sortKey === "balance") return debt.balance;
      if (sortKey === "interest") return debt.interestRate;
      return debt.originalBalance > 0 ? (debt.originalBalance - debt.balance) / debt.originalBalance : 0;
    };
    return sortDir === "asc" ? value(a) - value(b) : value(b) - value(a);
  });

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-700 text-teal-950">{t("title")}</h2>
          {debts.length > 0 && (
            <p className="text-sm text-teal-500 mt-0.5">
              {t("count", { count: debts.length, amount: money.format(debts.reduce((sum, debt) => sum + debt.balance, 0)) })}
            </p>
          )}
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-600">
          <PlusIcon size={16} /> {debts.length === 0 ? t("addFirst") : t("add")}
        </button>
      </div>

      {debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SparkleIcon size={36} className="text-teal-400 mb-4" />
          <h3 className="text-xl font-600 text-teal-800 mb-2">{t("emptyTitle")}</h3>
          <p className="text-teal-500 max-w-sm leading-relaxed">{t("emptyBody")}</p>
          <button onClick={() => loadSample()} className="mt-6 text-sm text-teal-600 underline">{t("sample")}</button>
          <p className="text-xs text-teal-400 mt-2 max-w-sm">{t("sampleHint")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Mini label={t("totalRemaining")} value={money.format(debts.reduce((sum, debt) => sum + debt.balance, 0))} />
            <Mini label={t("totalOriginal")} value={money.format(debts.reduce((sum, debt) => sum + debt.originalBalance, 0))} />
            <Mini label={t("monthlyMinimums")} value={money.format(debts.reduce((sum, debt) => sum + debt.minimumPayment, 0))} />
          </div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <SortIcon size={14} className="text-teal-400" />
            <span className="text-xs font-500 text-teal-400">{t("sortBy")}</span>
            {([
              ["interest", t("interest")],
              ["balance", t("balance")],
              ["progress", t("progress")],
              ["name", t("name")],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
                  else {
                    setSortKey(key);
                    setSortDir("desc");
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-500 ${sortKey === key ? "bg-teal-600 text-white" : "bg-white border border-teal-200 text-teal-500"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {sorted.map((debt) => {
              const paid = debt.originalBalance > 0 ? Math.round(((debt.originalBalance - debt.balance) / debt.originalBalance) * 100) : 0;
              return (
                <div key={debt.id} className="bg-white rounded-2xl border border-teal-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-600 text-teal-950">{debt.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">{categories(debt.category as "other")}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap text-sm">
                        <Stat label={t("balanceLabel")} value={money.format(debt.balance)} />
                        <Stat label={t("interestLabel")} value={`${debt.interestRate}%`} color={debt.color} />
                        <Stat label={t("minPayment")} value={`${money.format(debt.minimumPayment)}${t("perMonth")}`} />
                        <Stat label={t("due")} value={common("dueDay", { day: debt.dueDay })} />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setPaying(debt)} className="px-2 py-1 text-xs rounded-lg text-teal-600 hover:bg-teal-50">{t("logPayment")}</button>
                      <button onClick={() => { setEditing(debt); setModalOpen(true); }} className="p-2 rounded-lg hover:bg-teal-50 text-teal-400"><EditIcon /></button>
                      <button onClick={() => setConfirmDelete(debt.id)} className="p-2 rounded-lg hover:bg-red-50 text-teal-400"><TrashIcon /></button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5 text-teal-400">
                      <span>{t("paidOff", { percent: paid })}</span>
                      <span>{t("ofOriginal", { paid: money.format(debt.originalBalance - debt.balance), original: money.format(debt.originalBalance) })}</span>
                    </div>
                    <div className="h-2 bg-teal-50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full progress-bar" style={{ width: `${paid}%`, backgroundColor: debt.color }} />
                    </div>
                  </div>
                  {confirmDelete === debt.id && (
                    <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between">
                      <p className="text-sm text-red-500">{t("confirmDelete")}</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-xs rounded-lg border border-teal-200">{common("cancel")}</button>
                        <button onClick={() => { removeDebt(debt.id); setConfirmDelete(null); }} className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white">{common("remove")}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {modalOpen && (
        <AddDebtModal
          debt={editing}
          onClose={() => setModalOpen(false)}
          onSave={async (input) => {
            await saveDebt(input, editing?.id);
            setModalOpen(false);
          }}
        />
      )}
      {paying && (
        <LogPaymentModal
          debt={paying}
          onClose={() => setPaying(null)}
          onSave={async (amount, paidOn) => {
            await logPayment(paying, amount, paidOn);
            setPaying(null);
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-teal-400">{label}</p>
      <p className="font-700 text-teal-950" style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-teal-100 p-3.5 shadow-sm">
      <p className="text-xs text-teal-400">{label}</p>
      <p className="text-base font-700 text-teal-950 mt-0.5">{value}</p>
    </div>
  );
}
