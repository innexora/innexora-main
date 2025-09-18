// WebSocket configuration for Socket.IO client
export const getSocketUrl = (): string => {
  // Use environment variable for production
  if (process.env.NEXT_PUBLIC_API_URL) {
    // Convert HTTP API URL to WebSocket URL
    // https://innexora-backend-api.azurewebsites.net/api -> https://innexora-backend-api.azurewebsites.net
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  }
  
  // Development fallback
  return 'http://localhost:5050';
};

export const socketConfig = {
  transports: ["websocket", "polling"],
  timeout: 20000,
  forceNew: true,
};