/**
 * Centralized Formatter Utilities
 */

// Time formatting: 12:30 PM
export const formatTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  let hours = d.getHours();
  let minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

// Date ISO formatting: 2026-07-06
export const formatDateISO = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

// Date Standard formatting: 06-07-2026 (or custom based on format)
export const formatDateStandard = (date, format = "DD-MM-YYYY") => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "N/A";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  switch (format) {
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    default:
      return `${day}-${month}-${year}`;
  }
};

// Date Readable formatting: Jul 6, 2026
export const formatDateReadable = (dateString) => {
    if (!dateString) return '-----';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '-----';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// DateTime Standard formatting: 2026-07-06 | 12:30 PM
export const formatDateTimeStandard = (date) => {
    if (!date) return null;
    return `${formatDateISO(date)} | ${formatTime(date)}`;
};

// DateTime Readable formatting: Jul 6, 2026, 12:30 PM
export const formatDateTimeReadable = (dateString) => {
    if (!dateString) return '-----';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '-----';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

// Day formatting: Monday
export const formatDay = (dateString) => {
    if (!dateString) return '-----';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '-----';
    return d.toLocaleDateString('en-US', { weekday: 'long' });
};

// Relative Time Ago formatting: 2 hours ago
export const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';

    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
};

// Capitalize string
export const capitalize = (str) => {
  if (!str) return null;
  return str.charAt(0).toUpperCase() + str.slice(1);
};
