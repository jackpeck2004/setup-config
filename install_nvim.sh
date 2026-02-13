#!/usr/bin/env bash

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
    echo "Installing Neovim via Homebrew..."
    brew install neovim
else
    # Linux: build from source
    BUILD_DIR="/tmp/nvim"

    if [ ! -d $BUILD_DIR ]; then
        git clone -b stable https://github.com/neovim/neovim $BUILD_DIR
    else
        cd $BUILD_DIR
        git pull
    fi

    cd $BUILD_DIR
    make CMAKE_BUILD_TYPE=RelWithDebInfo
    sudo make install
fi

