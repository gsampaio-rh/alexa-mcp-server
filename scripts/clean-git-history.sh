#!/bin/bash
# Clean git history of sensitive credential values
# WARNING: This rewrites git history!

set -e

echo "🔒 Git History Cleanup"
echo "======================"
echo ""
echo "⚠️  WARNING: This will rewrite ALL git history!"
echo "⚠️  If you've already pushed to GitHub, you'll need to force push."
echo ""

# Credential values found in history (REDACTED - these were real values that need to be removed)
# Replace these with the actual values you find in your git history
AT_TOKEN="REDACTED_AT_TOKEN_PATTERN"
UBID_VALUE="REDACTED_UBID_PATTERN"

echo "Found credentials in commit history. Cleaning..."
echo ""

# Backup current state
echo "📦 Creating backup..."
git branch backup-before-cleanup 2>/dev/null || true

# Remove credentials from all commits using filter-branch
echo "🧹 Cleaning history..."

# Replace AT_MAIN token in all files
git filter-branch --force --tree-filter \
    "find . -type f \( -name '*.md' -o -name '*.txt' -o -name '*.sh' \) ! -path './.git/*' -exec sed -i '' 's|${AT_TOKEN}|REDACTED_AT_TOKEN|g' {} + 2>/dev/null || true" \
    --prune-empty --tag-name-filter cat -- --all

# Replace UBID value in all files
git filter-branch --force --tree-filter \
    "find . -type f \( -name '*.md' -o -name '*.txt' -o -name '*.sh' \) ! -path './.git/*' -exec sed -i '' 's|${UBID_VALUE}|REDACTED_UBID|g' {} + 2>/dev/null || true" \
    --prune-empty --tag-name-filter cat -- --all

# Clean up backup refs
echo "🧹 Cleaning up backup refs..."
git for-each-ref --format='%(refname)' refs/original/ | xargs -n 1 git update-ref -d 2>/dev/null || true

# Expire reflog and garbage collect
echo "🗑️  Expiring reflog and garbage collecting..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "📋 Verification:"
git log --all --full-history -p | grep -i "REDACTED" | head -5 || echo "No REDACTED values found (good!)"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Verify cleanup: git log --all --full-history -p | grep -E '${AT_TOKEN:0:30}|${UBID_VALUE}'"
echo "2. If you've pushed to GitHub, force push: git push --force --all"
echo "3. Notify collaborators to re-clone"
echo ""
echo "💡 Backup branch created: backup-before-cleanup (you can delete it later)"
