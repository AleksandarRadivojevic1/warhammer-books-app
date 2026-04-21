const required = [
  'MONGO_URI',
  'WARHAMMER_API_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_ORIGIN',
  'RESEND_API_KEY',
  'APP_URL',
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

module.exports = {
  mongoUri: process.env.MONGO_URI,
  warhammerApiUrl: process.env.WARHAMMER_API_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  resendApiKey: process.env.RESEND_API_KEY,
  appUrl: process.env.APP_URL,
  port: parseInt(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
};
