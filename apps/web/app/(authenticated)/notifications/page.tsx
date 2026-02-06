import { redirect } from "next/navigation";

/** Redirect /notifications to inbox notifications tab for parity with mobile. */
export default function NotificationsRedirectPage() {
  redirect("/inbox?tab=notifications");
}
