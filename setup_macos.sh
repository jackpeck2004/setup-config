#!/usr/bin/env bash

# macOS system preferences (macOS only).
if [ "$(uname -s)" != "Darwin" ]; then
    echo "Not macOS, skipping macOS defaults"
    exit 0
fi

echo "Applying macOS defaults..."

# Dock: no autohide delay, fast animation, tile size
defaults write com.apple.dock autohide-delay -float 0
defaults write com.apple.dock autohide-time-modifier -float 0.15
defaults write com.apple.dock tilesize -int 58

# Screenshots go to the clipboard
defaults write com.apple.screencapture target -string "clipboard"

# Tiled windows touch each other, no margins
defaults write com.apple.WindowManager EnableTiledWindowMargins -bool false

# Prefer tabs over new windows when opening documents
defaults write NSGlobalDomain AppleWindowTabbingMode -string "always"

# Appearance follows time of day
defaults write NSGlobalDomain AppleInterfaceStyleSwitchesAutomatically -bool true

# Window tiling shortcuts (System Settings > Keyboard > Keyboard Shortcuts).
# Modifier masks: ctrl=262144, opt=524288, fn/arrow flag=8388608.
# Arrow key parameters are (65535, keycode, mask).
set_hotkey() {
    local id="$1" ascii="$2" keycode="$3" mask="$4"
    defaults write com.apple.symbolichotkeys AppleSymbolicHotKeys -dict-add "$id" \
        "<dict><key>enabled</key><true/><key>value</key><dict><key>type</key><string>standard</string><key>parameters</key><array><integer>$ascii</integer><integer>$keycode</integer><integer>$mask</integer></array></dict></dict>"
}

set_hotkey 237 102   3  786432   # ctrl+opt+F
set_hotkey 238  99   8 8650752   # ctrl+C
set_hotkey 239 114  15 8650752   # ctrl+R
set_hotkey 240 65535 123 9175040 # ctrl+opt+Left
set_hotkey 241 65535 124 9175040 # ctrl+opt+Right
set_hotkey 242 65535 126 9175040 # ctrl+opt+Up
set_hotkey 243 65535 125 9175040 # ctrl+opt+Down

/System/Library/PrivateFrameworks/SystemAdministration.framework/Resources/activateSettings -u &>/dev/null || true

killall Dock SystemUIServer &>/dev/null || true

echo "macOS defaults applied."
