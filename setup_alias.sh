#!/usr/bin/env bash

SHELL_RC="$HOME/.zshrc"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$HOME/.config"

# Symlink to the alias file in this repo so edits here apply everywhere.
if [ -L "$HOME/.config/alias" ] && [ "$(readlink "$HOME/.config/alias")" = "$REPO_DIR/alias" ]; then
    echo "alias already linked, skipping"
else
    if [ -e "$HOME/.config/alias" ] || [ -L "$HOME/.config/alias" ]; then
        echo "Backing up existing alias file to ~/.config/alias.bak"
        mv "$HOME/.config/alias" "$HOME/.config/alias.bak"
    fi
    ln -s "$REPO_DIR/alias" "$HOME/.config/alias"
fi

if grep -Fq "source ~/.config/alias" "$SHELL_RC"; then
    echo "alias already configured"
else
    echo "source ~/.config/alias" >> "$SHELL_RC"
fi
