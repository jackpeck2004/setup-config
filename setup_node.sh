#!/usr/bin/env bash

OS="$(uname -s)"
FNM_ENV_LINE='eval "$(fnm env --use-on-cd)"'

if [ "$OS" = "Darwin" ]; then
    brew upgrade fnm 2>/dev/null || brew install fnm

    # Add fnm to zshrc if not already present
    if ! grep -Fq "fnm env" "$HOME/.zshrc"; then
        echo "$FNM_ENV_LINE" >> "$HOME/.zshrc"
    fi

    # Source fnm for current session
    eval "$(fnm env --use-on-cd)"
else
    if ! [ -x "$(command -v fnm)" ]; then
        curl -fsSL https://fnm.vercel.app/install | bash
    else
        echo "fnm is already installed, updating"
        curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
    fi
    source "$HOME/.bashrc"
fi

fnm install --lts
fnm default lts-latest
