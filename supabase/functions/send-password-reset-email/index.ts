// Supabase Edge Function for sending password reset emails
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'educase@vexperts.tech'
const FROM_NAME = Deno.env.get('FROM_NAME') || 'Educase'
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://educase-frontend-chi.vercel.app'

interface RequestBody {
  email: string
  name: string
  resetToken: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { email, name, resetToken }: RequestBody = await req.json()

    if (!email || !name || !resetToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`

    // SendGrid API request
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: 'Password Reset Request',
          },
        ],
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        content: [
          {
            type: 'text/html',
            value: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                  .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                  .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { margin-top: 20px; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                  .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2>Password Reset Request</h2>
                  </div>
                  <div class="content">
                    <p>Hello ${name},</p>
                    <p>We received a request to reset your password for your Educase account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center;">
                      <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
                    <div class="warning">
                      <strong>⚠️ Important:</strong>
                      <ul>
                        <li>This link will expire in 1 hour</li>
                        <li>If you didn't request this, you can safely ignore this email</li>
                        <li>For security reasons, please do not share this link with anyone</li>
                      </ul>
                    </div>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} Educase. All rights reserved.</p>
                    <p>This is an automated email, please do not reply.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          },
        ],
      }),
    })

    if (!sendGridResponse.ok) {
      const error = await sendGridResponse.text()
      console.error('SendGrid error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

