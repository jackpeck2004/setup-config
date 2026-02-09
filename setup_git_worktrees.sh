#!/usr/bin/env bash

curl -sL https://gist.githubusercontent.com/jackpeck2004/7d826ef82be2376fc3c1a7f5e9e5c02a/raw/b3fcb6f873b9308aa1c414233c945f96f8f0b001/git-clone-bare-for-worktrees.sh -o ~/.config/git-clone-bare-for-worktrees.sh

git config --global alias.clone-for-worktrees '!sh $HOME/.config/git-clone-bare-for-worktrees.sh'
git config --global push.autoSetupRemote true
git config --global init.defaultBranch main
git config --global core.autocrlf input
