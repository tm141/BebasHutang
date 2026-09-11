"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SparkleIcon } from "@/components/Icons";
import { TurnstileWidget, turnstileSiteKey } from "@/components/TurnstileWidget";
import { Link, useRouter } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import { currencies } from "@/lib/currency/registry";
import { languages } from "@/lib/i18n/languages";
import { limitErrorCode } from "@/lib/limits";
import { suggestCurrency } from "@/lib/region";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { startDemo } from "@/lib/supabase/queries";

export default function DemoPage() {
  const t = useTranslations("demo");
  const auth = useTranslations("auth");
  const limits = useTranslations("limits");
  const setup = useTranslations("setup");
  const locale = useLocale();
  const router = useRouter();
  const [languageCode, setLanguageCode] = useState(locale);
  const [currencyCode, setCurrencyCode] = useState(suggestCurrency(locale));
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [alreadyIn, setAlreadyIn] = useState(false);
  const missingEnv = !getSupabaseEnv();
  const captchaRequired = Boolean(turnstileSiteKey()) && !alreadyIn;

  useEffect(() => {
    if (missingEnv) return;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setAlreadyIn(true);
      })
      .catch(() => {});
  }, [missingEnv]);

  async function enter() {
    setWorking(true);
    setError(null);
    try {
      if (alreadyIn) {
        await startDemo(locale, suggestCurrency(locale), captchaToken ?? undefined);
        router.replace("/dashboard");
        return;
      }
      await startDemo(languageCode, currencyCode, captchaToken ?? undefined);
      router.replace("/dashboard", { locale: languageCode });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const code = limitErrorCode(message);
      setError(code ? limits(code) : message || t("failed"));
      setWorking(false);
    }
  }

  if (missingEnv) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl border border-teal-100 p-6">
        <h1 className="text-xl font-700 text-teal-950">{setup("title")}</h1>
        <p className="text-sm text-teal-600 mt-2">{setup("body")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-teal-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <SparkleIcon size={16} className="text-white" />
          </div>
          <p className="font-700 text-teal-950">{BRAND.name}</p>
        </div>
        <div>
          <h1 className="text-2xl font-700 text-teal-950">{t("title")}</h1>
          <p className="text-sm text-teal-500 mt-1">{t("body")}</p>
        </div>
        {!alreadyIn && (
          <>
            <label className="block">
              <span className="text-sm font-500 text-teal-700">{auth("language")}</span>
              <select
                value={languageCode}
                onChange={(e) => {
                  const next = e.target.value;
                  setLanguageCode(next);
                  if (!currencyTouched) setCurrencyCode(suggestCurrency(next));
                }}
                className="field mt-1"
              >
                {languages.list().map((language) => (
                  <option key={language.code} value={language.code}>{language.nativeName}</option>
                ))}
              </select>
              <span className="text-xs text-teal-400">{auth("languageHint")}</span>
            </label>
            <label className="block">
              <span className="text-sm font-500 text-teal-700">{auth("currency")}</span>
              <select
                value={currencyCode}
                onChange={(e) => {
                  setCurrencyTouched(true);
                  setCurrencyCode(e.target.value);
                }}
                className="field mt-1"
              >
                {currencies.list().map((currency) => (
                  <option key={currency.code} value={currency.code}>{currency.name} ({currency.code})</option>
                ))}
              </select>
              <span className="text-xs text-teal-400">{auth("currencyHint")}</span>
            </label>
            <TurnstileWidget onToken={setCaptchaToken} />
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={working || (captchaRequired && !captchaToken)}
          onClick={enter}
          className="w-full px-4 py-3 rounded-xl bg-teal-600 text-white font-600 text-sm disabled:opacity-60"
        >
          {working ? t("working") : t("try")}
        </button>
        <Link href="/auth/login" className="block text-sm text-teal-600">
          {t("login")}
        </Link>
      </div>
    </div>
  );
}
