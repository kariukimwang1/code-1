import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Error handling for missing environment variables
export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not set. Using default value.`);
    return '';
  }
  return value;
}

// Safe JSON parsing
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// Error handling for database connections
export function handleDatabaseError(error: any) {
  console.error('Database error:', error);
  if (process.env.NODE_ENV === 'development') {
    throw new Error(`Database connection failed: ${error.message}`);
  }
  throw new Error('Database connection failed');
}

// Safe date formatting
export function safeDateFormat(date: Date | string | null): string {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
}

// Safe number formatting
export function safeNumberFormat(num: number | string | null, decimals: number = 2): string {
  if (num === null || num === undefined || num === '') return '0';
  try {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(value) ? '0' : value.toFixed(decimals);
  } catch {
    return '0';
  }
}
