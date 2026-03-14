import { getResend, EMAIL_FROM } from './resend';
import { welcomeEmailHtml, verificationCodeHtml, shareNotificationHtml } from './templates';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://graphcooker.com';

export async function sendWelcomeEmail(
  user: { name: string; email: string },
  password: string,
  verifyToken: string
) {
  const verifyUrl = `${APP_URL}/verify?token=${verifyToken}`;

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: 'Welcome to GraphCooker — Verify Your Email',
    html: welcomeEmailHtml(user.name, user.email, password, verifyUrl),
  });
}

export async function sendVerificationCode(
  email: string,
  name: string,
  code: string,
  purpose: 'forgot_password' | 'password_change'
) {
  const subject = purpose === 'forgot_password'
    ? 'GraphCooker — Password Reset Code'
    : 'GraphCooker — Password Change Code';

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject,
    html: verificationCodeHtml(name, code, purpose),
  });
}

export async function sendShareNotification(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  itemType: string,
  itemCount: number
) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: recipientEmail,
    subject: `GraphCooker — ${senderName} shared content with you`,
    html: shareNotificationHtml(recipientName, senderName, itemType, itemCount),
  });
}
