import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import { getSupabaseEnv } from "@/lib/supabase/env";

const handleI18n = createIntlMiddleware(routing);
const locales = routing.locales;
const protectedPaths = ["/dashboard", "/debts", "/budget", "/plan", "/settings"];

function splitPath(pathname: string) {
  const [, maybe, ...rest] = pathname.split("/");
  if (locales.includes(maybe as (typeof locales)[number])) {
    return { locale: maybe, rest: `/${rest.join("/")}`.replace(/\/$/, "") || "/" };
  }
  return { locale: null, rest: pathname };
}

function isProtected(path: string) {
  return protectedPaths.some((item) => path === item || path.startsWith(`${item}/`));
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function proxy(request: NextRequest) {
  const intlResponse = handleI18n(request);
  const env = getSupabaseEnv();
  if (!env) return intlResponse;
  if (intlResponse.headers.get("location")) return intlResponse;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          intlResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const { locale, rest } = splitPath(request.nextUrl.pathname);
  if (!locale) return intlResponse;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("language_code")
      .eq("id", user.id)
      .maybeSingle();
    if (
      profile?.language_code &&
      locales.includes(profile.language_code) &&
      profile.language_code !== locale
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/${profile.language_code}${rest === "/" ? "" : rest}`;
      return copyCookies(intlResponse, NextResponse.redirect(url));
    }
  }

  if (!user && isProtected(rest)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    return copyCookies(intlResponse, NextResponse.redirect(url));
  }

  if (user && rest.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return copyCookies(intlResponse, NextResponse.redirect(url));
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
