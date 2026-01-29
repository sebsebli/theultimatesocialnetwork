import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
  // 1. Try to get locale from cookies
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  // 2. Fallback to Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");

  let locale = "en"; // Default

  if (
    localeCookie &&
    [
      "en",
      "de",
      "cs",
      "da",
      "es",
      "fi",
      "fr",
      "hu",
      "it",
      "nl",
      "no",
      "pl",
      "pt",
      "ru",
      "sv",
    ].includes(localeCookie)
  ) {
    locale = localeCookie;
  } else if (acceptLanguage) {
    // Simple check for German
    if (acceptLanguage.startsWith("de")) locale = "de";
    // Add other language checks here as needed
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
