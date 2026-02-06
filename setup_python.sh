#!/usr/bin/env bash

echo "Installing Python (uv)"

# install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

uv python install --default
