#!/bin/bash

# DrClean Complete Backup Script
# Performs both local and GitHub backups

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 DrClean Complete Backup System${NC}"
echo -e "${PURPLE}===================================${NC}"
echo ""
echo -e "${BLUE}This will create both:${NC}"
echo -e "  1️⃣  Local backup (ZIP file)"
echo -e "  2️⃣  GitHub backup (Git push)"
echo ""

# Get commit message if provided
COMMIT_MSG="$1"

# Step 1: Local Backup
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}Step 1: Creating Local Backup${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

./backup-local.sh
LOCAL_STATUS=$?

echo ""
echo ""

# Step 2: GitHub Backup
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}Step 2: Creating GitHub Backup${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -z "$COMMIT_MSG" ]; then
    ./backup-github.sh
else
    ./backup-github.sh "$COMMIT_MSG"
fi
GITHUB_STATUS=$?

echo ""
echo ""

# Summary
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}📊 Backup Summary${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $LOCAL_STATUS -eq 0 ]; then
    echo -e "💾 Local Backup:  ${GREEN}✅ Success${NC}"
else
    echo -e "💾 Local Backup:  ${RED}❌ Failed${NC}"
fi

if [ $GITHUB_STATUS -eq 0 ]; then
    echo -e "🐙 GitHub Backup: ${GREEN}✅ Success${NC}"
else
    echo -e "🐙 GitHub Backup: ${RED}❌ Failed${NC}"
fi

echo ""

if [ $LOCAL_STATUS -eq 0 ] && [ $GITHUB_STATUS -eq 0 ]; then
    echo -e "${GREEN}🎉 All backups completed successfully!${NC}"
    exit 0
elif [ $LOCAL_STATUS -eq 0 ] || [ $GITHUB_STATUS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Some backups completed, but there were errors${NC}"
    exit 1
else
    echo -e "${RED}❌ All backups failed${NC}"
    exit 1
fi
