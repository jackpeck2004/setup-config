#!/usr/bin/env bash

BUILD_DIR="/tmp/nvim"
CONFIG_DIR="$HOME/.config/nvim"

if [ ! -d $BUILD_DIR ]; then
    git clone -b stable https://github.com/neovim/neovim $BUILD_DIR
else
    cd $BUILD_DIR
    git pull
fi

sudo apt install gettext cmake curl build-essential git

cd $BUILD_DIR
make CMAKE_BUILD_TYPE=RelWithDebInfo
sudo make install

