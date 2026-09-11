"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { currencies } from "@/lib/currency/registry";
import { XIcon } from "@/components/Icons";

export function CurrencyChangeModal({
  currencyCode,
  onConfirm,
  onClose,
}: {
  currencyCode: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const t = useTranslations("currencyChange");
  const common = useTranslations("common");
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const currency = currencies.get(currencyCode);

  async function confirm() {
    setSaving(true);
    await onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-teal-950/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-xl font-700 text-teal-950">{t("title")}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-teal-50 text-teal-400">
            <XIcon size={18} />
          </button>
        </div>
        <p className="text-sm text-teal-700 leading-relaxed">
          {t("body", { currency: currency ? `${currency.name} (${currency.code})` : currencyCode })}
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm text-teal-800">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1" />
          <span>{t("confirm")}</span>
        </label>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-teal-200 text-teal-600 text-sm">{common("cancel")}</button>
          <button type="button" disabled={!checked || saving} onClick={confirm} className="flex-1 px-4 py-3 rounded-xl bg-amber-600 disabled:opacity-40 text-white font-600 text-sm">
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
