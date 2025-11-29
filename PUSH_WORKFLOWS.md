# How to Push Workflow Files

## The Issue

GitHub is blocking the push because your Personal Access Token doesn't have the `workflow` scope needed to create/update GitHub Actions workflows.

## Quick Fix

### Step 1: Update Your Token

1. **Go to GitHub Token Settings:**
   ```
   https://github.com/settings/tokens
   ```

2. **Find your token** (the one starting with `ghp_...`)

3. **Click "Edit" or create a new token**

4. **Check these scopes:**
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows) ← **This is the key one!**

5. **Generate/Update the token**

6. **Copy the new token**

### Step 2: Update Your Git Credentials

**Option A: Update in Git Config**
```bash
cd "/Users/kareemelsenosy/Documents/HBCTL Project/ai-study-buddy"
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/kareemmeka/NYU-AI-Study-Buddy.git
git push
```

**Option B: Use Git Credential Helper**
```bash
# This will prompt you to enter credentials
git push
# When prompted, use your GitHub username and the new token as password
```

**Option C: Use SSH (If you have SSH keys set up)**
```bash
git remote set-url origin git@github.com:kareemmeka/NYU-AI-Study-Buddy.git
git push
```

### Step 3: Push

```bash
git push origin main
```

## After Pushing

Once pushed successfully:

1. **Check GitHub Actions:**
   ```
   https://github.com/kareemmeka/NYU-AI-Study-Buddy/actions
   ```

2. **You should see:**
   - Workflow runs
   - Automatic verification on every commit
   - Green checkmarks ✅ on successful commits

## Alternative: Push via GitHub Web Interface

If you can't update the token right now:

1. **Go to your repository:**
   ```
   https://github.com/kareemmeka/NYU-AI-Study-Buddy
   ```

2. **Use GitHub Desktop app** (if installed)

3. **Or manually upload workflow files:**
   - Go to: https://github.com/kareemmeka/NYU-AI-Study-Buddy/new/main
   - Path: `.github/workflows/verify.yml`
   - Copy content from the file
   - Commit directly on GitHub

## Current Status

- ✅ Workflow files created locally
- ✅ Empty commits ready to push
- ⏳ Waiting for token with `workflow` scope to push

## Once Pushed

Every future commit will automatically:
- ✅ Run GitHub Actions verification
- ✅ Show status on commit page
- ✅ Display results in Actions tab

