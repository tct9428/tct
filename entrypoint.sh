#!/bin/sh
set -e

# This script generates a /.env file from the container's environment
# and applies runtime defaults (e.g. PREFIX=".") when variables are not provided.
# Then it execs the binary passed via CMD.

env_file="/.env"

# start fresh
echo "# Generated .env — do not commit" > "$env_file"

# helper: write var if present, escaping quotes/backslashes
add_if() {
  varname="$1"
  val="$(eval "printf '%s' \"\${$varname}\"")"
  if [ -n "$val" ]; then
    escaped=$(printf '%s' "$val" | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf '%s="%s"\n' "$varname" "$escaped" >> "$env_file"
  fi
}

# list variables that your app may need (add more if required)
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
add_if DASHBOARD_USER
add_if DASHBOARD_PASS
add_if server_port

# --- CRITICAL ADDITION FOR KEEPALIVE ---
add_if RENDER_EXTERNAL_URL 
# ---------------------------------------

# --- Runtime defaults (only when not provided) ---
# If PREFIX was not written (i.e., not set or empty), write default "."
# We check the runtime environment variable directly to avoid duplicate entries.
if [ -z "$(eval "printf '%s' \"\${PREFIX}\"")" ]; then
  # Only append default if not already present in the file
  if ! grep -q '^PREFIX=' "$env_file"; then
    printf 'PREFIX="."\n' >> "$env_file"
  fi
fi

# quick status (do not print secrets)
if [ -s "$env_file" ]; then
  echo ".env created at $env_file (contents hidden)"
else
  echo "Warning: /.env is empty — SESSION_ID or other vars may be missing"
fi

# run the main process
exec "$@"
