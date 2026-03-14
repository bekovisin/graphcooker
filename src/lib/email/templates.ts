const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
  .container { max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
  .header { background: linear-gradient(135deg, #FDBA74 0%, #F97316 50%, #EA580C 100%); padding: 24px 32px; text-align: center; }
  .header h1 { color: white; font-size: 20px; margin: 0; font-weight: 600; }
  .body { padding: 32px; }
  .body h2 { font-size: 18px; color: #111827; margin: 0 0 16px; }
  .body p { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 12px; }
  .credential { background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .credential-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
  .credential-label { color: #6b7280; }
  .credential-value { color: #111827; font-weight: 600; font-family: monospace; }
  .btn { display: inline-block; background: #f97316; color: white !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 16px 0; }
  .code-box { background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0; }
  .code { font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827; font-family: monospace; }
  .footer { padding: 16px 32px; border-top: 1px solid #e5e7eb; text-align: center; }
  .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
`;

export function welcomeEmailHtml(
  name: string,
  email: string,
  password: string,
  verifyUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to GraphCooker!</h1>
    </div>
    <div class="body">
      <h2>Hi ${name},</h2>
      <p>Your account has been created. Here are your login credentials:</p>
      <div class="credential">
        <div class="credential-row">
          <span class="credential-label">Email:</span>
          <span class="credential-value">${email}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Password:</span>
          <span class="credential-value">${password}</span>
        </div>
      </div>
      <p>Please verify your email address and then change your password after your first login.</p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #9ca3af;">If the button doesn't work, copy this link:<br/>${verifyUrl}</p>
    </div>
    <div class="footer">
      <p>&copy; GraphCooker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export function shareNotificationHtml(
  recipientName: string,
  senderName: string,
  itemType: string,
  itemCount: number
): string {
  const itemLabel = itemCount > 1 ? `${itemCount} ${itemType}` : `1 ${itemType.replace(/s$/, '')}`;
  return `<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Content Shared With You</h1>
    </div>
    <div class="body">
      <h2>Hi ${recipientName},</h2>
      <p><strong>${senderName}</strong> shared ${itemLabel} with you on GraphCooker.</p>
      <p>The shared content has been added to your dashboard. You can view and edit it anytime.</p>
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://graphcooker.com'}/dashboard" class="btn">Go to Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; GraphCooker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export function verificationCodeHtml(
  name: string,
  code: string,
  purpose: 'forgot_password' | 'password_change'
): string {
  const title = purpose === 'forgot_password' ? 'Reset Your Password' : 'Change Your Password';
  const description = purpose === 'forgot_password'
    ? 'You requested to reset your password. Use the verification code below:'
    : 'You requested to change your password. Use the verification code below:';

  return `<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="body">
      <h2>Hi ${name},</h2>
      <p>${description}</p>
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p style="font-size: 12px; color: #9ca3af;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; GraphCooker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
