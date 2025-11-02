// src/test/integration/auth.controller.int.test.ts
import request from "supertest";
import { createApp } from "@/app";
import { authService } from "@/service/auth.service";

// Mock external dependencies
jest.mock("@/config/redis", () => require("@/test/__mocks__/redisClient.mock"));
jest.mock("@/config/arvans3", () => require("@/test/__mocks__/s3Client.mock"));

// Mock authService
jest.mock("@/service/auth.service", () => ({
  authService: {
    registerStep1: jest.fn(),
    registerStep2: jest.fn(),
    login: jest.fn(),
    logout:jest.fn(),
    forgetPasswordstep1: jest.fn(),
    forgetPasswordstep2: jest.fn(),
    forgetPasswordstep3: jest.fn(),
    changePassword: jest.fn(),
    getAllUsers: jest.fn(),
  },
}));
jest.mock("@/middlewares/loginUser", () => ({
  loginUser: (req: any, res: any, next: any) => next(),
}));
jest.mock("@/middlewares/adminUser", () => ({
  adminUser: (req: any, res: any, next: any) => next(),
}));

jest.setTimeout(60000);

describe("Auth Controller Integration", () => {
  let appInstance: any;

  beforeAll(async () => {
    appInstance = await createApp();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- Register Step1 ----------------
  it("registerStep1 → success", async () => {
    (authService.registerStep1 as jest.Mock).mockResolvedValue({
      message: "step1 success",
    });

    const res = await request(appInstance)
      .post("/api/auth/register/step1")
      .send({
        name: "Sajad",
        numberPhone: "09121234567",
        password: "123456Aa@",
        address: "Tehran mashad",
      });

    expect(authService.registerStep1).toHaveBeenCalledWith({
      name: "Sajad",
      numberPhone: "09121234567",
      password: "123456Aa@",
      address: "Tehran mashad",
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  // ---------------- Register Step2 ----------------
  it("registerStep2 → success", async () => {
    (authService.registerStep2 as jest.Mock).mockResolvedValue({
      message: "step2 success",
    });

    const res = await request(appInstance)
      .post("/api/auth/register/step2")
      .send({ otp: "123456" });

    expect(authService.registerStep2).toHaveBeenCalledWith({
      otp: "123456",
    });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  // ---------------- Login ----------------
  it("login → success", async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      message: "login success",
    });

    const res = await request(appInstance)
      .post("/api/auth/login")
      .send({ numberPhone: "09121234567", password: "Aa123456@" });

    expect(authService.login).toHaveBeenCalledWith("09121234567", "Aa123456@");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("forgetPasswordstep1 → success", async () => {
    (authService.forgetPasswordstep1 as jest.Mock).mockResolvedValue({
      message: "forgetPasswordstep1 success",
    });
    const res = await request(appInstance)
      .post("/api/auth/forget-password/step1")
      .send({ numberPhone: "09121234567" });

    expect(authService.forgetPasswordstep1).toHaveBeenCalledWith("09121234567");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
  it("forgetPasswordstep2 → success", async () => {
    (authService.forgetPasswordstep2 as jest.Mock).mockResolvedValue({
      message: "forgetPasswordstep2 success",
    });
    const res = await request(appInstance)
      .post("/api/auth/forget-password/step2")
      .send({ otp: "123456" });

    expect(authService.forgetPasswordstep2).toHaveBeenCalledWith("123456");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
  it("forgetPasswordstep3 → success", async () => {
    (authService.forgetPasswordstep3 as jest.Mock).mockResolvedValue({
      message: "forgetPasswordstep3 success",
    });
    const res = await request(appInstance)
      .post("/api/auth/forget-password/step3")
      .send({ numberPhone: "09012203544", newPassword: "Bb123@" });

    expect(authService.forgetPasswordstep3).toHaveBeenCalledWith(
      "09012203544",
      "Bb123@"
    );
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
  it("changePassword → success", async () => {
    (authService.changePassword as jest.Mock).mockResolvedValue({
      message: "changePassword success",
    });
    const res = await request(appInstance)
      .patch("/api/auth/change-password")
      .send({
        numberPhone: "09012203544",
        currentPassword: "Aa@1234",
        newPassword: "Bb@1234",
      });

    expect(authService.changePassword).toHaveBeenCalledWith(
      "09012203544",
      "Aa@1234",
      "Bb@1234"
    );
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
  it("get all users → success", async () => {
  const mockUsers = [
    { _id: "1", name: "User1" },
    { _id: "2", name: "User2" },
  ];

  (authService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

  const res = await request(appInstance).get("/api/auth/users");

  expect(authService.getAllUsers).toHaveBeenCalledTimes(1);
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
  expect(res.body.count).toBe(mockUsers.length);
  expect(res.body.users).toEqual(mockUsers);
});
it("logOut → success", async () => {
    const mockToken = "mock-jwt-token";

    (authService.logout as jest.Mock).mockResolvedValue({
      message: "logOut → success",
    });

    const res = await request(appInstance)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${mockToken}`) // ارسال توکن
      .send();

    expect(authService.logout).toHaveBeenCalledWith(mockToken);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      message: "logOut → success",
    });
    expect(res.headers["set-cookie"]).toBeDefined(); // بررسی پاک شدن cookie
  });

  it("logOut → fail without token", async () => {
    const res = await request(appInstance).post("/api/auth/logout").send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      ok: false,
      message: "توکن یافت نشد",
    });
  });
});
