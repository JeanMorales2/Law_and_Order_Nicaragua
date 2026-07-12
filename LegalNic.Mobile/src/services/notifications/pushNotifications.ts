import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerDeviceToken } from "../api/users";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  const finalStatus = await requestNotificationPermission();

  if (finalStatus !== "granted") {
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "LegalNic",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (Device.isDevice) {
    const token = await Notifications.getDevicePushTokenAsync();

    await registerDeviceToken({
      deviceToken: token.data,
      platform: Platform.OS,
    });
  }

  await showLocalNotification();
}

async function requestNotificationPermission() {
  const currentPermissions = await Notifications.getPermissionsAsync();

  if (currentPermissions.status === "granted") {
    return currentPermissions.status;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return requestedPermissions.status;
}

async function showLocalNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "LegalNic",
      body: "Notificaciones activadas correctamente.",
    },
    trigger: null,
  });
}
