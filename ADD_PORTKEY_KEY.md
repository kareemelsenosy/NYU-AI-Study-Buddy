# Add Portkey API Key to Vercel

## Your Portkey API Key:
```
3QNI3x+PPoiQlnL5Jh348nMmUtz8
```

## Quick Steps:

### 1. Go to Vercel Environment Variables
1. Visit: https://vercel.com/dashboard
2. Click your project: **NYU-AI-Study-Buddy**
3. Go to **Settings** → **Environment Variables**

### 2. Add the Portkey API Key
Click **Add New** and enter:

- **Key**: `PORTKEY_API_KEY`
- **Value**: `3QNI3x+PPoiQlnL5Jh348nMmUtz8`
- **Description** (optional): `AI Study Buddy API Key`
- **Environment**: ✅ Production ✅ Preview ✅ Development

### 3. Save and Redeploy
1. Click **Save**
2. Go to **Deployments** tab
3. Click latest deployment → **..."** → **Redeploy**
4. Wait 2-3 minutes

## ✅ Complete Environment Variables Checklist

Make sure ALL of these are set in Vercel:

### Required Variables:

1. **PORTKEY_API_KEY**
   - Value: `3QNI3x+PPoiQlnL5Jh348nMmUtz8`
   - Description: AI Study Buddy API Key

2. **PORTKEY_BASE_URL**
   - Value: `https://ai-gateway.apps.cloud.rt.nyu.edu/v1`

3. **AI_MODEL**
   - Value: `@gpt-4o/gpt-4o`

4. **Files_READ_WRITE_TOKEN**
   - Value: `vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu`

5. **NEXT_PUBLIC_APP_URL**
   - Value: `https://nyu-ai-study-buddy-eugo02n15-kareem-elsenosys-projects.vercel.app`

## After Adding:

✅ AI chat will work
✅ File uploads will work
✅ Everything should be functional

## Test It:

1. Go to your website
2. Try asking a question - AI should respond
3. Try uploading a file - should work
4. Check browser console (F12) for any errors

