#!/usr/bin/env bash

OS="$(uname -s)"

# Determine the correct shell rc file
if [ "$OS" = "Darwin" ]; then
    SHELL_RC="$HOME/.zshrc"
else
    SHELL_RC="$HOME/.bashrc"
fi

mkdir -p "$HOME/.config"

if [ -f "$HOME/.config/alias" ]; then
    echo "alias file already present, skipping"
else
    curl -sL https://gist.githubusercontent.com/jackpeck2004/542c68823c13fd10ab9601623be1730d/raw/bf1281e9436fa5be4b71dbeb6f5a2cd34c48bf18/alias -o "$HOME/.config/alias"
fi

if grep -Fq "source ~/.config/alias" "$SHELL_RC"; then
    echo "alias already configured"
else
    echo "source ~/.config/alias" >> "$SHELL_RC"
fi
