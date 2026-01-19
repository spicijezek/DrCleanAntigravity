# 📦 DrClean Backup & Restoration Guide

This guide explains how to backup and restore your DrClean project using the automated backup scripts.

## 🎯 Quick Start

### Create a Complete Backup (Recommended)
```bash
# Both local ZIP and GitHub backup
./backup-all.sh "Your commit message here"
```

### Create Local Backup Only
```bash
# Creates a ZIP file in ~/DrClean_Backups/
./backup-local.sh
```

### Create GitHub Backup Only
```bash
# Commits and pushes to GitHub
./backup-github.sh "Your commit message here"
```

---

## 📋 Backup Methods

### 1. Local PC Backup (`backup-local.sh`)

**What it does:**
- Creates a timestamped ZIP file
- Stores it in `~/DrClean_Backups/`
- Excludes `node_modules`, `dist`, and other unnecessary files
- Automatically keeps only the last 10 backups

**Usage:**
```bash
./backup-local.sh
```

**Output location:**
```
~/DrClean_Backups/DrClean_Backup_YYYYMMDD_HHMMSS.zip
```

**Advantages:**
- ✅ Works offline
- ✅ Fast and simple
- ✅ Complete snapshot of your project
- ✅ Easy to share via USB, email, etc.

**When to use:**
- Before major changes
- Before updating dependencies
- For offline storage
- To share with team members

---

### 2. GitHub Backup (`backup-github.sh`)

**What it does:**
- Commits all changes to Git
- Pushes to your GitHub repository
- Creates a version history

**Usage:**
```bash
# With custom message
./backup-github.sh "Added new feature X"

# With default timestamp message
./backup-github.sh
```

**Advantages:**
- ✅ Version control
- ✅ Accessible from anywhere
- ✅ Collaboration-friendly
- ✅ Free cloud storage

**When to use:**
- After completing features
- End of work session
- Before switching branches
- For team collaboration

---

### 3. Complete Backup (`backup-all.sh`)

**What it does:**
- Runs both local and GitHub backups
- Provides comprehensive protection

**Usage:**
```bash
# With custom message
./backup-all.sh "Major update completed"

# With default message
./backup-all.sh
```

**When to use:**
- Before major updates
- End of important work sessions
- Before deployment
- Maximum safety needed

---

## 🔧 First Time Setup

### Make Scripts Executable
```bash
chmod +x backup-local.sh
chmod +x backup-github.sh
chmod +x backup-all.sh
```

### Verify GitHub Connection
```bash
git remote -v
```

You should see:
```
origin  https://github.com/spicijezek/DrCleanAntigravity.git (fetch)
origin  https://github.com/spicijezek/DrCleanAntigravity.git (push)
```

---

## 🔄 Restoration Guide

### Restore from Local Backup

1. **Locate your backup:**
   ```bash
   ls ~/DrClean_Backups/
   ```

2. **Extract the backup:**
   ```bash
   # Navigate to where you want to restore
   cd ~/Projects/
   
   # Unzip the backup
   unzip ~/DrClean_Backups/DrClean_Backup_YYYYMMDD_HHMMSS.zip -d DrClean_Restored
   ```

3. **Install dependencies:**
   ```bash
   cd DrClean_Restored
   npm install
   ```

4. **Restore environment variables:**
   - Copy your `.env` file from a secure location
   - Or recreate it with your Supabase credentials

5. **Start the project:**
   ```bash
   npm run dev
   ```

### Restore from GitHub

1. **Clone the repository:**
   ```bash
   git clone https://github.com/spicijezek/DrCleanAntigravity.git DrClean_Restored
   cd DrClean_Restored
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Restore environment variables:**
   - Copy your `.env` file from a secure location
   - Or recreate it with your Supabase credentials

4. **Start the project:**
   ```bash
   npm run dev
   ```

### Restore Specific Version from GitHub

1. **View available commits:**
   ```bash
   git log --oneline
   ```

2. **Checkout specific commit:**
   ```bash
   git checkout <commit-hash>
   ```

3. **Or create a new branch from that point:**
   ```bash
   git checkout -b restored-version <commit-hash>
   ```

---

## 📁 What Gets Backed Up?

### ✅ Included:
- Source code (`src/`)
- Configuration files
- Supabase migrations
- Documentation
- Package files (`package.json`, `package-lock.json`)
- Public assets

### ❌ Excluded (Local Backup):
- `node_modules/` (too large, can be reinstalled)
- `dist/` (build output, can be regenerated)
- `.git/` (version control data)
- Log files
- Temporary files
- Old backup folders

### ⚠️ Never Committed to GitHub:
- `.env` files (contains secrets!)
- `node_modules/`
- Build outputs
- Backup ZIP files

---

## 🔐 Important Security Notes

### Environment Variables (.env)

**⚠️ CRITICAL:** Your `.env` file contains sensitive information and is **NOT** included in GitHub backups.

**To backup .env safely:**

1. **Manual backup (recommended):**
   ```bash
   # Copy to a secure location
   cp .env ~/Secure_Backups/drclean-env-backup.txt
   ```

2. **Use a password manager:**
   - Store your Supabase credentials in 1Password, LastPass, etc.

3. **Never commit to GitHub:**
   - The `.gitignore` file prevents this
   - Always verify before pushing

---

## 📅 Recommended Backup Schedule

### Daily
```bash
# At end of work session
./backup-github.sh "End of day - [brief description]"
```

### Weekly
```bash
# Complete backup every Friday
./backup-all.sh "Weekly backup - Week of [date]"
```

### Before Major Changes
```bash
# Before big updates
./backup-all.sh "Pre-update backup - [feature name]"
```

---

## 🆘 Troubleshooting

### "Permission denied" when running scripts
```bash
chmod +x backup-*.sh
```

### "Not a git repository"
```bash
git init
git remote add origin https://github.com/spicijezek/DrCleanAntigravity.git
```

### GitHub push fails
```bash
# Check your credentials
git config user.name
git config user.email

# Set if needed
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### "zip: command not found"
```bash
# Install zip on macOS
brew install zip
```

### Backup folder is full
The local backup script automatically keeps only the last 10 backups. To manually clean:
```bash
cd ~/DrClean_Backups/
ls -lt  # View all backups
rm DrClean_Backup_YYYYMMDD_HHMMSS.zip  # Delete specific backup
```

---

## 💡 Best Practices

1. **Backup before major changes** - Always create a backup before:
   - Updating dependencies
   - Refactoring large sections
   - Changing database schema
   - Deploying to production

2. **Use meaningful commit messages** - Makes it easier to find specific versions:
   ```bash
   ./backup-github.sh "Added user authentication feature"
   ```

3. **Keep .env secure** - Never commit, always backup separately

4. **Test your backups** - Periodically verify you can restore from backups

5. **Multiple backup locations** - Use both local and GitHub for redundancy

6. **Document changes** - Update `CHANGES_LOG_ANTIGRAVITY.md` for major updates

---

## 📞 Quick Reference

| Command | Purpose | Output |
|---------|---------|--------|
| `./backup-local.sh` | Local ZIP backup | `~/DrClean_Backups/*.zip` |
| `./backup-github.sh "msg"` | GitHub backup | GitHub repository |
| `./backup-all.sh "msg"` | Both backups | Both locations |
| `git log --oneline` | View commit history | Terminal |
| `git status` | Check current changes | Terminal |

---

## 🎓 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Project README](./README.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Remember:** A backup is only good if you can restore from it. Test your backups regularly! 🛡️
