# Email Service Setup

The Educase backend now includes email functionality for password reset emails. This document explains how to configure and use the email service.

## Features

✅ Password reset emails with secure tokens
✅ HTML email templates
✅ Fallback to plain text
✅ Development mode with token return
✅ Production-ready email sending

## Configuration

### 1. Add SMTP Configuration to `.env`

Add the following variables to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your_email@gmail.com    # Your email address
SMTP_PASSWORD=your_app_password   # Your email password or app password
EMAIL_FROM_NAME=Educase           # Display name for emails
FRONTEND_URL=https://educase-frontend-chi.vercel.app  # Frontend URL for reset links
```

### 2. Gmail Setup (Most Common)

For Gmail, you need to:

1. **Enable 2-Step Verification** (if not already enabled)
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other", then generate a 16-character password
   - Use this password in `SMTP_PASSWORD`

### 3. Other Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

#### Outlook/Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_password
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_password
```

## Usage

### Password Reset Flow

1. **User requests password reset**:
```bash
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

2. **System sends email** with reset link
3. **User clicks link** and enters new password
4. **Password is reset**

### Development Mode

In development (`NODE_ENV=development`), if email sending fails, the API will return the reset token in the response for testing:

```json
{
  "message": "Password reset token generated (email failed - development mode)",
  "resetToken": "abc123...",
  "resetUrl": "http://localhost:3000/reset-password/abc123...",
  "expiresAt": "2024-10-24T13:00:00Z"
}
```

This allows you to test the reset flow without configuring email in development.

### Production Mode

In production, the email is sent and only a success message is returned:

```json
{
  "message": "Password reset email sent successfully",
  "expiresAt": "2024-10-24T13:00:00Z"
}
```

## Email Template

The password reset email includes:
- ✅ Professional HTML formatting
- ✅ Reset button link
- ✅ Plain text fallback
- ✅ Security warnings
- ✅ Expiration time information
- ✅ Branded design

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials** - Verify username and password
2. **Check firewall** - Ensure port 587 or 465 is open
3. **Check TLS/SSL** - Modern email providers require encrypted connections
4. **Check logs** - Look for error messages in console

### Common Errors

**Error: Invalid login**
- Gmail requires App Password, not regular password
- 2-Step Verification must be enabled

**Error: Connection timeout**
- Check if port is blocked by firewall
- Try port 465 instead of 587

**Error: Authentication failed**
- Verify username includes full email address
- Check for typos in password
- Ensure App Password is used for Gmail

## Testing Email Configuration

You can test your email configuration by creating a test endpoint:

```javascript
const { verifyEmailConfig } = require('./utils/email');

app.get('/test-email', async (req, res) => {
  const isReady = await verifyEmailConfig();
  res.json({ emailReady: isReady });
});
```

## Security Best Practices

1. ✅ Use App Passwords (not regular passwords)
2. ✅ Store credentials in environment variables
3. ✅ Never commit `.env` to version control
4. ✅ Use HTTPS for frontend URLs
5. ✅ Set appropriate token expiration times
6. ✅ Hash tokens before storing in database

## Production Checklist

- [ ] Configure SMTP credentials in production environment
- [ ] Test email sending in staging
- [ ] Set `NODE_ENV=production`
- [ ] Verify email deliverability
- [ ] Monitor email logs for errors
- [ ] Set up bounce handling (if available)

