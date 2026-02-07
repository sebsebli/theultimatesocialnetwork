import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
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
  const pendingUrlRef = useRef<string | null>(null);

  const openInAppBrowser = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        // Use default presentation (OVER_FULL_SCREEN) on iOS — FULL_SCREEN can cause immediate dismiss
        ...(Platform.OS === "android" ? {} : {}),
        toolbarColor: "#0a0a0a",
        controlsColor: "#5B8DEF",
      });
    } catch (err) {
      if (__DEV__) console.warn("WebBrowser failed, falling back to Linking:", err);
      try {
        await Linking.openURL(url);
      } catch {
        if (__DEV__) console.warn("Linking.openURL also failed");
      }
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

      pendingUrlRef.current = trimmed;
      setVisible(true);
    },
    [openInAppBrowser],
  );

  const handleOpen = useCallback(() => {
    const url = pendingUrlRef.current;
    if (url) {
      pendingUrlRef.current = null;
      setVisible(false);
      // Delay to let the modal fully dismiss before opening browser
      setTimeout(() => {
        openInAppBrowser(url);
      }, 500);
    }
  }, [openInAppBrowser]);

  const handleCancel = useCallback(() => {
    pendingUrlRef.current = null;
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
