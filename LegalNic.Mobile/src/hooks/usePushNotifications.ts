import { useEffect, useRef } from "react";
import { registerForPushNotifications } from "../services/notifications/pushNotifications";
import { useAuthStore } from "../store/authStore";

export function usePushNotifications() {
  const status = useAuthStore((state) => state.status);
  const registeredRef = useRef(false);

  useEffect(() => {
    if (status !== "signedIn" || registeredRef.current) {
      return;
    }

    registeredRef.current = true;

    void registerForPushNotifications().catch(() => {
      registeredRef.current = false;
    });
  }, [status]);
}
