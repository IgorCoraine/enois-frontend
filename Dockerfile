# Base image pinned by digest (node:22-alpine, multi-arch index); bump it deliberately.
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# A base da API entra no BUILD (o Vite embute as VITE_* no bundle). Sem esta linha o build cai no
# fallback do api-client e a imagem publicada aponta para localhost — foi exatamente isso que
# derrubou o app em 18/10: o bundle servido chamava http://localhost:8081/api.
ARG VITE_API_BACKEND=https://enois.ia.br/api
ENV VITE_API_BACKEND=$VITE_API_BACKEND

# Origem pública que o SSR declara ao backend (X-Client-Origin). No browser o front usa
# window.location.origin; no servidor não existe location, então a URL entra no build — QA e prod
# precisam de valores diferentes.
ARG VITE_SITE_URL=https://enois.ia.br
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN NITRO_PRESET=node-server npm run build

FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output

# Processo sem privilégios (E-17): o runtime não precisa de root para servir o SSR.
# Remove o npm/npx do runtime: o app só precisa do Node, e o npm da imagem-base carrega
# dependências (pacote/sigstore/brace-expansion) que só existem no build.
RUN addgroup -S app && adduser -S app -G app \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
USER app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
