export async function sendNotificationEmail({
  notificationId,
  recipientEmail,
  subject,
  htmlBody,
  replyTo,
}: {
  notificationId: string;
  recipientEmail: string;
  subject: string;
  htmlBody: string;
  replyTo?: string;
}) {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    let senderEmail = 'noreply@fitconnect.app';
    try {
      senderEmail = `noreply@${new URL(appUrl).hostname}`;
    } catch {}

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: notificationId,
        subject,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        reply_to: replyTo,
        sender_email: senderEmail,
        sender_alias: 'FitConnect',
      }),
    });

    const result = await response.json();
    if (!result.success && !result.notification_disabled) {
      console.error('Failed to send notification:', result.message);
    }
    return result;
  } catch (error) {
    console.error('Notification error:', error);
    return { success: false };
  }
}

export function buildEmailTemplate(title: string, contentHtml: string) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">FitConnect</h1>
      </div>
      <div style="padding: 30px 20px;">
        <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
        ${contentHtml}
      </div>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">FitConnect — Conecte-se ao seu treino ideal</p>
      </div>
    </div>
  `;
}
