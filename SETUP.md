# Dev Environment Setup

Steps to get this project working on a new device.

## 1. Install tools
- [Node.js LTS](https://nodejs.org) (npm comes with it)
- [Git](https://git-scm.com/)
- [GitHub CLI](https://cli.github.com/) (`gh`) — optional, only needed for
  repo/PR operations from the command line

On Windows with `winget` available:

```powershell
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Git.Git
winget install -e --id GitHub.cli
```

## 2. Clone the repo

```bash
git clone https://github.com/Tripod110/reroute-planner.git
cd reroute-planner
```

## 3. Authenticate GitHub CLI (if using it)

```bash
gh auth login
```
Choose GitHub.com → HTTPS → login with a web browser.

## 4. Git identity (this repo only, not global)

```bash
git config user.name "Tripod110"
git config user.email "smasher8976@gmail.com"
```

## 5. Once the app is scaffolded (not yet — see STATUS.md)
Once `package.json` exists, the usual commands will apply:

```bash
npm install
npm run dev
```
