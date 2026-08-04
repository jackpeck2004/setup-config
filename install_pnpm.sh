#!/usr/bin/env bash

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    brew upgrade pnpm 2>/dev/null || brew install pnpm
else
    # curl install script handles updates automatically. It tries to wire
    # PNPM_HOME into a shell rc file itself, but its shell detection isn't
    # reliable here (this repo standardizes on zsh) -- ensure ~/.zshrc is
    # wired explicitly rather than trust it landed in the right file.
    curl -fsSL https://get.pnpm.io/install.sh | sh -

    if [ -f "$HOME/.zshrc" ] && ! grep -Fq "PNPM_HOME" "$HOME/.zshrc"; then
        printf '\n%s\n' '# pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac' >> "$HOME/.zshrc"
    fi
fi
