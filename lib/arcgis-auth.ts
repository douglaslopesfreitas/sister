export const ARCGIS_PORTAL_URL =
  process.env.NEXT_PUBLIC_ARCGIS_PORTAL_URL || "https://siurb.rio/portal";

export const ARCGIS_CLIENT_ID =
  process.env.NEXT_PUBLIC_ARCGIS_CLIENT_ID || "Mc8xAYt07CBr0887";

export const ARCGIS_REDIRECT_URI =
  process.env.NEXT_PUBLIC_ARCGIS_REDIRECT_URI ||
  "http://localhost:3000/auth/arcgis/callback";

const PKCE_VERIFIER_KEY = "sister-arcgis-pkce-verifier";
const TOKEN_KEY = "sister-arcgis-token";

function base64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function randomVerifier(length = 64) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

export async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(digest);
}

export async function startArcGisLogin() {
  const verifier = randomVerifier();
  const challenge = await createCodeChallenge(verifier);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: ARCGIS_CLIENT_ID,
    response_type: "code",
    redirect_uri: ARCGIS_REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.assign(
    `${ARCGIS_PORTAL_URL}/sharing/rest/oauth2/authorize?${params.toString()}`,
  );
}

export function readPkceVerifier() {
  return sessionStorage.getItem(PKCE_VERIFIER_KEY) || "";
}

export function clearPkceVerifier() {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
}

export function storeArcGisToken(token: {
  access_token: string;
  expires_in?: number;
  username?: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}) {
  const expiresAt =
    Date.now() + Math.max(60, Number(token.expires_in || 7200)) * 1000;

  sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({
      ...token,
      expiresAt,
    }),
  );
}

export function readArcGisToken() {
  const raw = sessionStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || Number(parsed?.expiresAt || 0) <= Date.now()) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export function clearArcGisToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}
