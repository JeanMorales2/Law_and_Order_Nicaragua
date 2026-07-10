import { AppHomeScreen } from "./AppHomeScreen";
import { VerificationBanner } from "../components/VerificationBanner";
import { useAuthStore } from "../store/authStore";

export function LawyerDashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const verificationStatus = user?.lawyerProfile?.verificationStatus;
  const shouldShowBanner =
    verificationStatus === "Pending" || verificationStatus === "Rejected";

  return (
    <AppHomeScreen
      message="Este dashboard ya conoce el rol autenticado y el estado real de verificacion del backend."
      subtitle="Abogado / Estudiante"
      title="Dashboard"
    >
      {shouldShowBanner ? <VerificationBanner status={verificationStatus} /> : null}
    </AppHomeScreen>
  );
}
