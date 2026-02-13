#!/usr/bin/env bash

echo "Installing Python (uv)"

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    brew install uv
else
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi

uv python install --default
