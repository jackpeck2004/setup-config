#!/usr/bin/env bash

CONFIG_DIR="$HOME/.config/nvim"

if [ ! -d $CONFIG_DIR ]; then
    git clone git@github.com:jackpeck2004/nvim $CONFIG_DIR
else 
    cwd=$(pwd)
    cd $CONFIG_DIR
    git pull
    cd $cwd
fi
