#!/bin/bash

# Configuration
PROJECT_NAME="DrClean_Backup_$(date +%Y%m%d_%H%M%S)"
OUTPUT_FILE="../${PROJECT_NAME}.zip"

echo "📦 Preparing to backup project: $(basename "$PWD")"
echo "🚀 Destination: $OUTPUT_FILE"

# List of files/folders to exclude
EXCLUDES=(
    "node_modules/*"
    "dist/*"
    ".git/*"
    "*.log"
    "*.zip"
)

# Create zip command
EXCLUDE_ARGS=()
for item in "${EXCLUDES[@]}"; do
    EXCLUDE_ARGS+=("-x" "$item")
done

# Execute zip
zip -r "$OUTPUT_FILE" . "${EXCLUDE_ARGS[@]}"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully at: $OUTPUT_FILE"
    echo "📄 Note: node_modules and dist were excluded to keep the file small."
else
    echo "❌ Backup failed. Please check your permissions or if 'zip' is installed."
fi
