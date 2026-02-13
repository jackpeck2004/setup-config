#!/usr/bin/env bash

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    brew install pnpm
else
    curl -fsSL https://get.pnpm.io/install.sh | sh -
fi
