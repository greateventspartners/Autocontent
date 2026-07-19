import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY est requise");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const from = process.env.EMAIL_FROM || "Autocontent <noreply@autocontent.app>";

  const { data, error } = await getResendClient().emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Email send error:", error);
    throw new Error(error.message);
  }

  return data;
}

export function buildResetPasswordEmail(resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
              <tr>
                <td style="padding:40px 32px 32px;text-align:center;">
                  <div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#a855f7);margin:0 auto 24px;line-height:56px;font-size:24px;font-weight:bold;color:white;">
                    A
                  </div>
                  <h1 style="color:#f8fafc;font-size:24px;font-weight:700;margin:0 0 8px;">
                    Réinitialisation du mot de passe
                  </h1>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 32px;">
                    Vous avez demandé la réinitialisation de votre mot de passe.<br>
                    Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                  </p>
                  <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;">
                    Réinitialiser mon mot de passe
                  </a>
                  <p style="color:#64748b;font-size:12px;line-height:1.5;margin:24px 0 0;">
                    Ce lien expire dans 1 heure.<br>
                    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
