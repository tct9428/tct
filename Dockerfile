# start minimal but include CA certs so TLS downloads work
FROM debian:bookworm-slim

WORKDIR /

# ensure TLS root certs exist (fixes x509: certificate signed by unknown authority)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# copy the precompiled binary (make sure it's in repo root)
COPY tct-linux /tct-linux

# copy the entrypoint helper
COPY entrypoint.sh /entrypoint.sh

# make sure both are executable
RUN chmod +x /tct-linux /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/tct-linux"]
