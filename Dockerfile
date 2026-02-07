FROM debian:bookworm-slim

# 1. Install curl (CRITICAL: Required for entrypoint.sh to download the binary)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /

# 2. Copy the repo (entrypoint.sh, app.json, etc.)
COPY . .

# 3. Permissions
RUN chmod +x /entrypoint.sh \
 && chmod -R 755 /data || true

ENTRYPOINT ["/entrypoint.sh"]

# Optional: You can explicitly start the bot, or let entrypoint handle it
CMD ["./tct-linux"]
