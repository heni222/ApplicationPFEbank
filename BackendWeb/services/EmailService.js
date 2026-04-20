const { sendMail } = require('../Email'); // ou le chemin vers votre fichier existant

class EmailService {
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Vérification d'email</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.firstName} ${user.lastName},</h2>
            <p>Merci de vous être inscrit sur notre plateforme. Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Vérifier mon email</a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez également copier et coller le lien suivant dans votre navigateur :</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            
            <p>Ce lien est valable pendant 24 heures.</p>
            
            <p>Si vous n'avez pas créé de compte sur notre plateforme, veuillez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Votre Application. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendMail({
        to: user.email,
        subject: 'Vérifiez votre adresse email',
        html
      });
      
      console.log(`✅ Email de vérification envoyé à ${user.email}`);
    } catch (error) {
      console.error(`❌ Erreur envoi email à ${user.email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.firstName},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour procéder :</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez également copier et coller le lien suivant dans votre navigateur :</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            
            <p>Ce lien est valable pendant 1 heure.</p>
            
            <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Votre Application. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendMail({
        to: user.email,
        subject: 'Réinitialisation de mot de passe',
        html
      });
      
      console.log(`✅ Email de réinitialisation envoyé à ${user.email}`);
    } catch (error) {
      console.error(`❌ Erreur envoi email à ${user.email}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const loginUrl = `${process.env.FRONTEND_URL}/auth/login`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur notre plateforme !</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${user.firstName} ${user.lastName},</h2>
            <p>Nous sommes ravis de vous accueillir sur notre plateforme ! Votre compte a été vérifié avec succès.</p>
            
            <p>Vous pouvez maintenant vous connecter et commencer à utiliser tous nos services.</p>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Se connecter</a>
            </div>
            
            <p>Si vous avez des questions, n'hésitez pas à consulter notre FAQ ou à contacter notre support.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Votre Application. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendMail({
        to: user.email,
        subject: 'Bienvenue sur notre plateforme !',
        html
      });
      
      console.log(`✅ Email de bienvenue envoyé à ${user.email}`);
    } catch (error) {
      console.error(`❌ Erreur envoi email de bienvenue à ${user.email}:`, error);
      // Ne pas bloquer le processus pour l'email de bienvenue
    }
  }
}

// Exporter une instance unique
module.exports = new EmailService();