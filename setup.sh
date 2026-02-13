#!/usr/bin/env bash

# Detect OS
OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  echo "macOS detected, setting up with Homebrew"

  # Install Homebrew if not present
  if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon Macs
    if [ -f /opt/homebrew/bin/brew ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
  else
    echo "Homebrew already installed"
  fi

  # Install Xcode Command Line Tools if not present
  if ! xcode-select -p &> /dev/null; then
    echo "Installing Xcode Command Line Tools..."
    xcode-select --install
    echo "Please complete the Xcode CLT installation and re-run this script"
    exit 1
  fi

  # Install or upgrade dependencies via Homebrew
  echo "Installing/upgrading dependencies via Homebrew..."
  PACKAGES="gettext cmake curl wget git go tmux tig"
  for pkg in $PACKAGES; do
    brew upgrade $pkg 2>/dev/null || brew install $pkg
  done

  # Install or upgrade macOS apps via Homebrew casks
  echo "Installing/upgrading macOS apps..."
  CASKS="ghostty raycast rectangle"
  for cask in $CASKS; do
    brew upgrade --cask $cask 2>/dev/null || brew install --cask $cask
  done

elif [ -r /etc/os-release ]; then
  . /etc/os-release
  if [ "$ID" = "ubuntu" ]; then
    echo "Ubuntu detected, automatically installing/upgrading dependencies"
    sudo apt update
    sudo apt install --upgrade gettext cmake curl wget git build-essential golang-go tmux tig -y
  elif [ "$ID" = "fedora" ]; then
    echo "Fedora detected, automatically installing/upgrading dependencies"
    sudo dnf -y upgrade gettext cmake curl git go tmux tig
    sudo dnf -y install gettext cmake curl git go tmux tig
    sudo dnf -y group install "C Development Tools and Libraries" "Development Tools"
  else
    echo "Unsupported distro: $ID"
    echo "Please install dependencies manually"
  fi
else
  echo "Unsupported OS: $OS"
  echo "Please install dependencies manually"
fi

./setup_python.sh

./setup_node.sh
./install_pnpm.sh

./install_nvim.sh
./setup_nvim.sh

./setup_alias.sh
./setup_tmux.sh
./setup_git_worktrees.sh
./setup_docker.sh
