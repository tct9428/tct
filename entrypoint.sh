#!/bin/sh
set -e

# --- 1. FORCE DOWNLOAD BINARY ---
BINARY_NAME="tct-linux"
DOWNLOAD_URL="https://github.com/i-tct/tct/releases/latest/download/$BINARY_NAME"

echo "Ensuring clean binary installation..."

# Remove any existing bad/stale binary
if [ -f "./$BINARY_NAME" ]; then
    echo "Removing existing $BINARY_NAME to ensure freshness."
    rm -f "./$BINARY_NAME"
fi

echo "Downloading fresh binary from: $DOWNLOAD_URL"
if command -v curl >/dev/null 2>&1; then
    curl -L "$DOWNLOAD_URL" -o "$BINARY_NAME"
elif command -v wget >/dev/null 2>&1; then
    wget -O "$BINARY_NAME" "$DOWNLOAD_URL"
else
    echo "Error: curl/wget not found. Cannot download binary."
    exit 1
fi

chmod +x "$BINARY_NAME"
echo "Download complete. Binary size:"
ls -lh "$BINARY_NAME"
# -----------------------------

# --- 2. GENERATE .ENV ---
env_file="./.env"
echo "# Generated .env" > "$env_file"

add_if() {
  varname="$1"
  val="$(eval "printf '%s' \"\${$varname}\"")"
  if [ -n "$val" ]; then
    escaped=$(printf '%s' "$val" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf '%s="%s"\n' "$varname" "$escaped" >> "$env_file"
  fi
}

add_if SESSION_ID
add_if PREFIX
add_if TIMEZONE
add_if DB_BATCH_SIZE
add_if DB_FLUSH_INTERVAL
add_if DB_CACHE_MAX_BYTES
add_if DB_BUSY_TIMEOUT_MS
add_if CLOUDINARY_CLOUD_NAME
add_if CLOUDINARY_API_KEY
add_if CLOUDINARY_API_SECRET
add_if OPENWEATHER_API_KEY
add_if MISTRAL_API_KEY
add_if DASHBOARD_USER
add_if DASHBOARD_PASS
add_if server_port
add_if RENDER_EXTERNAL_URL 

# Defaults
if [ -z "$(eval "printf '%s' \"\${PREFIX}\"")" ]; then
  if ! grep -q '^PREFIX=' "$env_file"; then
    printf 'PREFIX="."\n' >> "$env_file"
  fi
fi

# --- 3. RUN THE BOT ---
echo "Starting bot..."
if [ "$#" -gt 0 ]; then
    exec "$@"
else
    exec "./$BINARY_NAME"
fi
