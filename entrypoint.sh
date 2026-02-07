#!/bin/sh
set -e

# --- 1. AUTO-DOWNLOAD LOGIC ---
BINARY_NAME="tct-linux"
DOWNLOAD_URL="https://github.com/i-tct/tct/releases/latest/download/$BINARY_NAME"

if [ ! -f "./$BINARY_NAME" ]; then
    echo "Binary not found. Downloading from: $DOWNLOAD_URL"
    
    if command -v curl >/dev/null 2>&1; then
        curl -L "$DOWNLOAD_URL" -o "$BINARY_NAME"
    elif command -v wget >/dev/null 2>&1; then
        wget -O "$BINARY_NAME" "$DOWNLOAD_URL"
    else
        echo "Error: curl/wget not found. Cannot download binary."
        exit 1
    fi
    chmod +x "$BINARY_NAME"
    echo "Download complete."
fi

# --- 2. GENERATE .ENV ---
# We use "./.env" (current dir) to be compatible with Heroku and Docker
env_file="./.env"

echo "# Generated .env" > "$env_file"

# Helper to write variables
add_if() {
  varname="$1"
  val="$(eval "printf '%s' \"\${$varname}\"")"
  if [ -n "$val" ]; then
    # Escape quotes/backslashes
    escaped=$(printf '%s' "$val" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf '%s="%s"\n' "$varname" "$escaped" >> "$env_file"
  fi
}

# Add your variables
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
# If arguments are passed (like from Docker CMD), run them
# Otherwise, default to running the binary
if [ "$#" -gt 0 ]; then
    exec "$@"
else
    exec "./$BINARY_NAME"
fi
