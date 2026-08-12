const String kBaseUrl = 'http://10.0.2.2:3001/api/v1';
// iOS simulator: use 'http://localhost:3001/api/v1'

// Increased timeouts for external image loading (Unsplash, etc)
const int kConnectTimeoutMs = 30000;
const int kReceiveTimeoutMs = 60000;

const String kAccessTokenKey = 'access_token';
const String kRefreshTokenKey = 'refresh_token';
const String kUserJsonKey = 'user_json';
