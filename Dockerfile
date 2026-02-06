# Dockerfile — put the repository at container root (/)
FROM debian:bookworm-slim

# Install CA certs for TLS; keep image small
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Use root as working dir so files and relative lookups happen from /
WORKDIR /

# Copy entire repository into container root
# (this will place files like tct-linux, entrypoint.sh, data/ etc at /)
COPY . /

# Make entrypoint and binary executable (if present)
RUN if [ -f /entrypoint.sh ]; then chmod +x /entrypoint.sh; fi \
 && if [ -f /tct-linux ]; then chmod +x /tct-linux; fi \
 && chmod -R 755 /data || true

# Use the repo's entrypoint (should create /.env and start the binary)
ENTRYPOINT ["/entrypoint.sh"]

# Default command — binary at root
CMD ["/tct-linux"]
