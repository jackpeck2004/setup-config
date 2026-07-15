#!/usr/bin/env bash

OS="$(uname -s)"

if [ "$OS" != "Darwin" ]; then
    echo "Not macOS, skipping oh-my-zsh install"
    exit 0
fi

if [ -d "$HOME/.oh-my-zsh" ]; then
    echo "oh-my-zsh already present, skipping"
else
    echo "Installing oh-my-zsh..."
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi
