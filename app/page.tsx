"use client";

import { useEffect, useState } from "react";
import {
  clearArcGisToken,
  readArcGisToken,
  startArcGisLogin,
} from "@/lib/arcgis-auth";

export default function Home() {
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(readArcGisToken());
  }, []);

  async function login() {
    setLoading(true);
    await startArcGisLogin();
  }

  function logout() {
    clearArcGisToken();
    setToken(null);
  }

  return (
    <main>
      <section className="card">
        <h1>SISTER</h1>
        <p>
          Primeiro teste: autenticação com o ArcGIS Enterprise do SIURB.
        </p>

        {token ? (
          <>
            <div className="status">
              Conectado ao ArcGIS
              {token.username ? ` como ${token.username}` : ""}.
            </div>
            <div style={{ height: 12 }} />
            <button type="button" onClick={logout}>
              Sair
            </button>
          </>
        ) : (
          <button type="button" onClick={login} disabled={loading}>
            {loading ? "Abrindo SIURB..." : "Entrar com ArcGIS"}
          </button>
        )}
      </section>
    </main>
  );
}
