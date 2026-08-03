#!/usr/bin/env bash

OS="$(uname -s)"
FAIL=0

pass() { echo "  OK   $1"; }
fail() { echo "  FAIL $1"; FAIL=1; }

check_cmd() {
    if command -v "$1" &>/dev/null; then
        pass "$1 ($(command -v "$1"))"
    else
        fail "$1 not found on PATH"
    fi
}

echo "== shell config =="

SHELL_RC="$HOME/.zshrc"

if [ -f "$SHELL_RC" ] && grep -Fq "source ~/.config/alias" "$SHELL_RC"; then
    pass "$SHELL_RC sources ~/.config/alias"
else
    fail "$SHELL_RC does not source ~/.config/alias"
fi

if [ -f "$HOME/.config/alias" ]; then
    pass "~/.config/alias present"
else
    fail "~/.config/alias missing"
fi

if [ -d "$HOME/.oh-my-zsh" ]; then
    pass "oh-my-zsh installed"
else
    fail "oh-my-zsh not installed"
fi

if grep -Fq 'ZSH_THEME="gentoo"' "$SHELL_RC" 2>/dev/null; then
    pass "ZSH_THEME set to gentoo"
else
    fail "ZSH_THEME not set to gentoo in $SHELL_RC"
fi

echo "== core tools =="
for c in git curl wget cmake tmux tig rg fd go; do
    check_cmd "$c"
done

echo "== language toolchains =="
check_cmd uv
check_cmd fnm
check_cmd node
check_cmd pnpm
check_cmd nvim

if command -v node &>/dev/null; then
    if node -e "process.exit(0)" &>/dev/null; then
        pass "node runs"
    else
        fail "node installed but failed to execute"
    fi
fi

if command -v uv &>/dev/null; then
    if uv python find &>/dev/null; then
        pass "uv has a default python"
    else
        fail "uv installed but no default python found"
    fi
fi

echo "== dev environment =="

if [ -d "$HOME/.config/nvim" ]; then
    pass "nvim config present"
else
    fail "nvim config (~/.config/nvim) missing"
fi

if git config --global --get alias.clone-for-worktrees &>/dev/null; then
    pass "git clone-for-worktrees alias configured"
else
    fail "git clone-for-worktrees alias missing"
fi

if [ -f "$HOME/.tmux.conf" ]; then
    pass "~/.tmux.conf present"
else
    fail "~/.tmux.conf missing"
fi

if command -v codegraph &>/dev/null; then
    pass "codegraph installed"
else
    fail "codegraph not found on PATH"
fi

echo "== containers =="
if [ "$OS" = "Darwin" ]; then
    if brew list --cask orbstack &>/dev/null; then
        pass "OrbStack installed"
    else
        fail "OrbStack not installed"
    fi
fi

if command -v docker &>/dev/null; then
    if docker info &>/dev/null; then
        pass "docker daemon reachable"
    else
        fail "docker installed but daemon not reachable (is OrbStack/Docker running?)"
    fi
else
    fail "docker not found on PATH"
fi

echo "=================="
if [ "$FAIL" -eq 0 ]; then
    echo "All checks passed."
else
    echo "Some checks failed, see above."
fi

exit $FAIL
