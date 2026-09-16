export const isSessionInvalidStatus: (status: number) => boolean;

export const shouldRefreshAfterResponse: (input: {
  status: number;
  auth: 'access' | 'none';
  retry: boolean;
}) => boolean;
