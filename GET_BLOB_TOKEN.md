# How to Get Your BLOB_READ_WRITE_TOKEN

## Your Blob Storage Info:
- **Store Name**: nyu-ai-study-buddy-blob
- **Store ID**: store_SQrULv5f505YfLOW
- **Base URL**: https://sqrulv5f505yflow.public.blob.vercel-storage.com

## Step 1: Get the Token

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Click on your project: **NYU-AI-Study-Buddy**
3. Click **Storage** tab
4. Click on your blob storage: **nyu-ai-study-buddy-blob**
5. Go to **Settings** tab
6. Look for **Environment Variables** or **Connection Details**
7. Find **BLOB_READ_WRITE_TOKEN**
8. Click **Show** or **Reveal** to see the token (it's hidden with `************`)
9. **Copy the entire token** (it's a long string)

## Step 2: Add to Environment Variables

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: (paste the token you copied)
   - **Environment**: Select **Production**, **Preview**, and **Development** ✅
4. Click **Save**

## Step 3: Redeploy

1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **..."** → **Redeploy**
4. Or wait for auto-deploy (if you have auto-deploy enabled)

## Step 4: Test

After redeploying:
1. Go to your website
2. Try uploading a file
3. It should work now!

## Quick Checklist

- [ ] Found BLOB_READ_WRITE_TOKEN in Blob storage settings
- [ ] Copied the token
- [ ] Added to Vercel Environment Variables
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed the project
- [ ] Tested file upload

## Note

The token is sensitive - don't share it publicly. It's safe in Vercel environment variables.

