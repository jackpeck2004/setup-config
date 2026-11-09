#!/usr/bin/env bash

SHELL_RC="$HOME/.zshrc"
OS="$(uname -s)"
PROMPT_DB_DIR="$HOME/.config/pdb"

mkdir -p "$HOME/.config"

if [ ! -d "$PROMPT_DB_DIR" ]; then
    git clone git@github.com:jackpeck2004/prompt-db.git "$PROMPT_DB_DIR"
else
    echo "prompt-db already cloned, skipping"
fi

# gum is not packaged for Ubuntu/Fedora, install it with go on Linux.
if [ "$OS" != "Darwin" ]; then
    if command -v gum &>/dev/null || [ -x "$HOME/go/bin/gum" ]; then
        echo "gum already installed, skipping"
    else
        echo "Installing gum via go install..."
        go install github.com/charmbracelet/gum@latest
    fi

    export PATH="$PATH:$HOME/go/bin"

    if grep -Fq 'export PATH="$PATH:$HOME/go/bin"' "$SHELL_RC" 2>/dev/null; then
        echo "go bin already on PATH in $SHELL_RC"
    else
        echo 'export PATH="$PATH:$HOME/go/bin"' >> "$SHELL_RC"
    fi
fi

mkdir -p "$HOME/.local/bin"

# Symlink pdb into ~/.local/bin so it wins over any distro-shipped python pdb.
if [ -L "$HOME/.local/bin/pdb" ] && [ "$(readlink "$HOME/.local/bin/pdb")" = "$PROMPT_DB_DIR/bin/pdb" ]; then
    echo "pdb already linked, skipping"
else
    if [ -e "$HOME/.local/bin/pdb" ] || [ -L "$HOME/.local/bin/pdb" ]; then
        echo "Backing up existing pdb to ~/.local/bin/pdb.bak"
        mv "$HOME/.local/bin/pdb" "$HOME/.local/bin/pdb.bak"
    fi
    ln -s "$PROMPT_DB_DIR/bin/pdb" "$HOME/.local/bin/pdb"
fi

if grep -Fq 'export PATH="$HOME/.local/bin:$PATH"' "$SHELL_RC" 2>/dev/null; then
    echo "~/.local/bin already on PATH"
else
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
fi
