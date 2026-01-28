#!/bin/sh
set -e

# This script generates a /.env file from the running container's environment
# (so you can set SESSION_ID in Render's Environment Variables UI),
# then starts the binary. It does NOT print the secret values.

env_file="/.env"

# start fresh
echo "# Generated .env — do not commit" > "$env_file"

# helper: write var if present, escaping quotes/backslashes
add_if() {
  varname="$1"
  # get value of the variable by name
  val="$(eval "printf '%s' \"\${$varname}\"")"
  if [ -n "$val" ]; then
    # escape backslashes and double quotes
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

# quick status
if [ -s "$env_file" ]; then
  echo ".env created at $env_file (contents hidden)"
else
  echo "Warning: /.env is empty — SESSION_ID or other vars may be missing"
fi

# run the main process
exec "$@"
