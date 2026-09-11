export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
  fractionDigits: number;
  sliderStep: number;
  sliderMax: number;
}

const STARTER: CurrencyDefinition[] = [
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", fractionDigits: 0, sliderStep: 50_000, sliderMax: 10_000_000 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", fractionDigits: 2, sliderStep: 50, sliderMax: 3_000 },
  { code: "USD", name: "US Dollar", symbol: "$", fractionDigits: 2, sliderStep: 25, sliderMax: 2_000 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", fractionDigits: 2, sliderStep: 25, sliderMax: 2_000 },
  { code: "EUR", name: "Euro", symbol: "€", fractionDigits: 2, sliderStep: 25, sliderMax: 2_000 },
  { code: "GBP", name: "British Pound", symbol: "£", fractionDigits: 2, sliderStep: 25, sliderMax: 2_000 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", fractionDigits: 2, sliderStep: 25, sliderMax: 2_000 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", fractionDigits: 0, sliderStep: 1_000, sliderMax: 200_000 },
];

export class CurrencyRegistry {
  private readonly items = new Map<string, CurrencyDefinition>();

  constructor(definitions: CurrencyDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: CurrencyDefinition): void {
    this.items.set(definition.code.toUpperCase(), {
      ...definition,
      code: definition.code.toUpperCase(),
    });
  }

  get(code: string): CurrencyDefinition | undefined {
    return this.items.get(code.toUpperCase());
  }

  list(): CurrencyDefinition[] {
    return [...this.items.values()];
  }

  format(amount: number, currencyCode: string, locale: string): string {
    const code = currencyCode.toUpperCase();
    const known = this.get(code);
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: known?.fractionDigits ?? 2,
        maximumFractionDigits: known?.fractionDigits ?? 2,
      }).format(amount);
    } catch {
      return `${code} ${amount.toLocaleString(locale)}`;
    }
  }

  formatCompact(amount: number, currencyCode: string, locale: string): string {
    const code = currencyCode.toUpperCase();
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(amount);
    } catch {
      return this.format(amount, code, locale);
    }
  }
}

export const currencies = new CurrencyRegistry(STARTER);
