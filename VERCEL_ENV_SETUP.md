# ⚠️ IMPORTANT: Add Environment Variables to Vercel

The build is failing because environment variables are not set in Vercel.

## Required Environment Variables

Go to your Vercel project → **Settings** → **Environment Variables** and add:

### 1. Portkey Configuration
```
PORTKEY_API_KEY = 3QNI3x+PPoiQlnL5Jh348nMmUtz8
PORTKEY_BASE_URL = https://ai-gateway.apps.cloud.rt.nyu.edu/v1
AI_MODEL = @gpt-4o/gpt-4o
```

### 2. Vercel Blob Storage
```
BLOB_READ_WRITE_TOKEN = (get from Vercel → Storage → Blob)
```

### 3. App URL
```
NEXT_PUBLIC_APP_URL = (your Vercel URL, e.g., https://your-app.vercel.app)
```

## Steps to Add:

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable:
   - **Key**: Variable name
   - **Value**: Variable value
   - **Environment**: Select **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your project (or it will auto-redeploy)

## After Adding Variables:

The build should succeed! The code is fixed to handle missing env vars during build, but you still need to add them for the app to work.

