// Quick test script to verify email configuration
const { verifyEmailConfig, sendPasswordResetEmail } = require('./src/utils/email');
require('dotenv').config();

async function testEmail() {
  console.log('Testing email configuration...\n');
  
  // 1. Verify email configuration
  console.log('Step 1: Verifying email server configuration...');
  const isReady = await verifyEmailConfig();
  
  if (!isReady) {
    console.error('❌ Email server configuration failed!');
    console.log('\nTroubleshooting:');
    console.log('1. Check SMTP credentials in .env');
    console.log('2. For Gmail, ensure you\'re using an App Password');
    console.log('3. Check firewall settings for port 587');
    process.exit(1);
  }
  
  console.log('✅ Email server configuration verified!\n');
  
  // 2. Test sending email (use a test email address)
  console.log('Step 2: Testing email sending...');
  console.log('Please provide a test email address to send the test email to:');
  console.log('(This will send a password reset email)\n');
  
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  const testName = 'Test User';
  const testToken = 'test_token_12345';
  
  try {
    const result = await sendPasswordResetEmail(testEmail, testName, testToken);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('\n⚠️  Check your inbox for the test email');
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check SMTP_USER and SMTP_PASSWORD');
    console.log('2. For Gmail, use an App Password, not your regular password');
    console.log('3. Ensure "Allow less secure apps" is enabled (not recommended)');
    console.log('   OR use an App Password with 2-Step Verification');
    process.exit(1);
  }
  
  console.log('\n✅ Email service is working correctly!');
}

testEmail().catch(console.error);

