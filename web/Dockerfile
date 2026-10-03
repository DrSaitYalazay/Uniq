# Basis-Images vom AWS-Spiegel (identisch zu Docker Hub): IONOS-Server erreicht
# registry-1.docker.io nicht (TLS handshake timeout, 2026-09-10).
# --- build aşaması: Vite ile statik build ---
# V-4: Node 24 (LTS, Sicherheitsupdates bis 30.04.2028); Node 20 ist seit
# 30.04.2026 ohne Sicherheitsupdates.
FROM public.ecr.aws/docker/library/node:24-alpine AS build
WORKDIR /app
# V-4: package-lock.json ist neu erzeugt und geprüft (npm audit, Build) — npm ci
# installiert genau diese Versionen samt Prüfsummen. Vorher wurde bei jedem Build
# frisch aufgelöst: ein kompromittiertes Paket-Update wäre ungeprüft im Bundle
# jedes Kunden gelandet. (bun.lock ist veraltet und wird nicht benutzt.)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# API aynı origin'den (nginx proxy) sunulacağı için VITE_CY_API_URL boş
ENV VITE_CY_API_URL=""
RUN npm run build

# --- servis aşaması: nginx (statik + api proxy) ---
FROM public.ecr.aws/docker/library/nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
