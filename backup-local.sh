#!/bin/bash

# DrClean Local Backup Script
# Creates timestamped backups on your PC

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_NAME="DrClean_Backup_${TIMESTAMP}"
BACKUP_DIR="${HOME}/DrClean_Backups"
OUTPUT_FILE="${BACKUP_DIR}/${PROJECT_NAME}.zip"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 DrClean Local Backup System${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "Project: ${GREEN}$(basename "$PWD")${NC}"
echo -e "Timestamp: ${GREEN}${TIMESTAMP}${NC}"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating backup directory: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

echo -e "Destination: ${GREEN}${OUTPUT_FILE}${NC}"
echo ""

# Files and folders to exclude
EXCLUDES=(
    "node_modules/*"
    "dist/*"
    "dist-ssr/*"
    ".git/*"
    "*.log"
    "*.zip"
    "*.tar.gz"
    ".DS_Store"
    "temp_restore/*"
    "temp_restore_2/*"
    "DrClean_Backup_*/*"
)

echo -e "${BLUE}🚫 Excluding:${NC}"
for item in "${EXCLUDES[@]}"; do
    echo -e "   - $item"
done
echo ""

# Build exclude arguments
EXCLUDE_ARGS=()
for item in "${EXCLUDES[@]}"; do
    EXCLUDE_ARGS+=("-x" "$item")
done

# Create the backup
echo -e "${BLUE}⏳ Creating backup...${NC}"
zip -r -q "$OUTPUT_FILE" . "${EXCLUDE_ARGS[@]}"

if [ $? -eq 0 ]; then
    # Get file size
    SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    
    echo ""
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "📄 File: ${GREEN}${PROJECT_NAME}.zip${NC}"
    echo -e "📍 Location: ${GREEN}${BACKUP_DIR}${NC}"
    echo -e "💾 Size: ${GREEN}${SIZE}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tip: To restore, simply unzip the file${NC}"
    echo -e "${YELLOW}   Then run: npm install${NC}"
    
    # Clean up old backups (keep last 10)
    echo ""
    echo -e "${BLUE}🧹 Cleaning up old backups (keeping last 10)...${NC}"
    cd "$BACKUP_DIR"
    ls -t DrClean_Backup_*.zip 2>/dev/null | tail -n +11 | xargs -I {} rm -- {} 2>/dev/null
    BACKUP_COUNT=$(ls -1 DrClean_Backup_*.zip 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}📊 Total backups: ${BACKUP_COUNT}${NC}"
else
    echo ""
    echo -e "${RED}❌ Backup failed!${NC}"
    echo -e "${RED}Please check your permissions or if 'zip' is installed.${NC}"
    exit 1
fi
