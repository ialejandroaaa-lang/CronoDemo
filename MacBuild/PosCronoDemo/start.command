#!/bin/bash
cd "$(dirname "$0")"

# Grant permissions to main executable
chmod +x PosCrono.API

# Force custom port to match frontend config (if different from default)
export ASPNETCORE_URLS="http://localhost:5006"

# Open the default browser to the app
open "http://localhost:5006" &

# Run the app
./PosCrono.API
