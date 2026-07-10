# Stage 1: Build the Rust backend
FROM rust:1.95-slim-bookworm AS builder

# Install required build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev build-essential

WORKDIR /usr/src/app

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && echo "" > src/lib.rs
RUN cargo build --release
RUN rm -rf src

COPY src ./src
RUN touch src/main.rs src/lib.rs
RUN cargo build --release

# Stage 2: Create a minimal runtime image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /usr/src/app/target/release/RapidRAW /usr/local/bin/rapidraw-backend

ENV PORT=8080
EXPOSE $PORT

CMD ["rapidraw-backend"]
