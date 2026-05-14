# Mentha CLI Reference

Complete command-line interface documentation for the Mentha Answer Engine Optimization platform.

---

## Installation

```bash
pnpm add -g mentha-cli
# or
npx mentha
```

---

## Commands

### Projects

```bash
# List all projects
mentha projects list

# Create a new project (interactive)
mentha projects create

# Create project with arguments
mentha projects create --name "My Brand" --domain "https://example.com"

# Get project details
mentha projects get <projectId>

# Delete project
mentha projects delete <projectId>
```

### Scans

```bash
# Trigger a new scan run
mentha scans trigger

# Check scan status
mentha scans status

# List recent scan results
mentha scans list --limit 20

# Schedule recurring scans
mentha scans schedule --frequency daily
```

### Keywords

```bash
# List keywords for project
mentha keywords list

# Add new keywords
mentha keywords add --query "best AI tools"

# Update keyword settings
mentha keywords update <keywordId> --frequency weekly

# Remove keyword
mentha keywords remove <keywordId>
```

### Optimization

```bash
# Get AEO optimization recommendations
mentha optimization

# Generate AI-readable files (llms.txt, ai.txt, etc.)
mentha optimization files

# Download all AI-readable files as ZIP
mentha optimization files --zip
```

### Config

```bash
# Set API URL
mentha config set api-url https://api.mentha.ai

# Set auth token
mentha config set token <token>

# View current config
mentha config show

# Reset configuration
mentha config reset
```

### Onboarding

```bash
# Interactive onboarding wizard
mentha onboarding
```

---

## Global Options

| Option | Description |
|--------|-------------|
| `--help` | Show help |
| `--version` | Show version |
| `--json` | Output as JSON |
| `--quiet` | Suppress non-essential output |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MENTHA_API_URL` | API base URL |
| `MENTHA_API_KEY` | API authentication token |
