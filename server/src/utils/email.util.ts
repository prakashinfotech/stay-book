import { logger } from '../common/utils/logger';

interface BookingConfirmationData {
  to: string;
  guestName: string;
  confirmationNumber: string;
  pin: string;
  propertyName: string;
  checkin: string;
  checkout: string;
  totalPrice: number;
}

interface OtpEmailData {
  to: string;
  code: string;
}

/**
 * Sends a booking confirmation email.
 * Phase 2: replace logger.info with Resend/Nodemailer call.
 */
export async function sendBookingConfirmation(data: BookingConfirmationData): Promise<void> {
  logger.info('[DEV] Booking confirmation email', {
    to: data.to,
    confirmationNumber: data.confirmationNumber,
  });
  // Phase 2: await resend.emails.send({ from, to: data.to, subject, html })
}

/**
 * Sends an OTP verification email.
 * Phase 2: replace logger.info with Resend/Nodemailer call.
 */
export async function sendOtpEmail(data: OtpEmailData): Promise<void> {
  logger.info(`[DEV] OTP email to ${data.to}: ${data.code}`);
  // Phase 2: await resend.emails.send({ from, to: data.to, subject: 'Your OTP', html })
}

export async function sendCancellationEmail(to: string, confirmationNumber: string): Promise<void> {
  logger.info('[DEV] Cancellation email', { to, confirmationNumber });
}
