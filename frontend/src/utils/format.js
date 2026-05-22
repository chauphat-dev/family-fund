export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatToken = (amount, symbol = 'XLM') => {
  return `${new Intl.NumberFormat('en-US').format(amount)} ${symbol}`;
};

export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  // Soroban timestamp is in seconds, convert to ms
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const rtf = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' });
  const daysDifference = Math.round(((timestamp * 1000) - Date.now()) / (1000 * 60 * 60 * 24));
  return rtf.format(daysDifference, 'day');
};

export const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
