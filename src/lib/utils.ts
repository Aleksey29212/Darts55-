import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateSource: any): string {
  if (!dateSource) return '';

  let date: Date;

  // Handle Firestore Timestamp object which has a toDate() method
  if (typeof dateSource === 'object' && dateSource !== null && typeof dateSource.toDate === 'function') {
    date = dateSource.toDate();
  } else {
    // Handle ISO string or Date object
    date = new Date(dateSource);
  }

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'NaN.NaN.NaN';
  }

  // Using getUTCDate, getUTCMonth, getUTCFullYear to avoid timezone issues between server and client
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
}


export function safeNumber(value: any): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}
