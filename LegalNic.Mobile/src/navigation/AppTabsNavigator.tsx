import { createBottomTabNavigator, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { BottomTabBar, type BottomTabItem } from "../components/BottomTabBar";
import { theme } from "../theme";
import { useAuthStore } from "../store/authStore";
import { CitizenHomeScreen } from "../screens/CitizenHomeScreen";
import { CitizenRequestsScreen } from "../screens/CitizenRequestsScreen";
import { MessagesScreen } from "../screens/MessagesScreen";
import { AccountScreen } from "../screens/AccountScreen";
import { LawyerDashboardScreen } from "../screens/LawyerDashboardScreen";
import { LawyerServicesScreen } from "../screens/LawyerServicesScreen";
import { LawyerRequestsScreen } from "../screens/LawyerRequestsScreen";

export type CitizenTabParamList = {
  CitizenHome: undefined;
  CitizenRequests: undefined;
  CitizenMessages: undefined;
  CitizenAccount: undefined;
};

export type LawyerTabParamList = {
  LawyerDashboard: undefined;
  LawyerServices: undefined;
  LawyerRequests: undefined;
  LawyerAccount: undefined;
};

const CitizenTabs = createBottomTabNavigator<CitizenTabParamList>();
const LawyerTabs = createBottomTabNavigator<LawyerTabParamList>();

const citizenItems: Record<keyof CitizenTabParamList, BottomTabItem> = {
  CitizenHome: { key: "CitizenHome", label: "Inicio", icon: "home-outline" },
  CitizenRequests: { key: "CitizenRequests", label: "Solicitudes", icon: "briefcase-outline" },
  CitizenMessages: { key: "CitizenMessages", label: "Mensajes", icon: "chatbubble-ellipses-outline" },
  CitizenAccount: { key: "CitizenAccount", label: "Cuenta", icon: "person-outline" },
};

const lawyerItems: Record<keyof LawyerTabParamList, BottomTabItem> = {
  LawyerDashboard: { key: "LawyerDashboard", label: "Dashboard", icon: "grid-outline" },
  LawyerServices: { key: "LawyerServices", label: "Servicios", icon: "layers-outline" },
  LawyerRequests: { key: "LawyerRequests", label: "Solicitudes", icon: "briefcase-outline" },
  LawyerAccount: { key: "LawyerAccount", label: "Cuenta", icon: "person-outline" },
};

export function AppTabsNavigator() {
  const role = useAuthStore((state) => state.role);

  if (role === "Citizen") {
    return (
      <CitizenTabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} items={citizenItems} />}>
        <CitizenTabs.Screen component={CitizenHomeScreen} name="CitizenHome" />
        <CitizenTabs.Screen component={CitizenRequestsScreen} name="CitizenRequests" />
        <CitizenTabs.Screen component={MessagesScreen} name="CitizenMessages" />
        <CitizenTabs.Screen component={AccountScreen} name="CitizenAccount" />
      </CitizenTabs.Navigator>
    );
  }

  return (
    <LawyerTabs.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} items={lawyerItems} />}>
      <LawyerTabs.Screen component={LawyerDashboardScreen} name="LawyerDashboard" />
      <LawyerTabs.Screen component={LawyerServicesScreen} name="LawyerServices" />
      <LawyerTabs.Screen component={LawyerRequestsScreen} name="LawyerRequests" />
      <LawyerTabs.Screen component={AccountScreen} name="LawyerAccount" />
    </LawyerTabs.Navigator>
  );
}

function TabBar({
  items,
  navigation,
  state,
}: BottomTabBarProps & {
  items: Record<string, BottomTabItem>;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
      <BottomTabBar
        activeKey={state.routeNames[state.index] ?? state.routeNames[0] ?? ""}
        items={state.routeNames
          .map((routeName) => items[routeName])
          .filter((item): item is BottomTabItem => Boolean(item))}
        onSelect={(key) => navigation.navigate(key)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.paper,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
});
