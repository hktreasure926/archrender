# Quick Touchup Dashboard v1.0 - Testing Guide

## Panel Layout (3-Column)

```
┌────────┬────────────────┬────────────────┐
│  📁    │                │  Upload        │
│  img1  │     CANVAS     │  Step 1        │
│  img2  │   (with cam    │  Step 2        │
│  img3  │    overlay)    │  Step 3        │
│  img4  │                │  [Generate]    │
└────────┴────────────────┴────────────────┘
  2 cols       6 cols          4 cols
```

### Panel Descriptions

- **Timeline (Left)** - Vertical, collapsible list of renders
- **Canvas (Center)** - Main image display with camera/target overlay
- **Controls (Right)** - Upload, Steps 1-3, Generate button

## Your n8n Workflow Details

**Workflow ID:** `tOSfRSE0b37eoAoM`  
**Webhook URL:** `https://n8n.dashinglads.cloud/webhook/studionomad_kenji`  
**Workflow Name:** Studio Nomad Agent — ArchiRender Backend - agentic

## Workflow Flow

```
Webhook (Frontend) → Payload Router → Gemini Image Generation → Response to Frontend
```

## Expected Payload Format

Your n8n workflow expects this JSON structure:

```json
{
  "taskType": "sketch" | "angle" | "style",
  "userPrompt": "string - detailed architectural description",
  "size": "2K" | "4K",
  "settings": {
    "camera": {
      "cameraX": number,
      "cameraY": number,
      "targetX": number,
      "targetY": number
    },
    "aesthetic": "high-end editorial" | string
  },
  "baseImage": "data:image/png;base64,...",
  "styleImage": "data:image/png;base64,..."  // Only for style transfer
}
```

## Response Format

The workflow returns Gemini's raw response:

```json
{
  "candidates": [{
    "content": {
      "parts": [
        {
          "inline_data": {
            "mime_type": "image/png",
            "data": "base64_encoded_image_data"
          }
        }
      ]
    }
  }]
}
```

## Testing Steps

### 1. Configure Environment

Create `.env.local`:
```bash
# Required for Phase 1
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.dashinglads.cloud/webhook/studionomad_kenji
```

### 2. Test Workflow Directly (cURL)

```bash
# Test sketch mode
curl -X POST "https://n8n.dashinglads.cloud/webhook/studionomad_kenji" \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "sketch",
    "userPrompt": "Transform this massing into photorealistic render with concrete and timber",
    "size": "2K",
    "settings": {
      "aesthetic": "high-end editorial"
    },
    "baseImage": "data:image/png;base64,YOUR_BASE64_IMAGE_HERE"
  }'
```

### 3. Start Frontend

```bash
npm run dev
```

Open: http://localhost:3000/phase1

### 4. Test Flow

1. Upload a massing image (PNG/JPG)
2. Click "Generate Render (Sketch → Photo)"
3. Wait 30-60 seconds for Gemini generation
4. Render should appear in the track

## Troubleshooting

### "No image returned"
- Check if workflow is active in n8n
- Check Gemini API quota
- Check browser console for response details

### "Webhook failed"
- Verify NEXT_PUBLIC_N8N_WEBHOOK_URL is set correctly
- Check if workflow is activated (toggle switch in n8n)

### Timeout (takes > 2 min)
- Gemini generation takes 30-60 seconds normally
- If consistently timing out, check Gemini API status

## Mode Differences

### Sketch Mode (`taskType: "sketch"`)
- Transforms massing sketch → photorealistic render
- Uses only baseImage
- Prompt builder: "Transform the uploaded sketch/massing model into a photorealistic architectural rendering"

### Angle Mode (`taskType: "angle"`)
- Changes camera perspective
- Requires camera coordinates in settings
- Maintains same materials and lighting

### Style Mode (`taskType: "style"`)
- Style transfer between images
- Requires both baseImage AND styleImage
- Applies lighting/materials from styleImage to baseImage

## Gemini API Model

Your workflow uses: `gemini-2.5-flash-preview-05-20`

This model:
- Supports image generation
- 120-second timeout
- Returns base64-encoded PNG images

## Next: Phase 2

Once Phase 1 is working, we'll add:
- AI chat interface
- Intent recognition (user types "make it timber" → system detects style mode)
- Suggestion chips
- Agent status messages

**Ready to test?** Upload an image at http://localhost:3000/phase1