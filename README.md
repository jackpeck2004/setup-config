# Dev setup

Scripts to set up a dev machine from scratch. Supports macOS, Ubuntu and Fedora.
Every script is idempotent, so re-running `setup.sh` is safe.

## What you get

| Script | Does |
| --- | --- |
| `setup.sh` | Entry point. Installs base packages, then runs everything below |
| `setup_zsh.sh` | oh-my-zsh with the `gentoo` theme |
| `setup_python.sh` | `uv` and a default Python |
| `setup_node.sh`, `install_pnpm.sh` | `fnm` and `pnpm` |
| `install_nvim.sh`, `setup_nvim.sh` | Neovim and the LazyVim config (cloned over SSH) |
| `setup_alias.sh` | Symlinks `~/.config/alias` to the `alias` file in this repo |
| `setup_tmux.sh` | `~/.tmux.conf` |
| `setup_git_worktrees.sh` | Bare-clone helper and git defaults |
| `setup_docker.sh` | OrbStack (macOS) or Docker Engine (Linux) |
| `setup_git_signing.sh` | 1Password SSH commit signing (macOS only) |
| `setup_macos.sh` | macOS defaults, Dock and tiling shortcuts (macOS only) |
| `check.sh` | Post-setup sanity checks |

## Before you start (all OSes)

`setup_nvim.sh` clones over SSH, so your SSH key must be usable **before** you run `setup.sh`.
The key and the SSH config both live in 1Password.

1. Install 1Password (OS-specific steps below) and sign in.
2. In 1Password, open **Settings > Developer** and turn on **Use the SSH agent**.
3. Restore your SSH config from 1Password to `~/.ssh/config`, then lock it down:
   ```bash
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   chmod 600 ~/.ssh/config
   ```
4. Check the agent works:
   ```bash
   ssh -T git@github.com
   ```
   You should see "Hi <user>! You've successfully authenticated".

This repo and the nvim repo are public, so the repo itself can be cloned over HTTPS.
That avoids needing SSH for the very first clone.

## macOS

1. **Check whether 1Password is already installed.** A company-managed Mac may get it from MDM
   (`ls /Applications/1Password.app`). If not, install it from <https://1password.com/downloads/mac/>
   or your IT self-service app. Do not add a Homebrew cask for it, as it clashes with an MDM install.
2. Install the Xcode Command Line Tools, which also provides `git`:
   ```bash
   xcode-select --install
   ```
3. Do the steps in "Before you start" above.
4. Clone and run:
   ```bash
   mkdir -p ~/.config
   git clone https://github.com/jackpeck2004/setup-config.git ~/.config/pkg
   cd ~/.config/pkg && ./setup.sh
   ```
   Run it from inside the repo, because the scripts call each other by relative path.
5. Open a new terminal so the shell, PATH and Dock changes apply.

On macOS `setup.sh` also:
- installs Homebrew if missing, then only the formulae and casks that are missing (nothing is upgraded);
- sets up git commit signing through 1Password and applies the macOS defaults.

Things to do by hand afterwards:
- Open Raycast and set your hotkeys and extensions by hand. Cloud Sync is a Pro feature and you are on the free plan, so there is nothing to restore automatically (a settings export, if you keep one, is not in this repo).
- Install the apps that are not in `setup.sh` (Claude, Discord, Notion, Tailscale, VS Code, Zoom and so on).
- Set your preferred keyboard layout (usually English International), sleep timers and Dock app order.
- If the Mac is MDM-managed, check that the `defaults` in `setup_macos.sh` stuck, since policies can override them.

## Ubuntu

1. Install git and curl, and 1Password from its `.deb`
   (<https://1password.com/downloads/linux/>):
   ```bash
   sudo apt update && sudo apt install -y git curl
   ```
2. Do the steps in "Before you start" above. On Linux the 1Password agent socket is
   `~/.1password/agent.sock`, so the `IdentityAgent` line in your SSH config must point there,
   not at the macOS `Group Containers` path.
3. Clone and run:
   ```bash
   mkdir -p ~/.config
   git clone https://github.com/jackpeck2004/setup-config.git ~/.config/pkg
   cd ~/.config/pkg && ./setup.sh
   ```
4. Make zsh your login shell, then log out and back in. This also applies the new `docker` group membership:
   ```bash
   chsh -s "$(command -v zsh)"
   ```

## Fedora

Same as Ubuntu, with these differences:

1. Install git and curl with `sudo dnf install -y git curl`, and 1Password from its `.rpm`
   (<https://1password.com/downloads/linux/>).
2. Steps 2 to 4 are identical to Ubuntu.

## After setup

`check.sh` runs at the end of `setup.sh` and reports anything missing. To re-run it on its own:

```bash
./check.sh
```

Git commit signing and the macOS defaults are skipped on Linux, by design.
