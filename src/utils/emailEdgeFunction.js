const supabase = require('./supabase');

/**
 * Send password reset email using Supabase Edge Function
 * This bypasses SMTP restrictions on hosting providers like Render
 */
const sendPasswordResetEmailViaEdgeFunction = async (email, name, resetToken) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-password-reset-email', {
      body: {
        email,
        name,
        resetToken
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Failed to send email via edge function: ${error.message}`);
    }

    console.log('Password reset email sent via edge function:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error calling edge function:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmailViaEdgeFunction
};

