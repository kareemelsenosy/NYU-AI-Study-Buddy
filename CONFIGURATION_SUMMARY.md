# Configuration Summary

## AI Provider: Vertex AI (Google)

Your configuration uses **Vertex AI** as the provider through Portkey.

## Current Configuration

### Portkey Setup
- **Base URL:** `https://ai-gateway.apps.cloud.rt.nyu.edu/v1` (NYU gateway)
- **API Key:** `3QNI3x+PPoiQlnL5Jh348nMmUtz8` (Virtual Key for NYU gateway)
- **Provider:** Vertex AI (Google)
- **Model:** `@vertexai/gemini-2.5-pro`

### Model Format
The `@vertexai/` prefix indicates:
- **Provider:** Vertex AI (Google Cloud)
- **Model:** Gemini 2.5 Pro
- **Format:** `@vertexai/gemini-2.5-pro`

This is the correct format for using Vertex AI models through Portkey.

## Environment Variables

Set in Vercel:
```
PORTKEY_API_KEY=3QNI3x+PPoiQlnL5Jh348nMmUtz8
AI_MODEL=@vertexai/gemini-2.5-pro
PORTKEY_BASE_URL=https://ai-gateway.apps.cloud.rt.nyu.edu/v1
Files_READ_WRITE_TOKEN=vercel_blob_rw_SQrULv5f505YfLOW_osTffHgOi4prYyTIEoFKOooYxxYrFu
NEXT_PUBLIC_APP_URL=https://nyu-ai-study-buddy-eugo02n15-kareem-elsenosys-projects.vercel.app
```

## Code Configuration

The code matches your TypeScript example:
```typescript
const portkey = new Portkey({
  baseURL: "https://ai-gateway.apps.cloud.rt.nyu.edu/v1",
  apiKey: "3QNI3x+PPoiQlnL5Jh348nMmUtz8"
});

// Model: @vertexai/gemini-2.5-pro
```

## Status

✅ **Provider:** Vertex AI (confirmed)
✅ **Model:** @vertexai/gemini-2.5-pro (correct format)
✅ **Gateway:** NYU gateway (configured)
✅ **API Key:** Virtual Key for NYU gateway (set)

Everything is configured correctly for Vertex AI through Portkey!

