# SISTER

Frontend separado para integração com o ArcGIS Enterprise / SIURB.

## Primeiro objetivo

Validar o login de usuários pelo OAuth 2.0 do ArcGIS Enterprise usando Authorization Code + PKCE.

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Rode `npm install`.
3. Rode `npm run dev`.
4. Acesse `http://localhost:3000`.
5. Clique em **Entrar com ArcGIS**.

O redirect URI cadastrado no ArcGIS precisa ser:

`http://localhost:3000/auth/arcgis/callback`
