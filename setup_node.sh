#!/usr/bin/env bash

if ! [ -x "$(command -v fnm)" ]; then
    curl -fsSL https://fnm.vercel.app/install | bash
else
    echo "fnm is already installed, updating"
    curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell
fi

source "$HOME/.bashrc"

fnm install --lts

fnm default lts-latest
