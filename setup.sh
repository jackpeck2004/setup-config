#!/usr/bin/env bash

if [ -r /etc/os-release ]; then
  . /etc/os-release
  if [ "$ID" = "ubuntu" ]; then
    echo "Ubuntu detected, automatically installing depenencies"
    sudo apt install gettext cmake curl wget git build-essential golang-go tmux -y
  elif [ "$ID" = "fedora" ]; then
    echo "Fedora detected, automatically installing depenencies"
    sudo dnf -y install gettext cmake curl git go tmux
    sudo dnf -y group install "C Development Tools and Libraries" "Development Tools"
  else
    echo "Unsupported distro: $ID"
    echo "Please install dependencies manually"
  fi
else
  echo "/etc/os-release not found"
fi

./setup_python.sh

./setup_node.sh
./install_pnpm.sh

./install_nvim.sh
./setup_nvim.sh

./setup_alias.sh
./setup_tmux.sh
./setup_git_worktrees.sh
