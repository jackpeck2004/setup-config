#!/usr/bin/env bash

# Detect OS
OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  echo "macOS detected, installing OrbStack"

  if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Please run setup.sh first."
    exit 1
  fi

  # Install OrbStack via Homebrew
  brew install --cask orbstack

  echo "OrbStack installed. Please open OrbStack from Applications to complete setup."

elif [ -r /etc/os-release ]; then
  . /etc/os-release
  if [ "$ID" = "ubuntu" ]; then
    sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc | cut -f1) -y
    sudo apt install ca-certificates
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  elif [ "$ID" = "fedora" ]; then
    sudo dnf remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-selinux \
                  docker-engine-selinux \
                  docker-engine
    sudo dnf config-manager addrepo --from-repofile https://download.docker.com/linux/fedora/docker-ce.repo
    sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  else
    echo "Unsupported distro: $ID"
    echo "Please install dependencies manually"
  fi

  # Linux-only: add user to docker group
  sudo groupadd docker
  sudo usermod -aG docker $USER
else
  echo "Unsupported OS: $OS"
  echo "Please install Docker manually"
fi
