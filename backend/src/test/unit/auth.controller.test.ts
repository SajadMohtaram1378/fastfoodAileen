import { Request, Response } from "express";
import * as authController from "@/controllers/authCn";
import { authService } from "@/service/auth.service";
jest.mock("@/config/redis");
jest.mock("@/utils/kavehnegarsms");
jest.mock("@/utils/otpHandler");
jest.mock("@/config/logger");
jest.mock("@/service/auth.service", () => ({
  authService: {
    registerStep1: jest.fn(),
    registerStep2: jest.fn(),
    login: jest.fn(),
    forgetPasswordstep1: jest.fn(),
    forgetPasswordstep2: jest.fn(),
    forgetPasswordstep3: jest.fn(),
    changePassword: jest.fn(),
    getAllUsers: jest.fn(),
    logout: jest.fn(),
  },
}));

describe("Auth Controller - Unit Tests", () => {
  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => jest.clearAllMocks());

  // -------- registerStep1 --------
  it("registerStep1 → success", async () => {
    const req = {
      body: {
        name: "Sajad",
        numberPhone: "09121234567",
        password: "123456Aa@",
        address: "Tehran mashhad",
      },
    } as Request;
    const res = mockResponse();

    (authService.registerStep1 as jest.Mock).mockResolvedValue({
      message: "step1 success",
    });

    await authController.registerStep1(req, res);

    expect(authService.registerStep1).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      data: { message: "step1 success" },
    });
  });

  // -------- registerStep2 --------
  it("registerStep2 → success", async () => {
    const req = { body: { otp: "123456" } } as Request;
    const res = mockResponse();

    (authService.registerStep2 as jest.Mock).mockResolvedValue({
      message: "step2 success",
    });

    await authController.registerStep2(req, res);

    expect(authService.registerStep2).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      data: { message: "step2 success" },
    });
  });

  // -------- login --------
  it("login → success", async () => {
    const req = {
      body: { numberPhone: "09121234567", password: "Aa123456@" },
    } as Request;
    const res = mockResponse();

    (authService.login as jest.Mock).mockResolvedValue({
      message: "login success",
    });

    await authController.login(req, res);

    expect(authService.login).toHaveBeenCalledWith("09121234567", "Aa123456@");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      data: { message: "login success" },
    });
  });

  it("forgetPasswordstep1 → success", async () => {
    const req = {
      body: { numberPhone: "09121234567" },
    } as Request;
    const res = mockResponse();

    (authService.forgetPasswordstep1 as jest.Mock).mockResolvedValue({
      message: "forgetPasswordstep1 success",
    });

    await authController.forgetPasswordstep1(req, res);

    expect(authService.forgetPasswordstep1).toHaveBeenCalledWith("09121234567");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "forgetPasswordstep1 success",
    });
  });
  it("forgetPasswordstep2 → success", async () => {
    const req = {
      body: { otp: "123456" },
    } as Request;
    const res = mockResponse();

    (authService.forgetPasswordstep2 as jest.Mock).mockResolvedValue({
      message: "forgetPasswordstep2 success",
    });

    await authController.forgetPasswordstep2(req, res);

    expect(authService.forgetPasswordstep2).toHaveBeenCalledWith("123456");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "forgetPasswordstep2 success",
    });
  });
  it("forgetPasswordstep3 → success", async () => {
    const req = {
      body: {
        numberPhone: "09012203544",
        newPassword: "Bb123@",
      },
    } as Request;
    const res = mockResponse();
    (authService.forgetPasswordstep3 as jest.Mock).mockResolvedValue({
      message: "forgetPasswordstep3 success",
    });
    await authController.forgetPasswordstep3(req, res);
    expect(authService.forgetPasswordstep3).toHaveBeenCalledWith(
      "09012203544",
      "Bb123@"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "forgetPasswordstep3 success",
    });
  });
  it("changePassword → success", async () => {
    const req = {
      body: {
        numberPhone: "09012203544",
        currentPassword: "Aa@1234",
        newPassword: "Bb@1234",
      },
    } as Request;
    const res = mockResponse();
    (authService.changePassword as jest.Mock).mockResolvedValue({
      message: "changePassword success",
    });
    await authController.changePassword(req, res);
    expect(authService.changePassword).toHaveBeenCalledWith(
      "09012203544",
      "Aa@1234",
      "Bb@1234"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "changePassword success",
    });
  });

  it("getAllUsers → success", async () => {
    const req = {} as Request;

    const res = mockResponse();

    const mockUsers = [
      { _id: "1", name: "User1" },
      { _id: "2", name: "User2" },
    ];
    (authService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

    await authController.getAllUsers(req, res);

    expect(authService.getAllUsers).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      count: mockUsers.length,
      users: mockUsers,
    });
  });
  it("logOut → success", async () => {
    const req = {
      headers: {
        authorization: "Bearer validToken",
      },
    } as unknown as Request;

    const res = mockResponse();

    (authService.logout as jest.Mock).mockResolvedValue({
      message: "خروج با موفقیت انجام شد ✅",
    });

    await authController.logOut(req, res);

    expect(authService.logout).toHaveBeenCalledWith("validToken");
    expect(res.clearCookie).toHaveBeenCalledWith("token", expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: "خروج با موفقیت انجام شد ✅",
    });
  });

  it("logOut → missing token", async () => {
    const req = {
      headers: {},
    } as unknown as Request;

    const res = mockResponse();

    await authController.logOut(req, res);

    expect(authService.logout).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "توکن یافت نشد",
    });
  });

  it("logOut → service throws error", async () => {
    const req = {
      headers: {
        authorization: "Bearer invalidToken",
      },
    } as unknown as Request;

    const res = mockResponse();

    (authService.logout as jest.Mock).mockRejectedValue(
      new Error("خطای Redis")
    );

    await authController.logOut(req, res);

    expect(authService.logout).toHaveBeenCalledWith("invalidToken");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      message: "خطای Redis",
    });
  });
});
