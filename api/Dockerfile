# Basis-Images vom AWS-Spiegel (identisch zu Docker Hub): IONOS-Server erreicht
# registry-1.docker.io nicht (TLS handshake timeout, 2026-09-10).
# V-4: Node 24 (LTS, Sicherheitsupdates bis 30.04.2028). Node 20 bekommt seit
# 30.04.2026 keine Sicherheitsupdates mehr.
FROM public.ecr.aws/docker/library/node:24-alpine
WORKDIR /app
# V-4: genau die geprüften Versionen aus package-lock.json (npm ci). Vorher zog
# jeder Build die jeweils neuesten passenden Versionen — ein kompromittiertes
# Paket-Update wäre ungeprüft in Produktion gelandet.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/index.js"]
