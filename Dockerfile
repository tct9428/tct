# Dockerfile
FROM debian:bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /

# 2. Copy the repo
COPY . .

# 3. Permissions
RUN chmod +x /entrypoint.sh \
 && chmod -R 755 /data || true

ENTRYPOINT ["/entrypoint.sh"]

