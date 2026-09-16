const getBrowserName = (userAgent: string) => {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent) && /Version\//.test(userAgent)) return 'Safari';
  return 'Browser';
};

const getOsName = (userAgent: string) => {
  if (/Android/.test(userAgent)) return 'Android';
  if (/(iPhone|iPad|iPod)/.test(userAgent)) return 'iOS';
  if (/Windows NT/.test(userAgent)) return 'Windows';
  if (/(Macintosh|Mac OS X)/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Unknown device';
};

export const getSessionDeviceLabel = (userAgent: string | null) => {
  if (!userAgent) return 'Unknown device';
  return `${getBrowserName(userAgent)} · ${getOsName(userAgent)}`;
};

export const formatSessionDate = (value: string) => {
  return new Date(value).toLocaleString();
};
