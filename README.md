# n8n Workflow Import Instructions

## Option 1: Import from JSON (Recommended)

1. Open your n8n instance: https://n8n.dashinglads.cloud
2. Click **Workflows** → **Import from File**
3. Select: `n8n-workflows/studio-nomad-render.json`
4. Configure these settings:

### Required Configuration:

#### 1. Webhook URL
The webhook path is: `studio-nomad-render`
Your full webhook URL will be:
```
https://n8n.dashinglads.cloud/webhook/studio-nomad-render
```

Add this to your `.env.local`:
```bash
N8N_WEBHOOK_URL=https://n8n.dashinglads.cloud/webhook/studio-nomad-render
```

#### 2. ComfyUI/Stable Diffusion Instance
Edit the "ComfyUI / Stable Diffusion" node:
- Replace `http://your-comfyui-or-sd-instance:8188` with your actual SD API endpoint
- OR use services like RunPod, Lambda Labs, etc.

#### 3. Google Drive Upload
Edit the "Upload to Google Drive" node:
- Replace `YOUR_GOOGLE_DRIVE_FOLDER_ID` with your actual folder ID
- Ensure Google Drive credentials are configured in n8n

### Alternative: If using Replicate/RunPod API instead of self-hosted SD:

Replace the "ComfyUI / Stable Diffusion" node with this HTTP Request:

```json
{
  "method": "POST",
  "url": "https://api.runpod.ai/v2/your-endpoint-id/run",
  "headers": {
    "Authorization": "Bearer {{ $env.RUNPOD_API_KEY }}"
  },
  "body": {
    "input": {
      "prompt": "={{ $json.body.prompt }}",
      "image": "={{ $json.body.base_image }}",
      "strength": "={{ $json.body.creativity }}",
      "width": "={{ $json.body.resolution === '8K' ? 7680 : $json.body.resolution === '4K' ? 3840 : 1920 }}",
      "height": "={{ $json.body.resolution === '8K' ? 4320 : $json.body.resolution === '4K' ? 2160 : 1080 }}"
    }
  }
}
```

## Option 2: Copy from Existing Workflow

Since you have access to the old workflow, you can:

1. Open: https://n8n.dashinglads.cloud/workflow/tOSfRSE0b37eoAoM
2. Click **Workflow** → **Duplicate**
3. Rename to "Studio Nomad - Render Generator"
4. Update the webhook path to: `studio-nomad-render`

## Testing the Workflow

### Test via n8n UI:
1. Open your workflow
2. Click "Test Workflow"
3. Send test payload:
```json
{
  "mode": "sketch",
  "prompt": "architectural visualization, concrete and timber, photorealistic",
  "base_image": "https://example.com/test-massing.jpg",
  "creativity": 0.7,
  "resolution": "2K"
}
```

### Test via Frontend (Phase 1):
1. Start your Next.js app: `npm run dev`
2. Open: http://localhost:3000/phase1
3. Upload a massing image
4. Click "Generate Render"

## Expected Workflow Response

```json
{
  "success": true,
  "image_url": "https://drive.google.com/.../render-123456.png",
  "mode": "sketch",
  "prompt": "architectural visualization, concrete and timber, photorealistic",
  "generation_time": "45s",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### "Workflow not found"
- Check if workflow is activated (toggle switch)
- Verify webhook path matches exactly

### "401 Unauthorized" from SD API
- Check API credentials/credits
- Verify authentication headers

### "Image not generating"
- Check ComfyUI/SD logs
- Verify base_image URL is accessible
- Check if GPU is available

### "Timeout"
- Increase wait time node (currently 45s)
- Use async pattern with callback URL instead

## Next Steps

Once this workflow is working:
1. Test with Phase 1 frontend
2. Then I'll build Phase 2 (AI brain)
3. Phase 3 (Firebase auth)
4. Phase 4 (Credits)

**Which image generation backend are you using?**
- A) Self-hosted ComfyUI/Stable Diffusion
- B) RunPod API
- C) Replicate API
- D) Other (please specify)

This will help me customize the workflow nodes correctly.