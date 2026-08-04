#!/usr/bin/env bash

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    brew upgrade fnm 2>/dev/null || brew install fnm
    # Homebrew's bin dir is already on PATH, so just the eval line is enough.
    FNM_ZSHRC_BLOCK='eval "$(fnm env --use-on-cd)"'
else
    # --skip-shell: we manage the zshrc wiring ourselves below rather than
    # relying on the installer's shell auto-detection (this repo standardizes
    # on zsh, but $SHELL may still say bash at install time, e.g. right after
    # oh-my-zsh runs).
    if ! [ -x "$(command -v fnm)" ]; then
        curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
    else
        echo "fnm is already installed, updating"
        curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
    fi

    # Put the freshly installed fnm on PATH for the rest of this script.
    export PATH="$HOME/.local/share/fnm:$PATH"

    # fnm's install dir isn't on PATH by default, so the eval line alone
    # would fail with "fnm: command not found" -- export PATH first.
    FNM_ZSHRC_BLOCK='export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env --use-on-cd)"'
fi

# Add fnm to zshrc if not already present
if [ -f "$HOME/.zshrc" ] && ! grep -Fq "fnm env" "$HOME/.zshrc"; then
    printf '\n%s\n' "$FNM_ZSHRC_BLOCK" >> "$HOME/.zshrc"
fi

# Source fnm for current session
eval "$(fnm env --use-on-cd)"

fnm install --lts
fnm default lts-latest

# Install/update codegraph globally for graph tooling.
npm install --global @colbymchenry/codegraph

# Install/update caveman skill set globally (safe to re-run).
npx -y skills add JuliusBrussee/caveman --skill '*' -g -y
