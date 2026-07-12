import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { useAuthStore } from "../store/authStore";
import { AppTabsNavigator } from "./AppTabsNavigator";
import type { CitizenTabParamList } from "./AppTabsNavigator";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { LawyerProfileScreen } from "../screens/LawyerProfileScreen";
import { ServiceRequestFormScreen } from "../screens/ServiceRequestFormScreen";
import { ServiceRequestConfirmationScreen } from "../screens/ServiceRequestConfirmationScreen";
import { ServiceRequestDetailScreen } from "../screens/ServiceRequestDetailScreen";
import { ReviewServiceScreen } from "../screens/ReviewServiceScreen";
import { RequestChatScreen } from "../screens/RequestChatScreen";
import { AccountHistoryScreen } from "../screens/AccountHistoryScreen";
import { LawyerServiceFormScreen } from "../screens/LawyerServiceFormScreen";
import { LawyerAvailabilityScreen } from "../screens/LawyerAvailabilityScreen";
import { LawyerReviewsScreen } from "../screens/LawyerReviewsScreen";
import { LawyerCommissionsScreen } from "../screens/LawyerCommissionsScreen";
import { LawyerVerificationDocumentsScreen } from "../screens/LawyerVerificationDocumentsScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login:
    | {
        prefilledEmail?: string;
        successMessage?: string;
      }
    | undefined;
  Register: undefined;
  App: NavigatorScreenParams<CitizenTabParamList> | undefined;
  LawyerProfile: {
    lawyerId: number;
    previewBanner?: boolean;
  };
  ServiceRequestForm: {
    lawyerId: number;
    serviceId?: number;
  };
  ServiceRequestConfirmation: {
    requestId: number;
  };
  ServiceRequestDetail: {
    requestId: number;
  };
  ReviewService: {
    requestId: number;
  };
  RequestChat: {
    requestId: number;
  };
  AccountHistory: undefined;
  LawyerServiceForm:
    | {
        serviceId?: number;
      }
    | undefined;
  LawyerAvailability: undefined;
  LawyerReviews: undefined;
  LawyerCommissions: undefined;
  LawyerVerificationDocuments: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useAuthStore((state) => state.status);

  if (status === "booting") {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen component={SplashScreen} name="Splash" />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={status === "signedIn" ? "App" : "Login"}
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      {status === "signedIn" ? (
        <>
          <Stack.Screen component={AppTabsNavigator} name="App" />
          <Stack.Screen component={LawyerProfileScreen} name="LawyerProfile" />
          <Stack.Screen component={ServiceRequestFormScreen} name="ServiceRequestForm" />
          <Stack.Screen component={ServiceRequestConfirmationScreen} name="ServiceRequestConfirmation" />
          <Stack.Screen component={ServiceRequestDetailScreen} name="ServiceRequestDetail" />
          <Stack.Screen component={ReviewServiceScreen} name="ReviewService" />
          <Stack.Screen component={RequestChatScreen} name="RequestChat" />
          <Stack.Screen component={AccountHistoryScreen} name="AccountHistory" />
          <Stack.Screen component={LawyerServiceFormScreen} name="LawyerServiceForm" />
          <Stack.Screen component={LawyerAvailabilityScreen} name="LawyerAvailability" />
          <Stack.Screen component={LawyerReviewsScreen} name="LawyerReviews" />
          <Stack.Screen component={LawyerCommissionsScreen} name="LawyerCommissions" />
          <Stack.Screen component={LawyerVerificationDocumentsScreen} name="LawyerVerificationDocuments" />
        </>
      ) : (
        <>
          <Stack.Screen component={LoginScreen} name="Login" />
          <Stack.Screen component={RegisterScreen} name="Register" />
        </>
      )}
    </Stack.Navigator>
  );
}
