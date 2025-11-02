export const redisClient = {
  get: jest.fn(async (key: string) => {
    if (key === "refresh_token") return "mocked_refresh_token";
    return null;
  }),
  set: jest.fn(async (key: string, value: string) => {
    return "OK";
  }),
  del: jest.fn(async (key: string) => {
    return 1;
  }),
  connect: jest.fn(async () => Promise.resolve()),
  quit: jest.fn(async () => Promise.resolve()),
  on: jest.fn(async () => Promise.resolve()),
};
