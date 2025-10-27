# Testing the Password Reset API

## Current Status

✅ **Password Reset API is Working**  
✅ **Email Service Implemented**  
⚠️  **Email Configuration Needed** (SMTP credentials)

The password reset API currently falls back to returning the token in the response when email sending fails, making it easy to test.

## Testing the Password Reset Flow

### Option 1: Test with API Returns (Current Setup)

Since email sending is not configured, the API returns the reset token:

**Step 1: Request Password Reset**
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Response:**
```json
{
  "message": "Password reset token generated (email service not configured)",
  "resetToken": "abc123...",
  "resetUrl": "https://educase-frontend-chi.vercel.app/reset-password/abc123...",
  "expiresAt": "2024-10-24T13:00:00Z",
  "note": "Email sending failed - token provided for testing. Configure SMTP in production."
}
```

**Step 2: Reset Password**
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123...",
    "password": "newpassword123"
  }'
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

### Option 2: Test with Email (Requires SMTP Setup)

**To enable email sending:**

1. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Go to App Passwords
   - Generate new app password for "Mail"
   - Copy the 16-character password

2. **Update `.env`:**
```env
SMTP_PASSWORD=your_16_character_app_password
```

3. **Restart Server**

## Testing with Postman

### 1. Test Password Reset Request

**POST** `http://localhost:3001/api/auth/forgot-password`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "serva.acc@gmail.com"
}
```

### 2. Test Password Reset

**POST** `http://localhost:3001/api/auth/reset-password`

**Body:**
```json
{
  "token": "paste_token_from_step_1",
  "password": "NewPassword123!"
}
```

## Testing with cURL

### Request Password Reset
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"serva.acc@gmail.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE","password":"NewPassword123!"}'
```

## What Happens

### Current Behavior (Without Email)
1. ✅ Token is generated and stored
2. ✅ Token is returned in API response
3. ✅ Token can be used for testing
4. ✅ Password reset works correctly

### With Email Configured
1. ✅ Token is generated and stored
2. ✅ Email is sent to user
3. ✅ User receives email with reset link
4. ✅ User can reset password via link

## Database Verification

Check if token is stored:
```sql
SELECT * FROM password_resets 
WHERE expires_at > NOW()
ORDER BY created_at DESC;
```

## Security Notes

- ⏰ Tokens expire after 1 hour
- 🔒 Tokens are hashed before storage
- 🗑️ Tokens are deleted after use
- ✅ Password is properly hashed with bcrypt

## Next Steps for Production

1. **Configure SMTP properly** (use App Password)
2. **Remove token from API response** (security)
3. **Add email verification** before sending
4. **Set up monitoring** for failed emails
5. **Implement rate limiting** to prevent abuse

## Troubleshooting

### "User not found" Error
- Verify user exists in database
- Check email spelling

### "Token expired" Error
- Token expires after 1 hour
- Request a new password reset

### "Invalid credentials" After Reset
- Wait a moment for cache to clear
- Try logging in again

### Email Not Sending
- Check SMTP credentials
- Use App Password for Gmail
- Verify firewall allows port 587

