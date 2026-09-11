import { getTranslations } from "next-intl/server";
import { SparkleIcon } from "@/components/Icons";
import { Link, redirect } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("demo");

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-teal-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <SparkleIcon size={16} className="text-white" />
          </div>
          <p className="font-700 text-teal-950">{BRAND.name}</p>
        </div>
        <div>
          <h1 className="text-2xl font-700 text-teal-950">{t("homeTitle")}</h1>
          <p className="text-sm text-teal-500 mt-1">{t("homeBody")}</p>
        </div>
        <Link
          href="/demo"
          className="block w-full px-4 py-3 rounded-xl bg-teal-600 text-white font-600 text-sm text-center"
        >
          {t("try")}
        </Link>
        <Link href="/auth/login" className="block text-sm text-teal-600">
          {t("login")}
        </Link>
      </div>
    </div>
  );
}
