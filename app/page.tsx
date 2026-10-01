"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearArcGisToken,
  readArcGisToken,
  startArcGisLogin,
} from "@/lib/arcgis-auth";

const FEATURE_QUERY_URL =
  "https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Hosted/service_27bd18ebbb3944ceb4b9d227c3b01eb2/FeatureServer/0/query";

type ArcGisToken = {
  access_token: string;
  username?: string;
};

type Cadastro = {
  objectid?: number;
  nome?: string;
  servico?: string;
  municipio?: string;
  bairro?: string;
  equipe_cadastro?: string;
  created_date?: number;
};

export default function Home() {
  const [token, setToken] = useState<ArcGisToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [cadastrosLoading, setCadastrosLoading] = useState(false);
  const [cadastrosError, setCadastrosError] = useState("");
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);

  useEffect(() => {
    setToken(readArcGisToken());
  }, []);

  useEffect(() => {
    if (!token?.access_token) {
      setCadastros([]);
      return;
    }

    void loadCadastros(token.access_token);
  }, [token?.access_token]);

  async function login() {
    setLoading(true);
    await startArcGisLogin();
  }

  function logout() {
    clearArcGisToken();
    setToken(null);
    setCadastros([]);
    setCadastrosError("");
  }

  async function loadCadastros(accessToken: string) {
    setCadastrosLoading(true);
    setCadastrosError("");

    try {
      const params = new URLSearchParams({
        f: "json",
        where: "1=1",
        outFields: [
          "objectid",
          "nome",
          "servico",
          "municipio",
          "bairro",
          "equipe_cadastro",
          "created_date",
        ].join(","),
        returnGeometry: "false",
        orderByFields: "created_date DESC",
        resultRecordCount: "20",
        token: accessToken,
      });

      const response = await fetch(
        `${FEATURE_QUERY_URL}?${params.toString()}`,
        { cache: "no-store" },
      );

      const result = await response.json().catch(() => null);

      if (
        !response.ok ||
        result?.error ||
        !Array.isArray(result?.features)
      ) {
        throw new Error(
          result?.error?.message ||
            "Não foi possível consultar os cadastros no ArcGIS.",
        );
      }

      setCadastros(
        result.features.map((feature: any) => feature?.attributes || {}),
      );
    } catch (caught) {
      setCadastros([]);
      setCadastrosError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível consultar os cadastros.",
      );
    } finally {
      setCadastrosLoading(false);
    }
  }

  const connectedLabel = useMemo(
    () =>
      token?.username
        ? `Conectado ao ArcGIS como ${token.username}.`
        : "Conectado ao ArcGIS.",
    [token?.username],
  );

  return (
    <main>
      <section className="shell">
        <div className="card">
          <h1>SISTER</h1>
          <p>
            Primeiro módulo: autenticação no SIURB e leitura da Feature Layer
            do Survey123.
          </p>

          {token ? (
            <>
              <div className="status">{connectedLabel}</div>
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void loadCadastros(token.access_token)}
                  disabled={cadastrosLoading}
                >
                  {cadastrosLoading ? "Atualizando..." : "Atualizar cadastros"}
                </button>
                <button type="button" onClick={logout}>
                  Sair
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={login} disabled={loading}>
              {loading ? "Abrindo SIURB..." : "Entrar com ArcGIS"}
            </button>
          )}
        </div>

        {token ? (
          <section className="data-card">
            <div className="data-header">
              <div>
                <h2>Cadastros</h2>
                <p>Últimos registros disponíveis para este usuário no ArcGIS.</p>
              </div>
              <strong>{cadastros.length}</strong>
            </div>

            {cadastrosError ? (
              <div className="status error">{cadastrosError}</div>
            ) : cadastrosLoading && cadastros.length === 0 ? (
              <div className="empty">Carregando cadastros...</div>
            ) : cadastros.length === 0 ? (
              <div className="empty">
                Nenhum cadastro foi retornado para este usuário.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Serviço</th>
                      <th>Município</th>
                      <th>Bairro</th>
                      <th>Equipe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cadastros.map((item) => (
                      <tr key={item.objectid ?? Math.random()}>
                        <td>{item.objectid ?? "—"}</td>
                        <td>{item.nome || "—"}</td>
                        <td>{item.servico || "—"}</td>
                        <td>{item.municipio || "—"}</td>
                        <td>{item.bairro || "—"}</td>
                        <td>{item.equipe_cadastro || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </main>
  );
}
