const LIMIT_CODES = {
  demo_full: "demo_full",
  row_limit_exceeded: "row_limit_exceeded",
  debt_entity_name_length: "name_invalid",
  debt_entity_category_known: "category_invalid",
  debt_entity_color_hex: "color_invalid",
} as const;

export type LimitErrorCode = (typeof LIMIT_CODES)[keyof typeof LIMIT_CODES];

export function limitErrorCode(message: string): LimitErrorCode | null {
  for (const [needle, code] of Object.entries(LIMIT_CODES)) {
    if (message.includes(needle)) return code;
  }
  return null;
}

export function asLimitError(error: { message: string }): Error {
  return new Error(limitErrorCode(error.message) ?? error.message);
}
