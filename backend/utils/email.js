const { Resend } = require('resend');
const env = require('../config/env');

const resend = new Resend(env.resendApiKey);

const FROM = 'Librarium <noreply@librarium40k.com>';

const sendVerificationEmail = async (email, token) => {
  const link = `${env.appUrl}/verify/${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your Librarium account',
    html: `
      <div style="background:#111318;color:#e8e0d0;font-family:Georgia,serif;padding:40px;max-width:520px;margin:0 auto;border:1px solid #2a2d36;">
        <h1 style="color:#c9a84c;font-size:28px;margin:0 0 8px;letter-spacing:0.05em;">Librarium</h1>
        <p style="color:#6b7280;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 32px;">In the grim darkness of the far future</p>
        <p style="margin:0 0 16px;">Your account has been created. Verify your email address to gain full access to the chronicles of the Warhammer Universe.</p>
        <a href="${link}" style="display:inline-block;background:#c9a84c;color:#111318;padding:12px 28px;text-decoration:none;font-family:Georgia,serif;letter-spacing:0.1em;font-size:13px;margin:16px 0 32px;">
          VERIFY EMAIL
        </a>
        <p style="color:#6b7280;font-size:12px;margin:0;">This link expires in 24 hours. If you did not create an account, ignore this email.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const link = `${env.appUrl}/reset-password/${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Librarium password',
    html: `
      <div style="background:#111318;color:#e8e0d0;font-family:Georgia,serif;padding:40px;max-width:520px;margin:0 auto;border:1px solid #2a2d36;">
        <h1 style="color:#c9a84c;font-size:28px;margin:0 0 8px;letter-spacing:0.05em;">Librarium</h1>
        <p style="color:#6b7280;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 32px;">In the grim darkness of the far future</p>
        <p style="margin:0 0 16px;">A password reset was requested for this account. Click below to set a new password.</p>
        <a href="${link}" style="display:inline-block;background:#c9a84c;color:#111318;padding:12px 28px;text-decoration:none;font-family:Georgia,serif;letter-spacing:0.1em;font-size:13px;margin:16px 0 32px;">
          RESET PASSWORD
        </a>
        <p style="color:#6b7280;font-size:12px;margin:0;">This link expires in 1 hour. If you did not request a reset, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
