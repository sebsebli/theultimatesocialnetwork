"use client";

import { useEffect } from "react";
import { useAuth } from "./auth-provider";

export function NotificationManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const registerPush = async () => {
      if (!("Notification" in window)) return;

      if (Notification.permission === "default") {
        // We can request permission here, or show a UI element to request it.
        // For "feature parity", mobile apps ask on startup or context.
        // We'll ask on startup for now, or logged in.
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            // Get token logic would go here.
            // Since we don't have Firebase config in this repo context, we stub it.
            // import { getMessaging, getToken } from "firebase/messaging";
            // const token = await getToken(getMessaging(), { vapidKey: '...' });

            // For now, we assume a token is available or simulate it to prove the flow.
            console.log("Notification permission granted.");

            // Example of how we would send it to backend:
            // await fetch("/api/me/push-tokens", {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({
            //     token: "web-token-placeholder",
            //     provider: "FCM",
            //     platform: "web",
            //   }),
            // });
          }
        } catch (e) {
          console.error("Failed to request notification permission", e);
        }
      }
    };

    registerPush();
  }, [user]);

  return null;
}
