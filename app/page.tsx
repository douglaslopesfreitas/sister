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
  [key: string]: unknown;
};

const DETAIL_FIELDS = [
  ["nome", "Nome completo"],
  ["servico", "Serviço buscado"],
  ["telefone_fixo", "Telefone fixo"],
  ["telefone_celular", "Telefone celular"],
  ["email", "E-mail"],
  ["cpf", "CPF"],
  ["nascimento", "Data de nascimento"],
  ["idade", "Idade"],
  ["contato_emergencia", "Contato de emergência"],
  ["telefone_fixo_emergencia", "Telefone fixo de emergência"],
  ["telefone_celular_emergencia", "Telefone celular de emergência"],
  ["tem_nis", "Possui NIS?"],
  ["nis", "NIS"],
  ["municipio", "Município"],
  ["bairro", "Bairro"],
  ["rua", "Rua"],
  ["num_casa", "Número"],
  ["complemento", "Complemento"],
  ["comunidade", "Mora em comunidade ou favela?"],
  ["qual_comunidade", "Qual comunidade?"],
  ["cor_ou_raca", "Cor ou raça"],
  ["etnias", "Etnia"],
  ["genero", "Identidade de gênero"],
  ["orientacao", "Orientação sexual"],
  ["estado_civil", "Estado civil"],
  ["pcd", "Pessoa com deficiência?"],
  ["tipo_pcd", "Tipo de deficiência"],
  ["tem_filhos", "Tem filhos?"],
  ["quantos_filhos", "Quantidade de filhos"],
  ["mae_atipica", "Mãe atípica?"],
  ["religiao", "Religião"],
  ["nacionalidade", "Nacionalidade"],
  ["chefe_familia", "Principal responsável pela renda?"],
  ["renda_per_capita", "Renda familiar per capita"],
  ["escolaridade", "Escolaridade"],
  ["cnh", "Possui CNH?"],
  ["cnh_categoria", "Categoria da CNH"],
  ["como_conheceu", "Como conheceu a casa?"],
  ["encaminhamento", "Veio encaminhada?"],
  ["tipo_encaminhamento", "Tipo de encaminhamento"],
  ["rede_interna", "Rede interna"],
  ["rede_ampliada", "Rede ampliada"],
  ["primeira_vez", "Primeira vez no equipamento?"],
  ["data_primeira_vez", "Data da primeira vez"],
  ["equipe_cadastro", "Equipe de cadastro"],
  ["created_user", "Criado por"],
  ["created_date", "Criado em"],
  ["last_edited_user", "Última edição por"],
  ["last_edited_date", "Última edição em"],
] as const;

function formatFieldValue(field: string, value: unknown) {
  if (value == null || value === "") return "—";

  if (
    ["nascimento", "data_primeira_vez", "created_date", "last_edited_date"].includes(
      field,
    ) &&
    typeof value === "number"
  ) {
    return new Date(value).toLocaleString("pt-BR");
  }

  return String(value);
}

export default function Home() {
  const [token, setToken] = useState<ArcGisToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [cadastrosLoading, setCadastrosLoading] = useState(false);
  const [cadastrosError, setCadastrosError] = useState("");
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [selectedCadastro, setSelectedCadastro] = useState<Cadastro | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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
    setSelectedCadastro(null);
    setCadastrosError("");
  }

  async function openCadastro(item: Cadastro) {
    if (!token?.access_token || !item.objectid) return;

    setSelectedCadastro(item);
    setDetailLoading(true);
    setDetailError("");

    try {
      const params = new URLSearchParams({
        f: "json",
        where: `objectid=${item.objectid}`,
        outFields: "*",
        returnGeometry: "false",
        resultRecordCount: "1",
        token: token.access_token,
      });

      const response = await fetch(
        `${FEATURE_QUERY_URL}?${params.toString()}`,
        { cache: "no-store" },
      );

      const result = await response.json().catch(() => null);
      const attributes = result?.features?.[0]?.attributes;

      if (!response.ok || result?.error || !attributes) {
        throw new Error(
          result?.error?.message ||
            "Não foi possível abrir a ficha deste cadastro.",
        );
      }

      setSelectedCadastro(attributes);
    } catch (caught) {
      setDetailError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível abrir a ficha.",
      );
    } finally {
      setDetailLoading(false);
    }
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
                      <tr
                        key={item.objectid}
                        className="clickable-row"
                        onClick={() => void openCadastro(item)}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            void openCadastro(item);
                          }
                        }}
                      >
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

      {selectedCadastro ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCadastro(null);
              setDetailError("");
            }
          }}
        >
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
          >
            <div className="detail-modal-header">
              <div>
                <span className="eyebrow">Cadastro #{selectedCadastro.objectid ?? "—"}</span>
                <h2 id="detail-title">{String(selectedCadastro.nome || "Cadastro")}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setSelectedCadastro(null);
                  setDetailError("");
                }}
                aria-label="Fechar ficha"
              >
                ×
              </button>
            </div>

            {detailError ? (
              <div className="status error">{detailError}</div>
            ) : detailLoading ? (
              <div className="empty">Carregando ficha completa...</div>
            ) : (
              <div className="detail-grid">
                {DETAIL_FIELDS.map(([field, label]) => (
                  <div className="detail-field" key={field}>
                    <span>{label}</span>
                    <strong>
                      {formatFieldValue(field, selectedCadastro[field])}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
