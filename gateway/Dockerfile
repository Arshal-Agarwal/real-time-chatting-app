# ────────────── Stage 1: Build Stage ──────────────
FROM node:22 AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ────────────── Stage 2: Final Stage ──────────────
FROM node:22-slim 
WORKDIR /app
COPY --from=backend-builder /app .
COPY .env .env
EXPOSE 4000
CMD ["npm", "start"]