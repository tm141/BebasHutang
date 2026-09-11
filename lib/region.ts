import { languages } from "@/lib/i18n/languages";

export interface RegionSignal {
  acceptLanguage: string | null;
  /** Reserved for a future GeoIpResolver. Unused by the MVP resolver. */
  countryCode?: string | null;
}

export interface VisitorDefaults {
  languageCode: string;
  suggestedCurrencyCode: string;
}

/**
 * Used only to prefill signup. Changing language later does not reapply this map.
 * `en` suggests USD, `id` suggests IDR, `ms` suggests MYR. Anything else suggests USD.
 */
export const LANGUAGE_CURRENCY_SUGGESTIONS: Record<string, string> = {
  id: "IDR",
  ms: "MYR",
  en: "USD",
};

export interface RegionResolver {
  resolve(signal: RegionSignal): VisitorDefaults;
}

export class AcceptLanguageResolver implements RegionResolver {
  resolve(signal: RegionSignal): VisitorDefaults {
    const languageCode = pickLanguage(signal.acceptLanguage);
    return {
      languageCode,
      suggestedCurrencyCode: suggestCurrency(languageCode),
    };
  }
}

/**
 * Extension point for IP geolocation. Not used in the MVP.
 * Swap the factory below to this class when a geo provider exists.
 */
export class GeoIpResolver implements RegionResolver {
  resolve(_signal: RegionSignal): VisitorDefaults {
    throw new Error("GeoIpResolver is not implemented. Use AcceptLanguageResolver.");
  }
}

export function suggestCurrency(languageCode: string): string {
  return LANGUAGE_CURRENCY_SUGGESTIONS[languageCode] ?? "USD";
}

export function pickLanguage(acceptLanguage: string | null): string {
  if (!acceptLanguage) return "en";
  const tags = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const tag of tags) {
    const base = tag.split("-")[0] ?? "";
    if (languages.has(base)) return base;
  }
  return "en";
}

export function createRegionResolver(): RegionResolver {
  return new AcceptLanguageResolver();
}
