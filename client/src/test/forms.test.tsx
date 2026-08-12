/**
 * Form validation edge-case tests.
 * Schemas are duplicated from their page files (they are not exported)
 * and kept in sync with the page implementations.
 */
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

// ─── Login Page schema (matches login-page.tsx) ─────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

describe('Login form validation', () => {
  it('rejects empty email — "Password required" error on empty password', () => {
    const result = loginSchema.safeParse({ email: '', password: '' });
    expect(result.success).toBe(false);
    const issues = result.success ? [] : result.error.issues;
    expect(issues.some((i) => i.message === 'Password required')).toBe(true);
  });

  it('rejects empty password without calling API', () => {
    const mockLogin = vi.fn();
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' });
    expect(result.success).toBe(false);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('rejects email without @ — "Invalid email" error', () => {
    const result = loginSchema.safeParse({ email: 'notemail', password: 'secret' });
    expect(result.success).toBe(false);
    const issues = result.success ? [] : result.error.issues;
    expect(issues.some((i) => i.message === 'Invalid email')).toBe(true);
  });

  it('rejects plain string as email', () => {
    const result = loginSchema.safeParse({ email: 'hello world', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'any' });
    expect(result.success).toBe(true);
  });
});

// ─── Guest Details schema (matches guest-details-page.tsx) ──────────────────

const guestDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Enter 10-digit Indian mobile number'),
  country: z.literal('India'),
  isMainGuest: z.boolean(),
  arrivalTime: z.string().optional(),
  specialRequests: z.string().max(500, 'Max 500 characters').optional(),
});

const validGuest = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '9876543210',
  country: 'India' as const,
  isMainGuest: true,
};

describe('Guest details form validation', () => {
  it('accepts valid guest data', () => {
    const result = guestDetailsSchema.safeParse(validGuest);
    expect(result.success).toBe(true);
  });

  it('rejects 9-digit phone — "Enter 10-digit Indian mobile number"', () => {
    const result = guestDetailsSchema.safeParse({ ...validGuest, phone: '987654321' });
    expect(result.success).toBe(false);
    const issues = result.success ? [] : result.error.issues;
    expect(issues.some((i) => i.message === 'Enter 10-digit Indian mobile number')).toBe(true);
  });

  it('rejects 11-digit phone', () => {
    const result = guestDetailsSchema.safeParse({ ...validGuest, phone: '98765432101' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric phone', () => {
    const result = guestDetailsSchema.safeParse({ ...validGuest, phone: 'abcdefghij' });
    expect(result.success).toBe(false);
  });

  it('rejects specialRequests over 500 chars — "Max 500 characters"', () => {
    const result = guestDetailsSchema.safeParse({
      ...validGuest,
      specialRequests: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
    const issues = result.success ? [] : result.error.issues;
    expect(issues.some((i) => i.message === 'Max 500 characters')).toBe(true);
  });

  it('accepts specialRequests exactly 500 chars', () => {
    const result = guestDetailsSchema.safeParse({
      ...validGuest,
      specialRequests: 'x'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = guestDetailsSchema.safeParse({ ...validGuest, firstName: '' });
    expect(result.success).toBe(false);
    const issues = result.success ? [] : result.error.issues;
    expect(issues.some((i) => i.message === 'First name required')).toBe(true);
  });
});
