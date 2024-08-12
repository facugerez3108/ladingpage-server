import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync";
import {
  authService,
  userService,
  tokenService,
  emailService,
} from "../services";
import exclude from "../utils/exclude";
import { User } from "@prisma/client";
import ApiError from "../utils/ApiError";
import { Request, Response } from "express";

const register = catchAsync(async (req, res) => {
  const { email, password, username } = req.body;
  const user = await userService.createUser(email, password, username);
  const userWithoutPassword = exclude(user, [
    "password",
    "createdAt",
    "updatedAt",
  ]);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user: userWithoutPassword, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email
  );
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = async (req: Request, res: Response) => {
  console.log("Token recibido:", req.params.token);
  console.log("Password recibido:", req.body.password);

  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, '"token" is required');
  }

  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, '"password" is required');
  }

  await authService.resetPassword(token as string, password);
  res.status(httpStatus.NO_CONTENT).send();
};

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user as User;
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token as string);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
