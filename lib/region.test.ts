import { describe, expect, it } from "vitest";
import { AcceptLanguageResolver, suggestCurrency } from "./region";

describe("AcceptLanguageResolver", () => {
  const resolver = new AcceptLanguageResolver();

  it("suggests IDR for Indonesian and does not lock later changes", () => {
    expect(resolver.resolve({ acceptLanguage: "id-ID,id;q=0.9,en;q=0.8" })).toEqual({
      languageCode: "id",
      suggestedCurrencyCode: "IDR",
    });
    expect(suggestCurrency("en")).toBe("USD");
    expect(suggestCurrency("ms")).toBe("MYR");
  });

  it("falls back to English and USD", () => {
    expect(resolver.resolve({ acceptLanguage: "fr-FR,fr;q=0.8" })).toEqual({
      languageCode: "en",
      suggestedCurrencyCode: "USD",
    });
  });
});
