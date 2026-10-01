"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ARCGIS_CLIENT_ID,
  ARCGIS_PORTAL_URL,
  ARCGIS_REDIRECT_URI,
  clearPkceVerifier,
  readPkceVerifier,
  storeArcGisToken,
} from "@/lib/arcgis-auth";

export default function ArcGisCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Concluindo autenticação...");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      setError(oauthError);
      return;
    }

    if (!code) {
      setError("O ArcGIS não devolveu o código de autorização.");
      return;
    }

    const verifier = readPkceVerifier();

    if (!verifier) {
      setError("A sessão PKCE não foi encontrada. Inicie o login novamente.");
      return;
    }

    void (async () => {
      try {
        const body = new URLSearchParams({
          client_id: ARCGIS_CLIENT_ID,
          grant_type: "authorization_code",
          code,
          redirect_uri: ARCGIS_REDIRECT_URI,
          code_verifier: verifier,
        });

        const response = await fetch(
          `${ARCGIS_PORTAL_URL}/sharing/rest/oauth2/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          },
        );

        const result = await response.json();

        if (!response.ok || result?.error || !result?.access_token) {
          throw new Error(
            result?.error_description ||
              result?.error?.message ||
              result?.error ||
              "O SIURB não devolveu um token de acesso.",
          );
        }

        storeArcGisToken(result);
        clearPkceVerifier();
        setMessage("Autenticação concluída. Redirecionando...");
        router.replace("/");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Não foi possível concluir a autenticação.",
        );
      }
    })();
  }, [router, searchParams]);

  return (
    <main>
      <section className="card">
        <h1>SISTER</h1>
        {error ? (
          <div className="status error">{error}</div>
        ) : (
          <div className="status">{message}</div>
        )}
      </section>
    </main>
  );
}
