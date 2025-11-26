# Complete Vercel Environment Variables Setup

## Copy and Paste These to Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add each of these (click "Add New" for each):

### 1. Portkey API Key
```
Key: PORTKEY_API_KEY
Value: 3QNI3x+PPoiQlnL5Jh348nMmUtz8
Environment: ✅ Production ✅ Preview ✅ Development
```

### 2. Portkey Base URL
```
Key: PORTKEY_BASE_URL
Value: https://ai-gateway.apps.cloud.rt.nyu.edu/v1
Environment: ✅ Production ✅ Preview ✅ Development
```

### 3. AI Model
```
Key: AI_MODEL
Value: @gpt-4o/gpt-4o
Environment: ✅ Production ✅ Preview ✅ Development
```

### 4. Blob Storage Token
```
Key: BLOB_READ_WRITE_TOKEN
Value: vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu
Environment: ✅ Production ✅ Preview ✅ Development
```

### 5. App URL
```
Key: NEXT_PUBLIC_APP_URL
Value: https://nyu-ai-study-buddy-eugo02n15-kareem-elsenosys-projects.vercel.app
Environment: ✅ Production ✅ Preview ✅ Development
```

## After Adding All Variables:

1. **Save** each variable
2. Go to **Deployments** tab
3. Click latest deployment → **..."** → **Redeploy**
4. Wait 2-3 minutes for deployment

## Verify:

After redeploy:
- ✅ File uploads work
- ✅ AI chat works
- ✅ Everything is functional

## Quick Checklist:

- [ ] PORTKEY_API_KEY added
- [ ] PORTKEY_BASE_URL added
- [ ] AI_MODEL added
- [ ] BLOB_READ_WRITE_TOKEN added
- [ ] NEXT_PUBLIC_APP_URL added
- [ ] All set for Production, Preview, Development
- [ ] Redeployed project

