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

export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const capitalize = (str) => {
  if (!str) return null;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatDateTime = (date) => {
    if (!date) return null;
    return `${formatDate(date)} | ${formatTime(date)}`;
};
