# Supabase Edge Function: Send Password Reset Email

This edge function sends password reset emails using SendGrid API, bypassing SMTP restrictions on hosting providers like Render.

## Deployment

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Set Environment Variables (Secrets)

```bash
supabase secrets set SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
supabase secrets set FROM_EMAIL=educase@vexperts.tech
supabase secrets set FROM_NAME=Educase
supabase secrets set FRONTEND_URL=https://educase-frontend-chi.vercel.app
```

### 5. Deploy the Function

```bash
supabase functions deploy send-password-reset-email
```

## Usage from Backend

### Enable Edge Function in Environment Variables

Add to your `.env` or Render environment variables:

```env
USE_EDGE_FUNCTION=true
```

### The backend will automatically use the edge function when enabled.

## Testing

```bash
# Test the edge function directly
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-password-reset-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "test@example.com",
    "name": "Test User",
    "resetToken": "test-token-123"
  }'
```

## Benefits

✅ **No SMTP restrictions** - Works on any hosting provider  
✅ **Better deliverability** - Uses SendGrid API directly  
✅ **Serverless** - No server maintenance needed  
✅ **Fast** - Edge functions run close to users  
✅ **Scalable** - Auto-scales with demand  

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxx...` |
| `FROM_EMAIL` | Sender email address | `educase@vexperts.tech` |
| `FROM_NAME` | Sender name | `Educase` |
| `FRONTEND_URL` | Frontend URL for reset links | `https://your-app.com` |

## Backend Configuration

In your Render environment variables:
```
USE_EDGE_FUNCTION=true
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_KEY=your_anon_key
```

The backend will automatically call the edge function instead of using SMTP.

