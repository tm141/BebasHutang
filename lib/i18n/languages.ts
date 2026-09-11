export interface LanguageDefinition {
  code: string;
  name: string;
  nativeName: string;
  intlLocale: string;
}

const STARTER: LanguageDefinition[] = [
  { code: "en", name: "English", nativeName: "English", intlLocale: "en-US" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", intlLocale: "id-ID" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", intlLocale: "ms-MY" },
];

export class LanguageRegistry {
  private readonly items = new Map<string, LanguageDefinition>();

  constructor(definitions: LanguageDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: LanguageDefinition): void {
    this.items.set(definition.code.toLowerCase(), {
      ...definition,
      code: definition.code.toLowerCase(),
    });
  }

  get(code: string): LanguageDefinition {
    return this.items.get(code.toLowerCase()) ?? this.items.get("en")!;
  }

  has(code: string): boolean {
    return this.items.has(code.toLowerCase());
  }

  list(): LanguageDefinition[] {
    return [...this.items.values()];
  }
}

export const languages = new LanguageRegistry(STARTER);
