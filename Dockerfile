# Stage 1: build React frontend
FROM node:18-bullseye AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: production runtime (no dev deps)
FROM node:18-bullseye-slim
ENV QT_QPA_PLATFORM=offscreen
RUN apt-get update && apt-get install -y \
    openscad \
    libgl1-mesa-glx \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY --from=builder /app/build ./build
EXPOSE 3001
CMD ["node", "server.js"]
