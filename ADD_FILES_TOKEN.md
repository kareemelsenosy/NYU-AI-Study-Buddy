# Add Files_READ_WRITE_TOKEN to Vercel

## Your Token:
```
Files_READ_WRITE_TOKEN = vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu
```

## Quick Steps:

### 1. Go to Vercel Environment Variables
1. Visit: https://vercel.com/dashboard
2. Click your project: **NYU-AI-Study-Buddy**
3. Go to **Settings** → **Environment Variables**

### 2. Add the Token
Click **Add New** and enter:

- **Key**: `Files_READ_WRITE_TOKEN`
- **Value**: `vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu`
- **Environment**: ✅ Production ✅ Preview ✅ Development

### 3. Save and Redeploy
1. Click **Save**
2. Go to **Deployments** tab
3. Click latest deployment → **..."** → **Redeploy**
4. Wait 2-3 minutes

## ✅ Done!

After redeploying:
- File uploads will work
- Files will be stored in your Blob storage
- No more "Access denied" errors

## Test It:
1. Go to your website
2. Click file manager
3. Upload a file
4. Should work! 🎉

## Note:
The code now prioritizes `Files_READ_WRITE_TOKEN` (which is Vercel's default name for Blob storage tokens), so this will work perfectly!

