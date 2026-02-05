# Git History Cleanup

## ⚠️ Security Issue Found

Actual credential values were found in git history (commit `3ca7b65`):
- `AT_MAIN=Atza|gQBxC5RbAwEBAHaMYeSV0COrp...` (full token)
- `UBID_MAIN=134-9925906-3171060`

## ✅ Current Status

- ✅ **Current files are clean** - No credentials in working directory
- ⚠️ **Git history still contains credentials** - Need to clean

## 🔧 Solution Options

### Option 1: Fresh Repository (Recommended - Safest)

This creates a brand new repository with a single clean commit:

```bash
./scripts/fresh-repo-setup.sh
```

Then force push:
```bash
git push --force --all
```

**Pros:**
- Cleanest approach
- No risk of missing credentials
- Simple single commit history

**Cons:**
- Loses commit history (but you can keep it in backup)

### Option 2: Manual Filter-Branch (If you want to keep history)

If you want to preserve commit history, you can manually clean specific commits:

```bash
# Install git-filter-repo (recommended tool)
pip install git-filter-repo

# Remove credentials
git filter-repo --replace-text <(echo "Atza|gQBxC5RbAwEBAHaMYeSV0COrp==>REDACTED_AT_TOKEN")
git filter-repo --replace-text <(echo "134-9925906-3171060==>REDACTED_UBID")

# Force push
git push --force --all
```

## ⚠️ Important: After Cleanup

1. **Force push to GitHub** (if already pushed):
   ```bash
   git push --force --all
   git push --force --tags
   ```

2. **Notify collaborators** to re-clone the repository

3. **Rotate your Amazon credentials** - The exposed credentials should be considered compromised

4. **Verify cleanup**:
   ```bash
   git log --all --full-history -p | grep -E "Atza|gQBxC5RbAwEBAHaMYeSV0COrp|134-9925906-3171060"
   ```
   Should return no results.

## 🔒 Prevention

To prevent this in the future:

1. ✅ `.dev.vars` is already in `.gitignore`
2. ✅ `.env.example` only has placeholder values
3. ✅ Never commit actual credentials
4. ✅ Use `git-secrets` or similar tools to scan before commit

## 📝 Notes

- The backup branch `backup-before-cleanup` contains the original history
- You can delete it after verification: `git branch -D backup-before-cleanup`
- The `.git.backup` folder (if created) can be deleted after verification
