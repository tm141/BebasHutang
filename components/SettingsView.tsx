"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CurrencyChangeModal } from "@/components/CurrencyChangeModal";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { usePathname, useRouter } from "@/i18n/navigation";
import { currencies } from "@/lib/currency/registry";
import { languages } from "@/lib/i18n/languages";
import { signOut } from "@/lib/supabase/queries";
import type { Strategy } from "@/lib/types";

export function SettingsView() {
  const t = useTranslations("settings");
  const strategyT = useTranslations("strategy");
  const common = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const { workspace, setLanguage, setCurrency, setStrategy } = useWorkspace();
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);

  async function changeLanguage(code: string) {
    await setLanguage(code);
    router.replace(pathname, { locale: code });
  }

  return (
    <div className="p-6 lg:p-8 animate-fade-in max-w-2xl">
      <h2 className="text-2xl font-700 text-teal-950">{t("title")}</h2>
      <p className="text-sm text-teal-500 mt-0.5 mb-6">{t("subtitle")}</p>

      <section className="bg-white rounded-2xl border border-teal-100 p-5 shadow-sm mb-4">
        <h3 className="text-sm font-600 text-teal-800">{t("language")}</h3>
        <p className="text-xs text-teal-400 mt-1 mb-3">{t("languageHint")}</p>
        <select
          value={workspace.profile.languageCode}
          onChange={(event) => changeLanguage(event.target.value)}
          className="field"
        >
          {languages.list().map((language) => (
            <option key={language.code} value={language.code}>{language.nativeName}</option>
          ))}
        </select>
      </section>

      <section className="bg-white rounded-2xl border border-teal-100 p-5 shadow-sm mb-4">
        <h3 className="text-sm font-600 text-teal-800">{t("currency")}</h3>
        <p className="text-xs text-teal-400 mt-1 mb-3">{t("currencyHint")}</p>
        <p className="text-sm font-600 text-teal-950 mb-3">{workspace.profile.currencyCode}</p>
        <select
          value={workspace.profile.currencyCode}
          onChange={(event) => {
            if (event.target.value !== workspace.profile.currencyCode) setPendingCurrency(event.target.value);
          }}
          className="field"
        >
          {currencies.list().map((currency) => (
            <option key={currency.code} value={currency.code}>{currency.name} ({currency.code})</option>
          ))}
        </select>
      </section>

      <section className="bg-white rounded-2xl border border-teal-100 p-5 shadow-sm mb-4">
        <h3 className="text-sm font-600 text-teal-800 mb-3">{t("strategy")}</h3>
        <div className="flex gap-2">
          {(["avalanche", "snowball"] as Strategy[]).map((strategy) => (
            <button
              key={strategy}
              onClick={() => setStrategy(strategy)}
              className={`px-4 py-2 rounded-xl text-sm font-600 ${
                workspace.profile.preferredStrategy === strategy ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700"
              }`}
            >
              {strategyT(strategy)}
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={async () => {
          await signOut();
          router.replace("/auth/login");
        }}
        className="text-sm text-teal-500 hover:text-teal-800"
      >
        {common("signOut")}
      </button>

      {pendingCurrency && (
        <CurrencyChangeModal
          currencyCode={pendingCurrency}
          onClose={() => setPendingCurrency(null)}
          onConfirm={async () => {
            await setCurrency(pendingCurrency);
            setPendingCurrency(null);
          }}
        />
      )}
    </div>
  );
}
