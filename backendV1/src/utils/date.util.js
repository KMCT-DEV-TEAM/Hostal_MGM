/**
 * Date/Time Utilities for standardizing Asia/Kolkata (IST) timezone conversions.
 * Ensures consistent handling of user inputs regardless of the server's local timezone.
 */

// Interpret a date string (YYYY-MM-DD) as midnight in IST and convert to UTC Date
export const parseISTDateStart = (dateStr) => {
  return new Date(`${dateStr}T00:00:00+05:30`);
};

// Interpret a date string (YYYY-MM-DD) as end-of-day in IST and convert to UTC Date
export const parseISTDateEnd = (dateStr) => {
  return new Date(`${dateStr}T23:59:59+05:30`);
};

// Interpret a date string (YYYY-MM-DD) and time string (HH:mm) as IST and convert to UTC Date
export const parseISTDateTime = (dateStr, timeStr) => {
  return new Date(`${dateStr}T${timeStr}:00+05:30`);
};

// Get today's start boundary in IST as a UTC Date
export const getTodayISTStart = () => {
  const now = new Date();
  const todayISTStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return parseISTDateStart(todayISTStr);
};

// Extract the "HH:mm" time string in IST from a Date object
export const getISTTimeStr = (date) => {
  if (!date) return undefined;
  const istStr = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
  // Ensure it's in the format "HH:mm"
  return istStr.substring(0, 5); 
};
