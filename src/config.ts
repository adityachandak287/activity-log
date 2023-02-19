export const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  SECRET: process.env.SECRET,
  SUMMARY_WINDOW_DAYS: Number(process.env.SUMMARY_WINDOW_DAYS || 7),
};
