#!/usr/bin/env bash

curl -sL https://gist.githubusercontent.com/jackpeck2004/542c68823c13fd10ab9601623be1730d/raw/bf1281e9436fa5be4b71dbeb6f5a2cd34c48bf18/alias -o ~/.config/alias

echo "source ~/.config/alias" >> ~/.bashrc
