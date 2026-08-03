#!/usr/bin/env bash

if [ -d "$HOME/.oh-my-zsh" ]; then
    echo "oh-my-zsh already present, skipping"
else
    echo "Installing oh-my-zsh..."
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

if [ -f "$HOME/.zshrc" ]; then
    if [ "$(uname -s)" = "Darwin" ]; then
        sed -i '' 's/^ZSH_THEME=.*/ZSH_THEME="gentoo"/' "$HOME/.zshrc"
    else
        sed -i 's/^ZSH_THEME=.*/ZSH_THEME="gentoo"/' "$HOME/.zshrc"
    fi
fi
