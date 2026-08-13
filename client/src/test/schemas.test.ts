import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
});

const guestDetailsSchema = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  email: z.string().email(),
  phone: z.string().min(5),
  country: z.string().min(2),
  specialRequests: z.string().max(500).optional(),
  arrivalTime: z.string().optional(),
  isMainGuest: z.boolean().default(true),
});

const paymentSchema = z.object({
  cardholderName: z.string().min(2),
  cardNumber: z.string().regex(/^\d{16}$/, 'Enter 16 digits'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cvc: z.string().regex(/^\d{3}$/, '3-digit CVC required'),
  simulateFailure: z.boolean().optional(),
});

describe('loginSchema', () => {
  it('parses valid credentials and lowercases email', () => {
    const result = loginSchema.parse({ email: 'User@Example.COM', password: 'secret' });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects missing email', () => {
    expect(() => loginSchema.parse({ password: 'secret' })).toThrow();
  });

  it('rejects invalid email format', () => {
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'secret' })).toThrow();
  });
});

describe('registerSchema', () => {
  it('parses valid registration data', () => {
    const result = registerSchema.parse({
      email: 'user@example.com',
      password: 'Password1',
    });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects password without uppercase letter', () => {
    expect(() => registerSchema.parse({ email: 'u@x.com', password: 'password1' })).toThrow(
      /uppercase/i,
    );
  });

  it('rejects password without digit', () => {
    expect(() => registerSchema.parse({ email: 'u@x.com', password: 'PasswordOnly' })).toThrow(
      /digit/i,
    );
  });

  it('rejects password shorter than 8 chars', () => {
    expect(() => registerSchema.parse({ email: 'u@x.com', password: 'P1a' })).toThrow();
  });
});

describe('guestDetailsSchema', () => {
  const validGuest = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '9876543210',
    country: 'IN',
    isMainGuest: true,
  };

  it('parses valid guest details', () => {
    const result = guestDetailsSchema.parse(validGuest);
    expect(result.firstName).toBe('John');
  });

  it('rejects missing required fields', () => {
    expect(() => guestDetailsSchema.parse({ ...validGuest, email: undefined })).toThrow();
  });

  it('rejects specialRequests over 500 chars', () => {
    expect(() =>
      guestDetailsSchema.parse({ ...validGuest, specialRequests: 'x'.repeat(501) }),
    ).toThrow();
  });

  it('defaults isMainGuest to true when not provided', () => {
    const { isMainGuest: _, ...without } = validGuest;
    const result = guestDetailsSchema.parse(without);
    expect(result.isMainGuest).toBe(true);
  });
});

describe('paymentSchema', () => {
  const validPayment = {
    cardholderName: 'John Doe',
    cardNumber: '4111111111111111',
    expiry: '12/26',
    cvc: '123',
  };

  it('parses valid payment data', () => {
    const result = paymentSchema.parse(validPayment);
    expect(result.cardNumber).toBe('4111111111111111');
  });

  it('rejects 15-digit card number', () => {
    expect(() => paymentSchema.parse({ ...validPayment, cardNumber: '411111111111111' })).toThrow(
      /16 digits/,
    );
  });

  it('rejects non-numeric card number', () => {
    expect(() =>
      paymentSchema.parse({ ...validPayment, cardNumber: '4111111111111abc' }),
    ).toThrow();
  });

  it('rejects invalid expiry format', () => {
    expect(() => paymentSchema.parse({ ...validPayment, expiry: '1226' })).toThrow(/MM\/YY/);
  });

  it('rejects 4-digit CVC', () => {
    expect(() => paymentSchema.parse({ ...validPayment, cvc: '1234' })).toThrow(/3-digit/);
  });
});
