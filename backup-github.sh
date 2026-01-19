#!/bin/bash

# DrClean GitHub Backup Script
# Commits and pushes all changes to GitHub

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐙 DrClean GitHub Backup System${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo -e "${YELLOW}💡 Run 'git init' first${NC}"
    exit 1
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
    echo -e "${GREEN}✅ Repository is already up to date${NC}"
    exit 0
fi

# Show status
echo -e "${BLUE}📊 Current Status:${NC}"
git status --short
echo ""

# Get commit message from user or use default
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
if [ -z "$1" ]; then
    COMMIT_MSG="Backup: ${TIMESTAMP}"
    echo -e "${YELLOW}💬 Using default commit message${NC}"
else
    COMMIT_MSG="$1"
    echo -e "${YELLOW}💬 Using custom commit message${NC}"
fi

echo -e "Message: ${GREEN}\"${COMMIT_MSG}\"${NC}"
echo ""

# Add all changes
echo -e "${BLUE}📝 Staging changes...${NC}"
git add .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to stage changes${NC}"
    exit 1
fi

# Commit changes
echo -e "${BLUE}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to commit changes${NC}"
    exit 1
fi

# Get current branch
BRANCH=$(git branch --show-current)
echo -e "${BLUE}🌿 Current branch: ${GREEN}${BRANCH}${NC}"
echo ""

# Push to GitHub
echo -e "${BLUE}⬆️  Pushing to GitHub...${NC}"
git push origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully backed up to GitHub!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "🌿 Branch: ${GREEN}${BRANCH}${NC}"
    echo -e "📝 Commit: ${GREEN}${COMMIT_MSG}${NC}"
    echo -e "🔗 Repository: ${GREEN}$(git remote get-url origin)${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tip: View your backup at GitHub.com${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo -e "${YELLOW}💡 Check your internet connection and GitHub credentials${NC}"
    echo -e "${YELLOW}💡 You may need to run: git push --set-upstream origin ${BRANCH}${NC}"
    exit 1
fi
