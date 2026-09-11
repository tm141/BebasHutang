"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { limitErrorCode } from "@/lib/limits";
import { claimDemoAccount } from "@/lib/supabase/queries";

export function DemoBanner({ onClaimed }: { onClaimed: () => Promise<void> }) {
  const t = useTranslations("demo");
  const limits = useTranslations("limits");
  const auth = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function keep(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await claimDemoAccount(email, password);
      const stillAnonymous = result.user?.is_anonymous;
      await onClaimed();
      if (stillAnonymous) {
        setNotice(t("kept"));
        setSaving(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const code = limitErrorCode(message);
      setError(code ? limits(code) : message || t("failed"));
      setSaving(false);
    }
  }

  return (
    <div className="bg-teal-800 text-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">{t("banner")}</p>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="self-start shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-600 text-teal-800"
          >
            {t("keep")}
          </button>
        ) : (
          <form onSubmit={keep} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block">
              <span className="text-xs text-teal-100">{auth("email")}</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-teal-500 bg-white px-2 py-1.5 text-sm text-teal-950"
              />
            </label>
            <label className="block">
              <span className="text-xs text-teal-100">{auth("password")}</span>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-teal-500 bg-white px-2 py-1.5 text-sm text-teal-950"
              />
            </label>
            <button
              disabled={saving}
              className="rounded-lg bg-white px-3 py-2 text-sm font-600 text-teal-800 disabled:opacity-60"
            >
              {saving ? t("working") : auth("submitSignup")}
            </button>
          </form>
        )}
      </div>
      {open && <p className="max-w-5xl mx-auto mt-2 text-xs text-teal-100">{t("keepHint")}</p>}
      {error && <p className="max-w-5xl mx-auto mt-2 text-sm text-red-200">{error}</p>}
      {notice && <p className="max-w-5xl mx-auto mt-2 text-sm text-teal-100">{notice}</p>}
    </div>
  );
}
