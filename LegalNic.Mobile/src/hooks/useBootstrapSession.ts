import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export function useBootstrapSession() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
}
