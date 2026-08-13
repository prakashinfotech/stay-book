import axios from 'axios';

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Server is not responding. Please check your connection and try again.';
    }
    if (!error.response) {
      return 'Cannot connect to server. Please try again.';
    }
    return (
      error.response.data?.error?.message ??
      error.message ??
      'Something went wrong'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Network error. Please try again.';
}

export function getApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.code ?? null;
  }
  return null;
}
