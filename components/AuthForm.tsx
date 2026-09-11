"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SparkleIcon } from "@/components/Icons";
import { TurnstileWidget, turnstileSiteKey } from "@/components/TurnstileWidget";
import { Link, useRouter } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import { currencies } from "@/lib/currency/registry";
import { languages } from "@/lib/i18n/languages";
import { limitErrorCode } from "@/lib/limits";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { signIn, signUp } from "@/lib/supabase/queries";

export function AuthForm({
  mode,
  suggestedLanguage,
  suggestedCurrency,
}: {
  mode: "login" | "signup";
  suggestedLanguage: string;
  suggestedCurrency: string;
}) {
  const t = useTranslations("auth");
  const demo = useTranslations("demo");
  const limits = useTranslations("limits");
  const setup = useTranslations("setup");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [languageCode, setLanguageCode] = useState(suggestedLanguage);
  const [currencyCode, setCurrencyCode] = useState(suggestedCurrency);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const missingEnv = !getSupabaseEnv();
  const captchaRequired = mode === "signup" && Boolean(turnstileSiteKey());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (mode === "login") {
        await signIn(email, password);
        router.replace("/dashboard");
        return;
      }
      const result = await signUp(email, password, languageCode, currencyCode, captchaToken ?? undefined);
      if (result.session) {
        router.replace("/dashboard", { locale: languageCode });
        return;
      }
      setCheckEmail(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const code = limitErrorCode(message);
      setError(code ? limits(code) : message || "Could not continue.");
    } finally {
      setSaving(false);
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
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl border border-teal-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <SparkleIcon size={16} className="text-white" />
          </div>
          <p className="font-700 text-teal-950">{BRAND.name}</p>
        </div>
        <div>
          <h1 className="text-2xl font-700 text-teal-950">{mode === "login" ? t("loginTitle") : t("signupTitle")}</h1>
          <p className="text-sm text-teal-500 mt-1">{mode === "login" ? t("loginSubtitle") : t("signupSubtitle")}</p>
        </div>
        {checkEmail ? (
          <p className="text-sm text-teal-700">{t("checkEmail")}</p>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-500 text-teal-700">{t("email")}</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1" />
            </label>
            <label className="block">
              <span className="text-sm font-500 text-teal-700">{t("password")}</span>
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="field mt-1" />
            </label>
            {mode === "signup" && (
              <>
                <label className="block">
                  <span className="text-sm font-500 text-teal-700">{t("language")}</span>
                  <select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} className="field mt-1">
                    {languages.list().map((language) => (
                      <option key={language.code} value={language.code}>{language.nativeName}</option>
                    ))}
                  </select>
                  <span className="text-xs text-teal-400">{t("languageHint")}</span>
                </label>
                <label className="block">
                  <span className="text-sm font-500 text-teal-700">{t("currency")}</span>
                  <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} className="field mt-1">
                    {currencies.list().map((currency) => (
                      <option key={currency.code} value={currency.code}>{currency.name} ({currency.code})</option>
                    ))}
                  </select>
                  <span className="text-xs text-teal-400">{t("currencyHint")}</span>
                </label>
              </>
            )}
            {mode === "signup" && <TurnstileWidget onToken={setCaptchaToken} />}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              disabled={saving || (captchaRequired && !captchaToken)}
              className="w-full px-4 py-3 rounded-xl bg-teal-600 text-white font-600 text-sm disabled:opacity-60"
            >
              {mode === "login" ? t("submitLogin") : t("submitSignup")}
            </button>
          </>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push(mode === "login" ? "/auth/signup" : "/auth/login")}
            className="text-sm text-teal-600 text-left"
          >
            {mode === "login" ? t("noAccount") : t("hasAccount")}
          </button>
          <Link href="/demo" className="text-sm text-teal-600">
            {demo("try")}
          </Link>
        </div>
      </form>
    </div>
  );
}
