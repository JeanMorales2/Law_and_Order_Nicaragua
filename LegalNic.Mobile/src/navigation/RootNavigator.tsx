import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import { AppTabsNavigator } from "./AppTabsNavigator";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { SplashScreen } from "../screens/SplashScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login:
    | {
        prefilledEmail?: string;
        successMessage?: string;
      }
    | undefined;
  Register: undefined;
  App: undefined;
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
        <Stack.Screen component={AppTabsNavigator} name="App" />
      ) : (
        <>
          <Stack.Screen component={LoginScreen} name="Login" />
          <Stack.Screen component={RegisterScreen} name="Register" />
        </>
      )}
    </Stack.Navigator>
  );
}
