# Dockerfile — copies the entire repository into /app and runs entrypoint
FROM debian:bookworm-slim

# Ensure TLS root certificates are present (fixes TLS x509 errors)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the entire repo into the container (including data/, entrypoint.sh, tct-linux, etc.)
COPY . /app

# Make entrypoint and binary executable if present
RUN if [ -f /app/entrypoint.sh ]; then chmod +x /app/entrypoint.sh; fi \
 && if [ -f /app/tct-linux ]; then chmod +x /app/tct-linux; fi \
 && chmod -R 755 /app/data || true

# Use the repo's entrypoint (it should create /.env or /app/.env as needed)
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command runs your binary (overridable by Render)
CMD ["/app/tct-linux"]
