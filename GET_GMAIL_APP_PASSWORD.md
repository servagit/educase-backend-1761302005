# How to Get Gmail App Password

This guide will help you generate an App Password for Gmail to use with the Educase email service.

## Step-by-Step Instructions

### Step 1: Enable 2-Step Verification

1. Go to [Google Account](https://myaccount.google.com/)
2. Click on **Security** in the left sidebar
3. Scroll down to **How you sign in to Google**
4. Click **2-Step Verification**
5. Follow the prompts to enable 2-Step Verification

**Note:** You MUST enable 2-Step Verification before you can generate App Passwords.

### Step 2: Generate App Password

1. Go back to the [Security](https://myaccount.google.com/security) page
2. Under **How you sign in to Google**, click **2-Step Verification**
3. Scroll down and click on **App passwords**
4. You may need to sign in again
5. In the **App passwords** section:
   - **Select app**: Choose "Mail"
   - **Select device**: Choose "Other (Custom name)"
   - **Custom name**: Enter "Educase Backend" or any name you prefer
   - Click **Generate**

### Step 3: Copy the App Password

6. Google will generate a 16-character password that looks like this:
   ```
   xxxx xxxx xxxx xxxx
   ```
7. **Copy this password** (including spaces or without - both work)
8. **Important:** This password will only be shown once. If you lose it, you'll need to generate a new one.

### Step 4: Update Your .env File

Open your `.env` file and update the `SMTP_PASSWORD`:

```env
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

Or without spaces:
```env
SMTP_PASSWORD=xxxxxxxxxxxxxxxx
```

**Complete .env configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=serva.acc@gmail.com
SMTP_PASSWORD=your_16_character_app_password_here
EMAIL_FROM_NAME=Educase
```

### Step 5: Restart Your Server

After updating the `.env` file, restart your Node.js server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
```

## Quick Reference

**Link to App Passwords:**  
[https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

**Link to Security Settings:**  
[https://myaccount.google.com/security](https://myaccount.google.com/security)

## Alternative: Without 2-Step Verification (Not Recommended)

⚠️ **Warning:** Google has deprecated "less secure apps" access. Modern Gmail accounts cannot use regular passwords anymore.

**If you have an older Google Workspace (G Suite) account**, your admin might allow "less secure app access":
- Go to [Less secure app access](https://myaccount.google.com/lesssecureapps)
- Turn it ON (if available)
- Use your regular Gmail password

**However, using App Passwords with 2-Step Verification is MUCH MORE SECURE.**

## Testing After Setup

Run the test script to verify everything is working:

```bash
node test-email.js
```

Or test the password reset API:

```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"serva.acc@gmail.com"}'
```

If email is configured correctly, you'll receive an email!

## Troubleshooting

### "App passwords" option not showing
- ✅ Make sure 2-Step Verification is enabled
- ✅ Use a personal Gmail account (not workspace account)
- ✅ Try refreshing the page

### "Invalid login" error
- ✅ Double-check you copied the entire 16-character password
- ✅ Make sure there are no extra spaces
- ✅ Try removing spaces from the password

### "Access not allowed" error
- ✅ Make sure 2-Step Verification is enabled
- ✅ Re-generate the App Password
- ✅ Check if your Google account is restricted

### Still not working?
1. Try generating a new App Password
2. Make sure you're using the correct Gmail address
3. Check that SMTP_PORT is set to 587 (not 465)
4. Verify your internet connection allows SMTP traffic

## Security Best Practices

1. ✅ Use App Passwords instead of regular passwords
2. ✅ Keep App Passwords secure - don't share them
3. ✅ Regenerate App Passwords periodically
4. ✅ Use different App Passwords for different applications
5. ✅ Remove unused App Passwords

## For Other Email Providers

### Outlook/Office 365
- Same process - enable 2-Factor Authentication
- Generate App Password from Microsoft Account Security
- Use: `smtp.office365.com`

### Yahoo Mail
- Enable "Generate app password"
- Use: `smtp.mail.yahoo.com`

### Custom SMTP
- Ask your email provider for SMTP settings
- Some providers don't require App Passwords
- Check with your hosting provider's documentation

