FROM debian:bookworm-slim

WORKDIR /app

# Copy only the binary
COPY tct-linux /app/tct-linux

# Make sure it's executable (safety)
RUN chmod +x /app/tct-linux

# Run the bot
CMD ["/app/tct-linux"]
