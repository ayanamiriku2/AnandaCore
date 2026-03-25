FROM rust:latest AS builder
WORKDIR /app
COPY backend/Cargo.toml backend/Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY backend/ .
RUN touch src/main.rs && cargo build --release

FROM debian:trixie-slim
RUN apt-get update && apt-get install -y ca-certificates libssl3t64 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/anandacore /app/anandacore
COPY --from=builder /app/migrations /app/migrations
EXPOSE 8080
CMD ["./anandacore"]
