FROM node:24-bookworm-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN chown node:node /app
USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
USER root
RUN mkdir -p /app/src/generated && chown -R node:node /app/src
USER node
RUN npm run build
CMD ["npm", "start", "--", "--hostname", "0.0.0.0"]
