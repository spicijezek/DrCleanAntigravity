# 🚀 Quick Backup Commands

## Most Common Commands

### Complete Backup (Recommended)
```bash
./backup-all.sh "Your description here"
```
Creates both local ZIP and GitHub backup.

### Local Backup Only
```bash
./backup-local.sh
```
Creates ZIP file in `~/DrClean_Backups/`

### GitHub Backup Only
```bash
./backup-github.sh "Your commit message"
```
Commits and pushes to GitHub.

---

## 📍 Backup Locations

- **Local backups:** `~/DrClean_Backups/DrClean_Backup_YYYYMMDD_HHMMSS.zip`
- **GitHub:** https://github.com/spicijezek/DrCleanAntigravity.git

---

## 🔄 Quick Restore

### From Local Backup
```bash
cd ~/Projects/
unzip ~/DrClean_Backups/DrClean_Backup_YYYYMMDD_HHMMSS.zip -d DrClean_Restored
cd DrClean_Restored
npm install
# Copy your .env file
npm run dev
```

### From GitHub
```bash
git clone https://github.com/spicijezek/DrCleanAntigravity.git DrClean_Restored
cd DrClean_Restored
npm install
# Copy your .env file
npm run dev
```

---

**📖 For detailed documentation, see [BACKUP_GUIDE.md](./BACKUP_GUIDE.md)**
