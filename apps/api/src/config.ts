import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  gotenbergUrl: process.env.GOTENBERG_URL || "http://localhost:3001",
  uploadTempDir: process.env.UPLOAD_TEMP_DIR || "./uploads_temp",
};
