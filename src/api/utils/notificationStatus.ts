import { CommunicationStatus } from '../types/notification';

export const getInitialCommunicationStatus = (): CommunicationStatus => ({
  sent: false,
  timestamp: ''
});

export const getConsideredColor = (status: CommunicationStatus) => {
  if (status.sent) {
    return 'bg-green-100 text-green-600';
  }
  return 'bg-gray-100 text-gray-600';
};