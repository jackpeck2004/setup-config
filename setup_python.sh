#!/usr/bin/env bash

echo "Installing/upgrading Python (uv)"

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    brew upgrade uv 2>/dev/null || brew install uv
else
    # curl install script handles updates automatically, and installs to
    # ~/.local/bin. That dir is only on PATH via the default bash skeleton
    # rc, not zsh (this repo standardizes on zsh) -- wire it explicitly.
    curl -LsSf https://astral.sh/uv/install.sh | sh

    if [ -f "$HOME/.zshrc" ] && ! grep -Fq '.local/bin' "$HOME/.zshrc"; then
        printf '\n%s\n' 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
    fi
fi

uv python install --default
