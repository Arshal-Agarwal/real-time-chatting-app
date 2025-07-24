# ─────────────── Build + Runtime in one stage ───────────────
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy rest of the source code
COPY . .
COPY ../chat-shared-schemas ./chat-shared-schemas

# Build the app
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]