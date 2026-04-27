/**
 * Email Configuratie voor Mo&Ma Barbershop
 * 
 * Gebruik:
 * 1. Lokaal: zet environment variabelen of gebruik .env bestand
 * 2. Render: zet de variabelen in de Environment sectie
 * 
 * Aangeraden email services (gratis tier):
 * - SendGrid: https://sendgrid.com (100 emails/dag gratis)
 * - Resend: https://resend.com (100 emails/dag gratis)  
 * - Brevo (Sendinblue): https://brevo.com (300 emails/dag gratis)
 * - Gmail SMTP: voor kleine volumes met App Passwords
 */

const nodemailer = require('nodemailer');

// ========== CONFIGURATIE ==========
// Zet deze variabelen in Render (Environment) of lokaal in command line:
// Windows (cmd): set EMAIL_HOST=smtp.gmail.com
// Windows (pwsh): $env:EMAIL_HOST="smtp.gmail.com"

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';  // App Password voor Gmail
const EMAIL_FROM = process.env.EMAIL_FROM || 'Mo&Ma Kapsalon <info@barbershop-moma.nl>';

// Winkel informatie
const SHOP_NAME = 'Mo&Ma Kapsalon';
const SHOP_ADDRESS = 'W. J. Tuijnstraat 14A, 1131 ZJ Volendam';
const SHOP_PHONE = '06-85171198';
const SHOP_WEBSITE = 'https://barbershop-mo-ma.onrender.com';

// ========== TRANSPORTER ==========

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Als er geen email credentials zijn, gebruik een log-only transporter (voor lokale testing)
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('⚠️  Geen email credentials ingesteld. Emails worden alleen naar console gelogd.');
    console.warn(`   Stel EMAIL_USER en EMAIL_PASS in voor echte emails.`);
    
    // Maak een "mock" transporter die alleen logged
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('📧 [MOCK EMAIL] ─' + '─'.repeat(50));
        console.log(`   To: ${mailOptions.to}`);
        console.log(`   Subject: ${mailOptions.subject}`);
        console.log(`   Body: (HTML email - check logs)`);
        console.log('   ' + '─'.repeat(60));
        return { messageId: 'mock-' + Date.now(), accepted: [mailOptions.to] };
      },
      verify: async () => true
    };
    return transporter;
  }

  // Echte transporter aanmaken
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true voor 465, false voor 587
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  return transporter;
}

// ========== EMAIL TEMPLATES ==========

/**
 * Genereert HTML template voor bevestigingsmail
 */
function confirmationEmailTemplate({ name, service, barber, date, time, price, notes }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #6b0f1a 0%, #8b1523 100%); padding: 30px; text-align: center; }
    .header h1 { color: #d4af37; margin: 0; font-size: 28px; letter-spacing: 2px; }
    .header p { color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
    .body-content { padding: 40px 30px; }
    .checkmark { text-align: center; margin-bottom: 20px; }
    .checkmark-circle { width: 64px; height: 64px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
    .checkmark-circle span { font-size: 32px; }
    h2 { color: #1a1a1a; font-size: 22px; margin: 0 0 10px 0; text-align: center; }
    .subtitle { color: #666; text-align: center; margin-bottom: 30px; font-size: 16px; }
    .details { background: #faf9f7; border-radius: 12px; padding: 25px; margin-bottom: 25px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e8e5e0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #888; font-size: 14px; }
    .detail-value { color: #1a1a1a; font-weight: 600; font-size: 14px; text-align: right; }
    .detail-value.price { color: #6b0f1a; font-size: 18px; }
    .info-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
    .info-box p { margin: 5px 0; color: #856404; font-size: 13px; }
    .button { display: block; background: #6b0f1a; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 16px; margin: 25px 0; }
    .button:hover { background: #8b1523; }
    .footer { background: #f8f8f8; padding: 25px 30px; text-align: center; font-size: 12px; color: #999; }
    .footer a { color: #6b0f1a; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .body-content { padding: 25px 20px; }
      .detail-row { flex-direction: column; gap: 3px; }
      .detail-value { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mo&Ma</h1>
      <p>Kapsalon & Barbershop</p>
    </div>
    
    <div class="body-content">
      <div class="checkmark">
        <div class="checkmark-circle">
          <span>✅</span>
        </div>
      </div>
      
      <h2>Afspraak Bevestigd! ✂️</h2>
      <p class="subtitle">Bedankt voor je afspraak, ${name}!</p>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Behandeling</span>
          <span class="detail-value">${service}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Kapper</span>
          <span class="detail-value">${barber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Datum</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tijd</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Prijs</span>
          <span class="detail-value price">${price || 'Zie website'}</span>
        </div>
        ${notes ? `
        <div class="detail-row">
          <span class="detail-label">Opmerkingen</span>
          <span class="detail-value">${notes}</span>
        </div>` : ''}
      </div>
      
      <div class="info-box">
        <p>📍 <strong>Adres:</strong> ${SHOP_ADDRESS}</p>
        <p>📞 <strong>Telefoon:</strong> <a href="tel:${SHOP_PHONE}" style="color:#856404;">${SHOP_PHONE}</a></p>
        <p>⏰ <strong>Openingstijden:</strong> Ma t/m Za · 08:00 - 18:00</p>
      </div>
      
      <p style="text-align:center;color:#888;font-size:14px;">
        Wil je je afspraak wijzigen of annuleren?<br>
        Bel ons op <a href="tel:${SHOP_PHONE}" style="color:#6b0f1a;">${SHOP_PHONE}</a>
      </p>
      
      <a href="${SHOP_WEBSITE}" class="button">Bezoek onze website</a>
    </div>
    
    <div class="footer">
      <p><strong>Mo&Ma Kapsalon</strong></p>
      <p>${SHOP_ADDRESS}</p>
      <p>${SHOP_PHONE} · <a href="${SHOP_WEBSITE}">${SHOP_WEBSITE}</a></p>
      <p style="margin-top:15px;">&copy; ${new Date().getFullYear()} Mo&Ma Kapsalon. Alle rechten voorbehouden.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Genereert HTML template voor reminder email (24u van tevoren)
 */
function reminderEmailTemplate({ name, service, barber, date, time }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #6b0f1a 0%, #8b1523 100%); padding: 30px; text-align: center; }
    .header h1 { color: #d4af37; margin: 0; font-size: 28px; letter-spacing: 2px; }
    .header p { color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
    .body-content { padding: 40px 30px; }
    .reminder-icon { text-align: center; margin-bottom: 20px; }
    .reminder-icon-circle { width: 64px; height: 64px; background: #fff3cd; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
    .reminder-icon-circle span { font-size: 32px; }
    h2 { color: #1a1a1a; font-size: 22px; margin: 0 0 10px 0; text-align: center; }
    .subtitle { color: #666; text-align: center; margin-bottom: 30px; font-size: 16px; }
    .details { background: #faf9f7; border-radius: 12px; padding: 25px; margin-bottom: 25px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e8e5e0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #888; font-size: 14px; }
    .detail-value { color: #1a1a1a; font-weight: 600; font-size: 14px; text-align: right; }
    .info-box { background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
    .info-box p { margin: 5px 0; color: #1565c0; font-size: 13px; }
    .button { display: block; background: #d4af37; color: #1a1a1a; text-decoration: none; padding: 14px 30px; border-radius: 8px; text-align: center; font-weight: 600; font-size: 16px; margin: 25px 0; }
    .button:hover { background: #c9a030; }
    .cancel-link { text-align: center; margin-top: 15px; }
    .cancel-link a { color: #999; font-size: 13px; }
    .footer { background: #f8f8f8; padding: 25px 30px; text-align: center; font-size: 12px; color: #999; }
    @media only screen and (max-width: 480px) {
      .body-content { padding: 25px 20px; }
      .detail-row { flex-direction: column; gap: 3px; }
      .detail-value { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mo&Ma</h1>
      <p>Kapsalon & Barbershop</p>
    </div>
    
    <div class="body-content">
      <div class="reminder-icon">
        <div class="reminder-icon-circle">
          <span>⏰</span>
        </div>
      </div>
      
      <h2>Morgen heb je een afspraak!</h2>
      <p class="subtitle">Hallo ${name}, dit is een vriendelijke herinnering!</p>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Behandeling</span>
          <span class="detail-value">${service}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Kapper</span>
          <span class="detail-value">${barber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Datum</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tijd</span>
          <span class="detail-value">${time}</span>
        </div>
      </div>
      
      <div class="info-box">
        <p>📍 <strong>Adres:</strong> W. J. Tuijnstraat 14A, 1131 ZJ Volendam</p>
        <p>📞 <strong>Vragen? Bel ons:</strong> 06-85171198</p>
        <p>💡 <strong>Tip:</strong> Kom op tijd, dan heb je de meeste keuze uit stoelen!</p>
      </div>
      
      <a href="https://barbershop-mo-ma.onrender.com" class="button">Bekijk onze website</a>
      
      <div class="cancel-link">
        <a href="https://barbershop-mo-ma.onrender.com">Afspraak wijzigen of annuleren? Bel 06-85171198</a>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Mo&Ma Kapsalon</strong> · W. J. Tuijnstraat 14A, Volendam · 06-85171198</p>
      <p>&copy; ${new Date().getFullYear()} Mo&Ma Kapsalon</p>
    </div>
  </div>
</body>
</html>`;
}

// ========== EMAIL FUNCTIES ==========

/**
 * Verstuur bevestigingsmail na het maken van een afspraak
 */
async function sendConfirmationEmail({ email, name, service, barber, date, time, price, notes }) {
  if (!email) {
    console.log(`📧 Geen email voor ${name} - sla bevestiging over`);
    return { success: false, reason: 'no-email' };
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: `✅ Afspraak bevestigd - Mo&Ma Kapsalon - ${date} om ${time}`,
      html: confirmationEmailTemplate({ name, service, barber, date, time, price, notes }),
    });

    console.log(`✅ Bevestigingsmail verstuurd naar ${email} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Fout bij versturen bevestigingsmail naar ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verstuur reminder email 24 uur voor afspraak
 */
async function sendReminderEmail({ email, name, service, barber, date, time }) {
  if (!email) {
    return { success: false, reason: 'no-email' };
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: `⏰ Herinnering: morgen ${time} bij Mo&Ma Kapsalon!`,
      html: reminderEmailTemplate({ name, service, barber, date, time }),
    });

    console.log(`✅ Reminder mail verstuurd naar ${email} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Fout bij versturen reminder naar ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verifieer email configuratie
 */
async function verifyEmailConfig() {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ Email configuratie is correct');
    return true;
  } catch (error) {
    console.error('❌ Email configuratie fout:', error.message);
    return false;
  }
}

module.exports = {
  sendConfirmationEmail,
  sendReminderEmail,
  verifyEmailConfig,
};
