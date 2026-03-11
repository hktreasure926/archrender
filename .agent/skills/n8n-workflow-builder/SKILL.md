# n8n Workflow Builder Skill

## Purpose
Build and fix n8n workflows programmatically using the n8n API.

## Credentials Required
Store these in n8n first:
- `telegram-bot` - Telegram Bot API credentials
- `google-drive` - Google Drive OAuth2 credentials

## Node Type Reference

### Telegram Trigger
```json
{
  "type": "n8n-nodes-base.telegramTrigger",
  "typeVersion": 1.2,
  "credentials": {"telegramApi": "telegram-bot"}
}
```

### Telegram Node (Send Message)
```json
{
  "type": "n8n-nodes-base.telegram",
  "typeVersion": 1.2,
  "operation": "sendMessage",
  "credentials": {"telegramApi": "telegram-bot"},
  "parameters": {
    "chatId": "{{USER_CHAT_ID}}",
    "text": "Message text",
    "additionalFields": {
      "replyMarkup": "{\"inline_keyboard\": [[{\"text\": \"Button\", \"callback_data\": \"action\"}]]}"
    }
  }
}
```

### Google Drive (Upload File)
```json
{
  "type": "n8n-nodes-base.googleDrive",
  "typeVersion": 3.2,
  "operation": "upload",
  "credentials": {"googleDriveOAuth2Api": "google-drive"},
  "parameters": {
    "fileName": "filename.mp4",
    "parentFolderId": "FOLDER_ID",
    "binaryData": true,
    "binaryPropertyName": "file"
  }
}
```

### HTTP Request
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.1,
  "method": "GET|POST",
  "url": "https://api.example.com",
  "sendQuery": true,
  "queryParameters": {"key": "={{ $json.value }}"},
  "responseFormat": "file"
}
```

### Wait Node
```json
{
  "type": "n8n-nodes-base.wait",
  "typeVersion": 1.1,
  "parameters": {
    "amount": 2,
    "unit": "days"
  }
}
```

## Workflow Template: Kling Motion Generator

### Stage 1: Collect & Approve
1. **Telegram Trigger** - Listen for TikTok links
2. **HTTP (Get Video)** - `https://api.tikmate.app/api/links?url={link}`
3. **HTTP (Download)** - Get video file
4. **Google Drive** - Upload to `/Nagi/TikTok/Raw/`
5. **Telegram (Notify)** - Send inline buttons: `[Mimic]`, `[Discard]`
6. **Wait** - Wait for human response

### API Endpoints
- **TikTok Download:** `https://api.tikmate.app/api/links`
- **Kling Create Task:** `POST https://api.kie.ai/api/v1/jobs/createTask`
- **Kling Check Status:** `GET https://api.kie.ai/api/v1/jobs/recordInfo`

## Commands

### Deploy Workflow
```bash
curl -s -X PUT "https://n8n.dashinglads.cloud/api/v1/workflows/{WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: {API_KEY}" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

### Get Workflow
```bash
curl -s "https://n8n.dashinglads.cloud/api/v1/workflows/{WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: {API_KEY}"
```
