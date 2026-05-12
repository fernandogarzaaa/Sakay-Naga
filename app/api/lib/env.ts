import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function appSecret() {
  const value = process.env.APP_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: APP_SECRET");
  }
  return "sakay-naga-development-secret-change-before-production";
}

export const env = {
  appSecret: appSecret(),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "",
};
