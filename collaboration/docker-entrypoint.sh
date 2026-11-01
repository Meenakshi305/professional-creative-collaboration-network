#!/bin/sh
set -eu
: "${MEGA_SESSION:?Set MEGA_SESSION in Render Environment}"
echo "Restoring MEGA session..."
if ! timeout 120 mega-login "$MEGA_SESSION" >/dev/null 2>&1; then
    echo "MEGA login failed. Check MEGA_SESSION."
    exit 1
fi
if ! timeout 30 mega-whoami >/dev/null 2>&1; then
    echo "MEGA session verification failed."
    exit 1
fi
echo "Starting backend..."
exec java -XX:MaxRAMPercentage=60 -jar /app/app.jar
