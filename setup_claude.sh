#!/usr/bin/env bash

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
SETTINGS="$CLAUDE_DIR/settings.json"

mkdir -p "$CLAUDE_DIR/mods"

# Symlink $1 to the repo file $2, backing up whatever was there before.
link() {
    local target="$1" source="$2"
    if [ -L "$target" ] && [ "$(readlink "$target")" = "$source" ]; then
        echo "$target already linked, skipping"
        return
    fi
    if [ -e "$target" ] || [ -L "$target" ]; then
        echo "Backing up existing $target to $target.bak"
        rm -rf "$target.bak"
        mv "$target" "$target.bak"
    fi
    ln -s "$source" "$target"
}

# Each mod is symlinked so edits in this repo apply to Claude straight away.
PLUGIN_DIRS=""
for mod in "$REPO_DIR"/claude/mods/*/; do
    name="$(basename "$mod")"
    link "$CLAUDE_DIR/mods/$name" "$REPO_DIR/claude/mods/$name"
    PLUGIN_DIRS="${PLUGIN_DIRS:+$PLUGIN_DIRS:}~/.claude/mods/$name"
done

link "$CLAUDE_DIR/keybindings.json" "$REPO_DIR/claude/keybindings.json"

# Claude also writes to settings.json, so only merge in the plugin dirs.
if ! command -v jq &>/dev/null; then
    echo "jq not found, set env.CLAUDE_CODE_PLUGIN_DIRS to $PLUGIN_DIRS in $SETTINGS by hand"
    exit 1
fi
[ -s "$SETTINGS" ] || echo '{}' > "$SETTINGS"
if [ "$(jq -r '.env.CLAUDE_CODE_PLUGIN_DIRS // ""' "$SETTINGS")" = "$PLUGIN_DIRS" ]; then
    echo "CLAUDE_CODE_PLUGIN_DIRS already set, skipping"
else
    tmp="$(mktemp)"
    jq --arg dirs "$PLUGIN_DIRS" '.env.CLAUDE_CODE_PLUGIN_DIRS = $dirs' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
fi
