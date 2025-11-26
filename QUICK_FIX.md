# 🚀 Quick Fix for File Upload

## The Problem
"Please provide a valid token" error when uploading files.

## The Solution (2 minutes)

### Step 1: Get Your Token
1. Vercel Dashboard → Your Project → **Storage** tab
2. Click **nyu-ai-study-buddy-blob**
3. Go to **Settings** tab
4. Find **BLOB_READ_WRITE_TOKEN**
5. Click **Show/Reveal** to see it
6. **Copy the token**

### Step 2: Add to Environment Variables
1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Click **Add New**
3. **Key**: `BLOB_READ_WRITE_TOKEN`
4. **Value**: (paste your token)
5. **Environment**: ✅ Production ✅ Preview ✅ Development
6. **Save**

### Step 3: Redeploy
1. **Deployments** tab → Latest deployment → **..."** → **Redeploy**
2. Wait 1-2 minutes
3. Done!

## Test It
- Go to your website
- Click file manager
- Upload a PDF or PowerPoint file
- Should work! ✅

## Still Not Working?
- Make sure token was copied completely (no spaces)
- Verify it's added for all 3 environments
- Check Vercel logs for errors
- Try redeploying again

