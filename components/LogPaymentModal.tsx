"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { limitErrorCode } from "@/lib/limits";
import type { Debt } from "@/lib/types";
import { useFormatMoney } from "@/components/useFormatMoney";
import { XIcon } from "@/components/Icons";

export function LogPaymentModal({
  debt,
  onSave,
  onClose,
}: {
  debt: Debt;
  onSave: (amount: number, paidOn: string) => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("payment");
  const common = useTranslations("common");
  const limits = useTranslations("limits");
  const money = useFormatMoney();
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(Number(amount), paidOn);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const code = limitErrorCode(message);
      setError(code ? limits(code) : message || "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal-950/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-teal-100">
          <div>
            <h2 className="text-xl font-700 text-teal-950">{t("title")}</h2>
            <p className="text-sm text-teal-600 mt-0.5">{t("subtitle")}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-teal-50 text-teal-400">
            <XIcon size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-600 text-teal-950">{debt.name}</p>
          <label className="block">
            <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("amount")} ({money.symbol})</span>
            <input required type="number" min={0.01} max={debt.balance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("date")}</span>
            <input required type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className="field" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-teal-200 text-teal-600 text-sm">{common("cancel")}</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white font-600 text-sm">{t("save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
