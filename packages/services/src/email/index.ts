// Configuration
export { getEmailConfig, setEmailConfig, resetEmailConfig } from "./config.js";
export type { EmailConfig } from "./config.js";

// Client
export { getResendClient, sendEmailWithResend } from "./client.js";
export type { SendEmailOptions, SendEmailResult } from "./client.js";

// Sender
export { sendEmail, sendRawEmail } from "./sender.js";
export type { EmailTemplate, TemplateProps, SendEmailOptions as SendEmailOptionsFromSender } from "./sender.js";

export { WelcomeEmail, renderWelcomeEmail } from "./templates/welcome-email.js";
export type { WelcomeEmailProps } from "./templates/welcome-email.js";

export { PasswordResetEmail, renderPasswordResetEmail } from "./templates/password-reset-email.js";
export type { PasswordResetEmailProps } from "./templates/password-reset-email.js";

export { VerificationEmail, renderVerificationEmail } from "./templates/verification-email.js";
export type { VerificationEmailProps } from "./templates/verification-email.js";

export { NotificationEmail, renderNotificationEmail } from "./templates/notification-email.js";
export type { NotificationEmailProps } from "./templates/notification-email.js";

export { InvitationEmail, renderInvitationEmail } from "./templates/invitation-email.js";
export type { InvitationEmailProps } from "./templates/invitation-email.js";

export { ThankYouEmail, renderThankYouEmail } from "./templates/thank-you-email.js";
export type { ThankYouEmailProps } from "./templates/thank-you-email.js";

export { TableEmail, renderTableEmail } from "./templates/table-email.js";
export type { TableEmailProps } from "./templates/table-email.js";

export { ContactFormEmail, renderContactFormEmail } from "./templates/contact-form-email.js";
export type { ContactFormEmailProps } from "./templates/contact-form-email.js";
