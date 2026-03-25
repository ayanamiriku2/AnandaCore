# ============================================
# Stage 1: Build Rust Backend
# ============================================
FROM rust:bookworm AS backend-builder
WORKDIR /app
COPY backend/Cargo.toml backend/Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY backend/ .
RUN touch src/main.rs && cargo build --release

# ============================================
# Stage 2: Build Next.js Frontend
# ============================================
FROM node:20-alpine AS frontend-deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
# API calls go to localhost backend in same container
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
RUN npm run build

# ============================================
# Stage 3: Combined Runtime
# ============================================
FROM node:20-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Rust backend binary
COPY --from=backend-builder /app/target/release/anandacore /app/anandacore
COPY --from=backend-builder /app/migrations /app/migrations

# Copy Next.js standalone
COPY --from=frontend-builder /app/public /app/frontend/public
COPY --from=frontend-builder /app/.next/standalone /app/frontend
COPY --from=frontend-builder /app/.next/static /app/frontend/.next/static

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting AnandaCore Backend on port 8080..."' >> /app/start.sh && \
    echo 'APP_PORT=8080 APP_HOST=0.0.0.0 /app/anandacore &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'echo "Starting AnandaCore Frontend on port ${PORT:-3000}..."' >> /app/start.sh && \
    echo 'cd /app/frontend && HOSTNAME=0.0.0.0 node server.js &' >> /app/start.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start.sh && \
    echo 'echo "AnandaCore is running!"' >> /app/start.sh && \
    echo 'wait $BACKEND_PID $FRONTEND_PID' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000 8080
CMD ["/app/start.sh"]
