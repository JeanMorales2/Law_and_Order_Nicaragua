let accessTokenCache: string | null = null;
let unauthorizedHandler: (() => Promise<void> | void) | null = null;

export function getAccessToken() {
  return accessTokenCache;
}

export function setAccessToken(token: string | null) {
  accessTokenCache = token;
}

export function registerUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  unauthorizedHandler = handler;
}

export async function notifyUnauthorized() {
  await unauthorizedHandler?.();
}
