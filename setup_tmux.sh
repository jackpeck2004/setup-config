#!/usr/bin/env bash

if [ -f "$HOME/.tmux.conf" ]; then
    echo "tmux.conf already present, skipping"
else
    curl -sL https://gist.githubusercontent.com/jackpeck2004/5c99b4d4bc6048d56fe66ce559d76a47/raw/f031a1d367715e89157b1eb954965e6f9b925a0f/tmux-conf -o "$HOME/.tmux.conf"
fi
