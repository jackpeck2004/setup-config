#!/usr/bin/env bash

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    brew upgrade pnpm 2>/dev/null || brew install pnpm
else
    # curl install script handles updates automatically
    curl -fsSL https://get.pnpm.io/install.sh | sh -
fi
