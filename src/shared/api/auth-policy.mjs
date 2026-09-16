export const isSessionInvalidStatus = (status) => status === 401 || status === 403;

export const shouldRefreshAfterResponse = ({ status, auth, retry }) => {
  return status === 401 && auth === 'access' && retry === true;
};
