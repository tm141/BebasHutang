"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { limitErrorCode } from "@/lib/limits";
import { DEBT_CATEGORIES, DEBT_COLORS, type Debt, type DebtInput } from "@/lib/types";
import { useFormatMoney } from "@/components/useFormatMoney";
import { XIcon } from "@/components/Icons";

export function AddDebtModal({
  debt,
  onSave,
  onClose,
}: {
  debt?: Debt | null;
  onSave: (input: DebtInput) => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("debtForm");
  const categories = useTranslations("categories");
  const common = useTranslations("common");
  const limits = useTranslations("limits");
  const money = useFormatMoney();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "credit_card",
    balance: "",
    originalBalance: "",
    interestRate: "",
    minimumPayment: "",
    dueDay: "1",
    color: DEBT_COLORS[0] as string,
  });

  useEffect(() => {
    if (!debt) return;
    setForm({
      name: debt.name,
      category: debt.category,
      balance: String(debt.balance),
      originalBalance: String(debt.originalBalance),
      interestRate: String(debt.interestRate),
      minimumPayment: String(debt.minimumPayment),
      dueDay: String(debt.dueDay),
      color: debt.color,
    });
  }, [debt]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const balance = Number(form.balance) || 0;
    const originalBalance = Number(form.originalBalance) || balance;
    try {
      await onSave({
        name: form.name.trim(),
        category: form.category,
        balance,
        originalBalance: Math.max(originalBalance, balance),
        interestRate: Number(form.interestRate) || 0,
        minimumPayment: Number(form.minimumPayment) || 0,
        dueDay: Math.min(31, Math.max(1, Number(form.dueDay) || 1)),
        color: form.color,
      });
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-teal-100">
          <div>
            <h2 className="text-xl font-700 text-teal-950">{debt ? t("editTitle") : t("addTitle")}</h2>
            <p className="text-sm text-teal-600 mt-0.5">{debt ? t("editSubtitle") : t("addSubtitle")}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-teal-50 text-teal-400">
            <XIcon size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block">
            <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("name")}</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("namePlaceholder")} className="field" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("category")}</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="field">
                {DEBT_CATEGORIES.map((key) => (
                  <option key={key} value={key}>{categories(key)}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("dueDay")}</span>
              <input type="number" min={1} max={31} value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} className="field" />
            </label>
            <label>
              <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("balance")} ({money.symbol})</span>
              <input required type="number" min={0} step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} className="field" />
            </label>
            <label>
              <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("original")} ({money.symbol})</span>
              <input type="number" min={0} step="0.01" value={form.originalBalance} onChange={(e) => setForm({ ...form, originalBalance: e.target.value })} className="field" />
            </label>
            <label>
              <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("rate")}</span>
              <input required type="number" min={0} step="0.01" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} className="field" />
            </label>
            <label>
              <span className="block text-sm font-500 text-teal-700 mb-1.5">{t("minimum")} ({money.symbol})</span>
              <input required type="number" min={0} step="0.01" value={form.minimumPayment} onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })} className="field" />
            </label>
          </div>
          <div>
            <p className="text-sm font-500 text-teal-700 mb-2">{t("color")}</p>
            <div className="flex gap-2">
              {DEBT_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setForm({ ...form, color })} className="w-7 h-7 rounded-full" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-teal-200 text-teal-600 text-sm">{common("cancel")}</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-600 text-sm">
              {debt ? t("saveChanges") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
