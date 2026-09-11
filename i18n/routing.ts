import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "id", "ms"],
  defaultLocale: "en",
  localeDetection: true,
});
