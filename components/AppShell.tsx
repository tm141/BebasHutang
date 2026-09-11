"use client";

import { useTranslations } from "next-intl";
import { BRAND } from "@/lib/brand";
import { languages } from "@/lib/i18n/languages";
import { usePathname, useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/supabase/queries";
import { DemoBanner } from "@/components/DemoBanner";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  CreditCardIcon,
  HomeIcon,
  SettingsIcon,
  SparkleIcon,
  TrendingDownIcon,
  WalletIcon,
} from "@/components/Icons";

const NAV = [
  { href: "/dashboard", key: "dashboard", Icon: HomeIcon },
  { href: "/debts", key: "debts", Icon: CreditCardIcon },
  { href: "/budget", key: "budget", Icon: WalletIcon },
  { href: "/plan", key: "plan", Icon: TrendingDownIcon },
  { href: "/settings", key: "settings", Icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const common = useTranslations("common");
  const { workspace, setLanguage, refresh } = useWorkspace();

  async function changeLanguage(code: string) {
    await setLanguage(code);
    router.replace(pathname, { locale: code });
  }

  async function logout() {
    await signOut();
    router.replace("/auth/login");
  }

  return (
    <div className="flex h-full flex-col bg-teal-50/60 overflow-hidden">
      {workspace.isAnonymous && <DemoBanner onClaimed={refresh} />}
      <div className="flex flex-1 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white border-r border-teal-100 shadow-sm">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-teal-100">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <SparkleIcon size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-700 text-teal-950">{BRAND.name}</p>
            <p className="text-xs text-teal-400 font-400">{BRAND.tagline}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, key, Icon }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-500 transition-all text-left ${
                  active ? "bg-teal-600 text-white shadow-sm" : "text-teal-600 hover:bg-teal-50 hover:text-teal-800"
                }`}
              >
                <Icon size={18} />
                {t(key)}
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-4 space-y-3">
          <button
            onClick={() => router.push("/debts")}
            className="w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-600 px-3 py-2.5 rounded-xl text-sm font-600 transition-colors border border-teal-200"
          >
            + {t("addDebt")}
          </button>
          <label className="block px-1">
            <span className="sr-only">{t("settings")}</span>
            <select
              value={workspace.profile.languageCode}
              onChange={(event) => changeLanguage(event.target.value)}
              className="w-full rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800"
            >
              {languages.list().map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeName}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-teal-400 leading-relaxed text-center">{t("tagline")}</p>
          <button onClick={logout} className="w-full text-xs text-teal-500 hover:text-teal-800">
            {common("signOut")}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>

      </div>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-teal-100 flex z-40 shadow-lg">
        {NAV.map(({ href, key, Icon }) => {
          const active = pathname === href;
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`relative flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-500 transition-colors ${
                active ? "text-teal-600" : "text-teal-400"
              }`}
            >
              <Icon size={18} />
              {t(key)}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
