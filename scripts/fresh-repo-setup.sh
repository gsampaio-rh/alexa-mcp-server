#!/bin/bash
# Create a fresh repository with clean history
# This is the safest way to remove credentials from history

set -e

echo "🔄 Creating Fresh Repository"
echo "=============================="
echo ""
echo "This will:"
echo "1. Create a fresh git repository"
echo "2. Add all current files (which are clean)"
echo "3. Create a single initial commit"
echo "4. Set up the remote"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Get remote URL
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

# Backup current .git
echo "📦 Backing up current .git..."
mv .git .git.backup

# Initialize fresh repo
echo "🆕 Initializing fresh repository..."
git init
git branch -M main

# Add all files
echo "📝 Adding files..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Alexa MCP Server

- Model Context Protocol server for Amazon Alexa devices
- Music playback control
- Smart home device control
- Voice announcements
- Sensor monitoring
- Complete API and MCP tool support"

# Set up remote if it existed
if [ -n "$REMOTE_URL" ]; then
    echo "🔗 Setting up remote..."
    git remote add origin "$REMOTE_URL"
    echo ""
    echo "⚠️  IMPORTANT: You'll need to force push:"
    echo "   git push --force --all"
fi

echo ""
echo "✅ Fresh repository created!"
echo ""
echo "📋 Next steps:"
echo "1. Verify: git log"
echo "2. If you had a remote, force push: git push --force --all"
echo "3. Delete backup: rm -rf .git.backup (after verification)"
