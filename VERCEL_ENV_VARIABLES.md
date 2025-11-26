# Vercel Environment Variables

Add these environment variables in your Vercel dashboard:

## Required Variables

```
PORTKEY_API_KEY = 3QNI3x+PPoiQlnL5Jh348nMmUtz8
PORTKEY_BASE_URL = https://ai-gateway.apps.cloud.rt.nyu.edu/v1
AI_MODEL = @gpt-4o/gpt-4o
BLOB_READ_WRITE_TOKEN = (get from Vercel Blob storage)
NEXT_PUBLIC_APP_URL = (your Vercel URL, e.g., https://your-app.vercel.app)
```

## Optional Variables

```
GITHUB_TOKEN = your_github_token_here
```

## How to Add in Vercel

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `PORTKEY_API_KEY`)
   - **Value**: Variable value
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your project for changes to take effect

## Important Notes

- `BLOB_READ_WRITE_TOKEN`: Get this from Vercel → Storage → Blob → Connection details
- `NEXT_PUBLIC_APP_URL`: Set this after first deployment with your actual Vercel URL
- `GITHUB_TOKEN`: Optional, only needed if you want to use GitHub API features
- All variables are case-sensitive

