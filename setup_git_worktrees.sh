#!/usr/bin/env bash

mkdir -p "$HOME/.config"

if [ -f "$HOME/.config/git-clone-bare-for-worktrees.sh" ]; then
    echo "git-clone-bare-for-worktrees.sh already present, skipping"
else
    curl -sL https://gist.githubusercontent.com/jackpeck2004/7d826ef82be2376fc3c1a7f5e9e5c02a/raw/b3fcb6f873b9308aa1c414233c945f96f8f0b001/git-clone-bare-for-worktrees.sh -o "$HOME/.config/git-clone-bare-for-worktrees.sh"
fi

if ! git config --global --get alias.clone-for-worktrees &>/dev/null; then
    git config --global alias.clone-for-worktrees '!sh $HOME/.config/git-clone-bare-for-worktrees.sh'
fi
if ! git config --global --get push.autoSetupRemote &>/dev/null; then
    git config --global push.autoSetupRemote true
fi
if ! git config --global --get init.defaultBranch &>/dev/null; then
    git config --global init.defaultBranch main
fi
if ! git config --global --get core.autocrlf &>/dev/null; then
    git config --global core.autocrlf input
fi
