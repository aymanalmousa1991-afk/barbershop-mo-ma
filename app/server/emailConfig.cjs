/**
 * Email Configuratie voor Mo&Ma Barbershop
 *
 * LOKAAL TESTEN: emails worden gelogd naar console
 * LIVE (Render): gebruikt SendGrid API via HTTPS (poort 443)
 *
 * Render blokkeert SMTP (25,465,587) maar HTTPS werkt wel.
 * SendGrid: https://sendgrid.com (gratis: 100 emails/dag, geen domeinverificatie nodig)
 *
 * Zet in Render (Environment):
 *   SENDGRID_API_KEY = SG.xxxxx (SendGrid API key)
 *   EMAIL_FROM = Mo&Ma Kapsalon <jouwemail@gmail.com>
 */

const https = require('https');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Mo&Ma Kapsalon <info@barbershop-moma.nl>';

const SHOP_ADDRESS = 'W. J. Tuijnstraat 14A, 1131 ZJ Volendam';
const SHOP_PHONE = '06-85171198';
const SHOP_WEBSITE = 'https://barbershop-mo-ma.onrender.com';

function createTransporter() {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️  Geen SENDGRID_API_KEY ingesteld. Emails worden naar console gelogd.');
    return {
      sendMail: async ({ to, subject, html }) => {
        console.log('📧 [MOCK EMAIL] ───────────────────────────────────────');
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log('   ─────────────────────────────────────────────────');
        return { messageId: 'mock-' + Date.now(), accepted: [to] };
      },
      verify: async () => true,
    };
  }

  return {
    sendMail: async ({ to, subject, html }) => {
      return new Promise((resolve, reject) => {
        const data = JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: EMAIL_FROM.replace(/^.*<(.+)>$/, '$1'), name: EMAIL_FROM.replace(/^(.*)<.+>$/, '$1').trim() },
          subject: subject,
          content: [{ type: 'text/html', value: html }],
        });

        const options = {
          hostname: 'api.sendgrid.com',
          path: '/v3/mail/send',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
          timeout: 15000,
        };

        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ messageId: 'sg-' + Date.now(), accepted: [to] });
            } else {
              let msg = `SendGrid error ${res.statusCode}`;
              try {
                const e = JSON.parse(body);
                msg += ': ' + (e.errors?.[0]?.message || body);
              } catch {
                msg += ': ' + body;
              }
              reject(new Error(msg));
            }
          });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Connection timeout'));
        });
        req.write(data);
        req.end();
      });
    },
    verify: async () => {
      return new Promise((resolve, reject) => {
        const req = https.get('https://api.sendgrid.com/v3/scopes', {
          headers: { Authorization: `Bearer ${SENDGRID_API_KEY}` },
        }, (res) => {
          if (res.statusCode < 300) resolve(true);
          else reject(new Error(`API key invalid (status ${res.statusCode})`));
        });
        req.on('error', reject);
        req.end();
      });
    },
  };
}

// ========== EMAIL TEMPLATES ==========

function confirmationHTML({ name, service, barber, date, time, price, notes }) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
body{font-family:Helvetica,Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.c{max-width:600px;margin:0 auto;background:#fff}
.h{background:linear-gradient(135deg,#6b0f1a,#8b1523);padding:30px;text-align:center}
.h h1{color:#d4af37;margin:0;font-size:28px;letter-spacing:2px}
.h p{color:#fff;margin:5px 0 0;font-size:14px;opacity:.9}
.b{padding:40px 30px}
.b h2{color:#1a1a1a;font-size:22px;text-align:center;margin:0 0 10px}
.st{color:#666;text-align:center;margin:0 0 30px;font-size:16px}
.d{background:#faf9f7;border-radius:12px;padding:25px;margin-bottom:25px}
.dr{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e8e5e0}
.dr:last-child{border-bottom:none}
.dl{color:#888;font-size:14px}
.dv{color:#1a1a1a;font-weight:600;font-size:14px;text-align:right}
.dv.p{color:#6b0f1a;font-size:18px}
.ib{background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:15px;margin-bottom:25px}
.ib p{margin:5px 0;color:#856404;font-size:13px}
.btn{display:block;background:#6b0f1a;color:#fff;text-decoration:none;padding:14px 30px;border-radius:8px;text-align:center;font-weight:600;font-size:16px;margin:25px 0}
.f{background:#f8f8f8;padding:25px 30px;text-align:center;font-size:12px;color:#999}
</style></head>
<body>
<div class="c">
<div class="h"><h1>Mo&Ma</h1><p>Kapsalon & Barbershop</p></div>
<div class="b">
<p style="text-align:center;font-size:48px;margin:0 0 10px;">&#10004;</p>
<h2>Afspraak Bevestigd!</h2>
<p class="st">Bedankt voor je afspraak, ${name}!</p>
<div class="d">
<div class="dr"><span class="dl">Behandeling</span><span class="dv">${service}</span></div>
<div class="dr"><span class="dl">Kapper</span><span class="dv">${barber}</span></div>
<div class="dr"><span class="dl">Datum</span><span class="dv">${date}</span></div>
<div class="dr"><span class="dl">Tijd</span><span class="dv">${time}</span></div>
<div class="dr"><span class="dl">Prijs</span><span class="dv p">${price || 'Zie website'}</span></div>
${notes ? `<div class="dr"><span class="dl">Opmerkingen</span><span class="dv">${notes}</span></div>` : ''}
</div>
<div class="ib">
<p>&#128205; <strong>Adres:</strong> ${SHOP_ADDRESS}</p>
<p>&#128222; <strong>Telefoon:</strong> <a href="tel:${SHOP_PHONE}" style="color:#856404;">${SHOP_PHONE}</a></p>
<p>&#9200; Openingstijden: Ma-Za 08:00-18:00</p>
</div>
<p style="text-align:center;color:#888;font-size:14px;">Afspraak wijzigen of annuleren?<br>Bel <a href="tel:${SHOP_PHONE}" style="color:#6b0f1a;">${SHOP_PHONE}</a></p>
<a href="${SHOP_WEBSITE}" class="btn">Bezoek onze website</a>
</div>
<div class="f">
<p><strong>Mo&Ma Kapsalon</strong></p>
<p>${SHOP_ADDRESS} &middot; ${SHOP_PHONE}</p>
<p><a href="${SHOP_WEBSITE}">${SHOP_WEBSITE}</a> &middot; &copy; ${new Date().getFullYear()}</p>
</div>
</div>
</body></html>`;
}

function reminderHTML({ name, service, barber, date, time }) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
body{font-family:Helvetica,Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
.c{max-width:600px;margin:0 auto;background:#fff}
.h{background:linear-gradient(135deg,#6b0f1a,#8b1523);padding:30px;text-align:center}
.h h1{color:#d4af37;margin:0;font-size:28px;letter-spacing:2px}
.h p{color:#fff;margin:5px 0 0;font-size:14px;opacity:.9}
.b{padding:40px 30px}
.b h2{color:#1a1a1a;font-size:22px;text-align:center;margin:0 0 10px}
.st{color:#666;text-align:center;margin:0 0 30px;font-size:16px}
.d{background:#faf9f7;border-radius:12px;padding:25px;margin-bottom:25px}
.dr{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e8e5e0}
.dr:last-child{border-bottom:none}
.dl{color:#888;font-size:14px}
.dv{color:#1a1a1a;font-weight:600;font-size:14px;text-align:right}
.ib{background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;padding:15px;margin-bottom:25px}
.ib p{margin:5px 0;color:#1565c0;font-size:13px}
.btn{display:block;background:#d4af37;color:#1a1a1a;text-decoration:none;padding:14px 30px;border-radius:8px;text-align:center;font-weight:600;font-size:16px;margin:25px 0}
.cl{text-align:center;margin-top:15px}
.cl a{color:#999;font-size:13px}
.f{background:#f8f8f8;padding:25px 30px;text-align:center;font-size:12px;color:#999}
</style></head>
<body>
<div class="c">
<div class="h"><h1>Mo&Ma</h1><p>Kapsalon & Barbershop</p></div>
<div class="b">
<p style="text-align:center;font-size:48px;margin:0 0 10px;">&#9200;</p>
<h2>Morgen heb je een afspraak!</h2>
<p class="st">Hallo ${name}, dit is een vriendelijke herinnering!</p>
<div class="d">
<div class="dr"><span class="dl">Behandeling</span><span class="dv">${service}</span></div>
<div class="dr"><span class="dl">Kapper</span><span class="dv">${barber}</span></div>
<div class="dr"><span class="dl">Datum</span><span class="dv">${date}</span></div>
<div class="dr"><span class="dl">Tijd</span><span class="dv">${time}</span></div>
</div>
<div class="ib">
<p>&#128205; Adres: W. J. Tuijnstraat 14A, 1131 ZJ Volendam</p>
<p>&#128222; Vragen? Bel ${SHOP_PHONE}</p>
</div>
<a href="https://barbershop-mo-ma.onrender.com" class="btn">Bekijk website</a>
<div class="cl"><a href="https://barbershop-mo-ma.onrender.com">Afspraak wijzigen/annuleren? Bel ${SHOP_PHONE}</a></div>
</div>
<div class="f"><p><strong>Mo&Ma Kapsalon</strong> &middot; ${SHOP_ADDRESS} &middot; ${SHOP_PHONE}</p>
<p><a href="${SHOP_WEBSITE}">${SHOP_WEBSITE}</a> &middot; &copy; ${new Date().getFullYear()}</p>
</div>
</div>
</body></html>`;
}

// ========== EXPORT ==========

async function sendConfirmationEmail({ email, name, service, barber, date, time, price, notes }) {
  if (!email) {
    console.log('Geen email - sla bevestiging over');
    return { success: false };
  }
  try {
    const t = createTransporter();
    const info = await t.sendMail({
      to: email,
      subject: `Afspraak bevestigd - Mo&Ma Kapsalon - ${date} om ${time}`,
      html: confirmationHTML({ name, service, barber, date, time, price, notes }),
    });
    console.log(`Bevestigingsmail naar ${email} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Fout bevestigingsmail naar ${email}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function sendReminderEmail({ email, name, service, barber, date, time }) {
  if (!email) return { success: false };
  try {
    const t = createTransporter();
    const info = await t.sendMail({
      to: email,
      subject: `Herinnering: morgen ${time} bij Mo&Ma Kapsalon!`,
      html: reminderHTML({ name, service, barber, date, time }),
    });
    console.log(`Reminder naar ${email} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Fout reminder naar ${email}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function verifyEmailConfig() {
  if (!SENDGRID_API_KEY) {
    console.warn('Geen SENDGRID_API_KEY - emails naar console');
    return false;
  }
  try {
    const t = createTransporter();
    await t.verify();
    console.log('Email configuratie (SendGrid) OK');
    return true;
  } catch (error) {
    console.error('Email configuratie fout:', error.message);
    return false;
  }
}

module.exports = { sendConfirmationEmail, sendReminderEmail, verifyEmailConfig };
