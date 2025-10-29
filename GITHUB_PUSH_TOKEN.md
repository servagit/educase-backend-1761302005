# How to Get GitHub Token for Pushing to Repository

This guide explains how to get authentication tokens to push code to your GitHub repository.

## Method 1: Personal Access Token (PAT) - Recommended

### Step 1: Generate Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Tokens (classic)** or **Fine-grained tokens**
3. Click **Generate new token** → **Generate new token (classic)**
4. Fill in the details:
   - **Note**: e.g., "Educase Backend Access"
   - **Expiration**: Choose duration (90 days, 1 year, or no expiration)
   - **Scopes**: Select at minimum:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (if using GitHub Actions)
5. Click **Generate token**
6. **IMPORTANT**: Copy the token immediately - it won't be shown again!
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Use Token to Push

#### Option A: Use Token in URL (One-time)
```bash
git push https://<TOKEN>@github.com/servagit/educase-backend.git main
```

#### Option B: Store Token in Git Credentials (Recommended)
```bash
# Store token in credential helper (macOS)
git config --global credential.helper osxkeychain

# When you push, Git will prompt for username and password
# Username: servagit
# Password: paste_your_token_here
```

#### Option C: Use Token in Remote URL
```bash
# Update remote URL to include token
git remote set-url origin https://<TOKEN>@github.com/servagit/educase-backend.git

# Now push normally
git push origin main
```

**⚠️ Warning**: Don't commit tokens to git! Use credential helper instead.

## Method 2: GitHub CLI (gh) - Easiest

### Step 1: Login with GitHub CLI
```bash
gh auth login
```

Follow the prompts:
- Choose **GitHub.com**
- Choose **HTTPS** protocol
- Authenticate via web browser
- Follow the link and enter the code shown

### Step 2: Verify Authentication
```bash
gh auth status
```

You should see:
```
✓ Logged in to github.com as servagit
```

### Step 3: Push Normally
```bash
git push origin main
```

The CLI handles authentication automatically!

## Method 3: SSH Keys (Most Secure for Long-term)

### Step 1: Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter to accept default location.

### Step 2: Add SSH Key to GitHub
```bash
# Copy your public key
cat ~/.ssh/id_ed25519.pub

# Copy the output, then:
```

1. Go to [GitHub Settings → SSH and GPG keys](https://github.com/settings/keys)
2. Click **New SSH key**
3. Paste your public key
4. Click **Add SSH key**

### Step 3: Change Remote URL to SSH
```bash
git remote set-url origin git@github.com:servagit/educase-backend.git
```

### Step 4: Test Connection
```bash
ssh -T git@github.com
```

You should see: `Hi servagit! You've successfully authenticated...`

### Step 5: Push
```bash
git push origin main
```

## Quick Setup Guide (Choose One)

### Option A: Quickest - GitHub CLI
```bash
gh auth login
git push origin main
```

### Option B: Personal Access Token
1. Generate token at: https://github.com/settings/tokens
2. Copy token
3. Use when Git prompts for password during push

### Option C: SSH (Best for long-term)
```bash
ssh-keygen -t ed25519 -C "your_email"
# Add public key to GitHub
git remote set-url origin git@github.com:servagit/educase-backend.git
git push origin main
```

## Troubleshooting

### "Permission denied" Error
- ✅ Verify you're logged in as `servagit` (not `vexperts-assemble`)
- ✅ Check token has `repo` scope
- ✅ Make sure token hasn't expired

### "Repository not found" Error
- ✅ Verify repository exists at `servagit/educase-backend`
- ✅ Check you have write access to the repository
- ✅ Try: `gh repo view servagit/educase-backend`

### Token Not Working
- ✅ Tokens must be used exactly as generated (no extra spaces)
- ✅ Make sure token hasn't expired
- ✅ Regenerate token if needed

### Check Current Remote
```bash
git remote -v
```

Should show:
```
origin  https://github.com/servagit/educase-backend.git (fetch)
origin  https://github.com/servagit/educase-backend.git (push)
```

## Security Best Practices

1. ✅ **Never commit tokens to git** - Use credential helpers
2. ✅ **Use fine-grained tokens** for specific repositories
3. ✅ **Set token expiration** dates
4. ✅ **Revoke unused tokens** regularly
5. ✅ **Use SSH keys** for long-term access
6. ✅ **Store tokens securely** (password manager, not plain text)

## Current Status Check

Check your current authentication:
```bash
# Check GitHub CLI login
gh auth status

# Check Git remote
git remote -v

# Check Git credentials
git config --global credential.helper
```

## Recommended: Use GitHub CLI

The easiest method is GitHub CLI - it handles everything automatically:
```bash
gh auth login
```

Then you can push normally without worrying about tokens!

