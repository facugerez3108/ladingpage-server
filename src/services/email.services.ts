import sgMail from "@sendgrid/mail";
import config from "../config/config";
import logger from "../config/logger";

sgMail.setApiKey(config.email.apiKey);

const sendEmail = async (to: string, subject: string, text: string) => {
  const msg = { from: config.email.from, to, subject, text };
  try {
    await sgMail.send(msg);
    logger.info("Mensaje enviado: %s", msg);
  } catch (error) {
    // Manejo de error de tipo 'unknown'
    if (error instanceof Error) {
      if ('response' in error && error.response) {
        // La respuesta de SendGrid está en error.response.body
        const responseError = error as { response: { body: unknown } };
        logger.error("Error al enviar el correo:", responseError.response.body);
        console.error("Error al enviar el correo:", responseError.response.body);
      } else {
        logger.error("Error al enviar el correo:", error.message);
        console.error("Error al enviar el correo:", error.message);
      }
    } else {
      logger.error("Error desconocido al enviar el correo:", error);
      console.error("Error desconocido al enviar el correo:", error);
    }
    throw error;
  }
};

const sendResetPasswordEmail = async (to: string, token: string) => {
  const subject = "Restablecer contraseña";
  const resetPasswordUrl = `http://localhost:3001/reset-password/${token}`;
  const text = `Estimado usuario,
  Para restablecer tu contraseña, haz clic en este enlace: ${resetPasswordUrl}
  Si no solicitaste ningún restablecimiento de contraseña, ignora este correo.`;

  try {
    console.log("Enviando correo a:", to);
    await sendEmail(to, subject, text);
    console.log("Correo enviado exitosamente");
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
};

const sendVerificationEmail = async (to: string, token: string) => {
  const subject = "Verificación de correo electrónico";
  const verificationEmailUrl = `http://localhost:3001/verify-email/${token}`;
  const text = `Estimado usuario,
  Para verificar tu correo electrónico, haz clic en este enlace: ${verificationEmailUrl}`;

  try {
    await sendEmail(to, subject, text);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
};

export default {
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};