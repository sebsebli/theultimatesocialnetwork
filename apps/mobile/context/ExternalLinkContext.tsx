import React, { createContext, useCallback, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import * as WebBrowser from "expo-web-browser";
import { ExternalLinkModal } from "../components/ExternalLinkModal";
import { COLORS } from "../constants/theme";

type OpenOptions = { skipDialog?: boolean };

type ExternalLinkContextValue = {
  openExternalLink: (url: string, options?: OpenOptions) => Promise<void>;
};

const ExternalLinkContext = createContext<ExternalLinkContextValue | null>(null);

type ProviderProps = {
  value: ExternalLinkContextValue;
  children: React.ReactNode;
};
const Provider = ExternalLinkContext.Provider as (props: ProviderProps) => React.ReactElement | null;

export function ExternalLinkProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const openInAppBrowser = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: COLORS.ink,
        controlsColor: COLORS.primary,
      });
    } catch {
      if (__DEV__) console.warn("Failed to open URL in app browser");
    }
  }, []);

  const openExternalLink = useCallback(
    async (url: string, options?: OpenOptions) => {
      const trimmed = url?.trim();
      if (!trimmed || !trimmed.startsWith("http")) return;

      if (options?.skipDialog) {
        await openInAppBrowser(trimmed);
        return;
      }

      setPendingUrl(trimmed);
      setVisible(true);
    },
    [openInAppBrowser],
  );

  const handleOpen = useCallback(() => {
    if (pendingUrl) {
      openInAppBrowser(pendingUrl);
      setPendingUrl(null);
      setVisible(false);
    }
  }, [pendingUrl, openInAppBrowser]);

  const handleCancel = useCallback(() => {
    setPendingUrl(null);
    setVisible(false);
  }, []);

  return (
    <Provider value={{ openExternalLink }}>
      {children}
      <ExternalLinkModal
        visible={visible}
        title={t("externalLink.title", "External link")}
        message={t(
          "externalLink.message",
          "You are leaving Citewalk. The following content is provided by a third party. Their privacy policy and terms apply. Open in the in-app browser?",
        )}
        openLabel={t("externalLink.open", "Open")}
        cancelLabel={t("externalLink.cancel", "Cancel")}
        onOpen={handleOpen}
        onCancel={handleCancel}
      />
    </Provider>
  );
}

export function useOpenExternalLink(): ExternalLinkContextValue {
  const ctx = useContext(ExternalLinkContext);
  if (!ctx) {
    throw new Error("useOpenExternalLink must be used within ExternalLinkProvider");
  }
  return ctx;
}
