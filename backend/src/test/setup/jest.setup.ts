import { startMongoMemoryServer, stopMongoMemoryServer, clearDatabase } from "@/test/setup/mongoMemoryServer.setup";
import redis from "@/config/redis"; // Redis client mock

// قبل از همه تست‌ها
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "testsecret";
  await startMongoMemoryServer();
});

// بعد از هر تست، دیتابیس و Redis پاک شود
afterEach(async () => {
  await clearDatabase();
  await redis.flushall();
  jest.clearAllMocks();
});

// بعد از همه تست‌ها، اتصال‌ها بسته شود
afterAll(async () => {
  await stopMongoMemoryServer();
  await redis.quit();
});
