#!/usr/bin/env bash

# Commit signing through the 1Password SSH agent (macOS only).
if [ "$(uname -s)" != "Darwin" ]; then
    echo "Not macOS, skipping git signing setup"
    exit 0
fi

OP_SIGN="/Applications/1Password.app/Contents/MacOS/op-ssh-sign"

if [ ! -x "$OP_SIGN" ]; then
    echo "1Password not found at /Applications, install it first. Skipping git signing setup"
    exit 0
fi

git config --global gpg.format ssh
git config --global gpg.ssh.program "$OP_SIGN"
git config --global commit.gpgsign true
git config --global user.signingkey "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOcgLvFiVyLV0Iw/bZwAGYsboXaoZ/XaZplb4LxdreMP"

echo "Git signing configured. Make sure the SSH agent is enabled in 1Password > Settings > Developer."
