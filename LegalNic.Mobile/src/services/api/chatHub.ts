import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { apiConfig } from "./client";
import type { ChatMessageResponse } from "./contracts";
import { getAccessToken } from "./session";

export type ChatConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export function createChatConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${apiConfig.apiRootUrl}/hubs/chat`, {
      accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
}

export async function startChatConnection(connection: HubConnection) {
  if (connection.state === HubConnectionState.Disconnected) {
    await connection.start();
  }
}

export async function joinRequestGroup(connection: HubConnection, requestId: number) {
  if (connection.state === HubConnectionState.Connected) {
    await connection.invoke("JoinRequestGroup", requestId);
  }
}

export async function sendRequestMessage(
  connection: HubConnection,
  requestId: number,
  content: string,
) {
  await connection.invoke("SendMessage", requestId, content);
}

export function onReceiveMessage(
  connection: HubConnection,
  handler: (message: ChatMessageResponse) => void,
) {
  connection.on("ReceiveMessage", handler);

  return () => connection.off("ReceiveMessage", handler);
}
