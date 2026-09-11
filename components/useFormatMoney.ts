"use client";

import { useLocale } from "next-intl";
import { currencies } from "@/lib/currency/registry";
import { languages } from "@/lib/i18n/languages";
import { useWorkspace } from "@/components/WorkspaceProvider";

export function useFormatMoney() {
  const locale = useLocale();
  const { workspace } = useWorkspace();
  const intlLocale = languages.get(locale).intlLocale;
  const currencyCode = workspace.profile.currencyCode;
  const currency = currencies.get(currencyCode);

  return {
    currencyCode,
    symbol: currency?.symbol ?? currencyCode,
    sliderStep: currency?.sliderStep ?? 1,
    sliderMax: currency?.sliderMax ?? 1000,
    format: (amount: number) => currencies.format(amount, currencyCode, intlLocale),
    formatCompact: (amount: number) => currencies.formatCompact(amount, currencyCode, intlLocale),
  };
}
