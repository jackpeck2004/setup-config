#!/usr/bin/env bash

echo "Installing/upgrading Python (uv)"

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    brew upgrade uv 2>/dev/null || brew install uv
else
    # curl install script handles updates automatically
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi

uv python install --default
