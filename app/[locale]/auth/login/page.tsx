import { headers } from "next/headers";
import { AuthForm } from "@/components/AuthForm";
import { createRegionResolver } from "@/lib/region";

export default async function LoginPage() {
  const headerStore = await headers();
  const defaults = createRegionResolver().resolve({
    acceptLanguage: headerStore.get("accept-language"),
  });
  return (
    <AuthForm
      mode="login"
      suggestedLanguage={defaults.languageCode}
      suggestedCurrency={defaults.suggestedCurrencyCode}
    />
  );
}
