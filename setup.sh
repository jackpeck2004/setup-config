#!/usr/bin/env bash

sudo apt install curl wget git build-essential -y
./setup_node.sh
./install_pnpm.sh

./install_nvim.sh
./setup_nvim.sh
