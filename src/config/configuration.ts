export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY,
  },
});
