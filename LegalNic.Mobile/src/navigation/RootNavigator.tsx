import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleguideScreen } from "../screens/StyleguideScreen";

export type RootStackParamList = {
  Styleguide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Styleguide"
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="Styleguide" component={StyleguideScreen} />
    </Stack.Navigator>
  );
}
