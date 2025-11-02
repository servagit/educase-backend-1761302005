# Deploy Supabase Edge Function

Follow these steps to deploy the password reset email edge function:

## Step 1: Login to Supabase CLI

Open a terminal and run:

```bash
supabase login
```

This will open your browser for authentication.

## Step 2: Get Your Project Reference

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Copy your **Project Reference ID** (looks like: `xnneftxklwvnpqpncvpk`)

## Step 3: Link Your Project

```bash
cd /Users/emanuelmachel/Downloads/educase-backend-main
supabase link --project-ref xnneftxklwvnpqpncvpk
```

## Step 4: Set Environment Secrets

```bash
supabase secrets set SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY

supabase secrets set FROM_EMAIL=educase@vexperts.tech

supabase secrets set FROM_NAME=Educase

supabase secrets set FRONTEND_URL=https://educase-frontend-chi.vercel.app
```

## Step 5: Deploy the Function

```bash
cd /Users/emanuelmachel/Downloads/educase-backend-main
supabase functions deploy send-password-reset-email
```

## Step 6: Test the Function

```bash
curl -i --location --request POST \
  'https://xnneftxklwvnpqpncvpk.supabase.co/functions/v1/send-password-reset-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "shain@vexperts.tech",
    "name": "Shain",
    "resetToken": "test-token-123"
  }'
```

Replace `YOUR_ANON_KEY` with your Supabase anon key from the dashboard.

## Step 7: Enable in Production

Add to your Render environment variables:

```
USE_EDGE_FUNCTION=true
```

That's it! Your backend will now use the edge function for sending emails.

## Troubleshooting

### "Function not found"
- Make sure you deployed to the correct project
- Check function name matches: `send-password-reset-email`

### "Authorization failed"
- Verify your anon key is correct
- Check the Authorization header format

### "SendGrid error"
- Verify SendGrid API key is set correctly
- Check SendGrid account is active

## Verify Deployment

After deployment, you can see your function in:
- Supabase Dashboard → Edge Functions
- URL: `https://xnneftxklwvnpqpncvpk.supabase.co/functions/v1/send-password-reset-email`

