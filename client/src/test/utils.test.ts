import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { getApiError, getApiErrorCode } from '../utils/error';

function makeAxiosError(data: unknown, status = 400) {
  const err = new axios.AxiosError('Request failed');
  err.response = { data, status, statusText: 'Error', headers: {}, config: {} as any };
  return err;
}

describe('getApiError', () => {
  it('extracts message from nested error.message field', () => {
    const err = makeAxiosError({ error: { message: 'Email already registered' } });
    expect(getApiError(err)).toBe('Email already registered');
  });

  it('falls back to axios error.message when response has no error field', () => {
    const err = new axios.AxiosError('Network Error');
    expect(getApiError(err)).toBe('Cannot connect to server. Please try again.');
  });

  it('returns error.message for plain Error instances', () => {
    expect(getApiError(new Error('Something failed'))).toBe('Something failed');
  });

  it('returns a fallback for unknown non-error values', () => {
    expect(getApiError('string error')).toBe('Network error. Please try again.');
  });

  it('returns timeout message for ECONNABORTED', () => {
    const err = new axios.AxiosError('timeout of 10000ms exceeded');
    err.code = 'ECONNABORTED';
    expect(getApiError(err)).toMatch(/not responding/i);
  });
});

describe('getApiErrorCode', () => {
  it('extracts error code from response', () => {
    const err = makeAxiosError({ error: { code: 'EMAIL_IN_USE', message: 'Already exists' } });
    expect(getApiErrorCode(err)).toBe('EMAIL_IN_USE');
  });

  it('returns null for non-Axios errors', () => {
    expect(getApiErrorCode(new Error('plain error'))).toBeNull();
  });

  it('returns null when error.code is absent', () => {
    const err = makeAxiosError({ error: { message: 'Some error' } });
    expect(getApiErrorCode(err)).toBeNull();
  });
});
