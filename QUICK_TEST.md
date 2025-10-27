# Quick Test: Password Reset API

## Current Status ✅

The password reset API is **ready to use**! It will return the reset token in the response for easy testing while you configure email later.

## To Get Gmail App Password

Follow this link and the steps in the guide:  
👉 **[GET_GMAIL_APP_PASSWORD.md](./GET_GMAIL_APP_PASSWORD.md)**

Or go directly to: https://myaccount.google.com/apppasswords

## Quick Test (Without Email Setup)

Even without email configured, you can test the password reset flow:

### 1. Start the Server
```bash
npm start
```

### 2. Request Password Reset
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"serva.acc@gmail.com"}'
```

### 3. You'll Get Response with Token
```json
{
  "message": "Password reset token generated (email service not configured)",
  "resetToken": "abc123...",
  "resetUrl": "https://educase-frontend-chi.vercel.app/reset-password/abc123...",
  "expiresAt": "2024-10-24T13:00:00Z"
}
```

### 4. Use Token to Reset Password
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "paste_token_here",
    "password": "NewPassword123!"
  }'
```

### 5. Verify: Try Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "serva.acc@gmail.com",
    "password": "NewPassword123!"
  }'
```

## What's Working ✅

✅ Password reset request endpoint  
✅ Secure token generation  
✅ Token storage in database  
✅ Password reset with token  
✅ Password hashing with bcrypt  
✅ Token expiration (1 hour)  
✅ Automatic token cleanup  

## What Needs Email Configuration

To send emails automatically, you need:
1. Generate Gmail App Password
2. Update `.env` with the app password
3. Restart server

See: [GET_GMAIL_APP_PASSWORD.md](./GET_GMAIL_APP_PASSWORD.md)

