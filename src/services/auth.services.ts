import userServices from './user.services';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import tokenServices from './token.services';
import { TokenType, User } from '@prisma/client';
import prisma from '../client';
import { encryptPassword, isPasswordMatch } from '../utils/encyption';
import { AuthTokensResponse } from '../types/response';
import exclude from '../utils/exclude';



const login = async (
    email: string,
    password: string
): Promise<Omit<User, 'password'>> => {
    const user = await userServices.getUserByEmail(email, [
        'id',
        'email',
        'username',
        'password',
        'role',
        'isEmailVerified',
        'updatedAt',
        'createdAt'
    ]);
    if(!user || !(await isPasswordMatch(password, user.password as string))){
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
    }
    return exclude(user, ['password']);
}


const logout = async (
    refreshToken: string
): Promise<void> => {
    const refreshTokenData = await prisma.token.findFirst({
        where: {
            token: refreshToken,
            type: TokenType.REFRESH,
            blacklisted: false
        }
    })

    if(!refreshTokenData){
        throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
    }
    await prisma.token.delete({
        where: {
            id: refreshTokenData.id
        }
    })
};


const refreshAuth = async (
    refreshToken: string,
): Promise<AuthTokensResponse> => {
    try{
        const refreshTokenData = await tokenServices.verifyToken(refreshToken, TokenType.REFRESH);
        const { userId } = refreshTokenData;
        await prisma.token.delete({
            where: {
                id: refreshTokenData.id
            }
        })

        return tokenServices.generateAuthTokens({id: userId});
    }catch(error){
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please provide a valid refresh token');
    }
}

const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
    try {
        console.log("Reset Password Start");
        const resetPasswordTokenData = await tokenServices.verifyToken(
            resetPasswordToken,
            TokenType.RESET_PASSWORD
        );
        console.log("Token Data:", resetPasswordTokenData);
        const user = await userServices.getUserById(resetPasswordTokenData.userId);
        console.log("User Found:", user);
        if (!user) {
            throw new Error();
        }
        const encryptedPassword = await encryptPassword(newPassword);
        await userServices.updateUserById(user.id, { password: encryptedPassword });
        await prisma.token.deleteMany({ where: { userId: user.id, type: TokenType.RESET_PASSWORD } });
        console.log("Password Reset Successful");
    } catch (error) {
        console.error("Reset Password Error:", error);
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
    }
}


const verifyEmail = async (
    verifyEmailToken: string
): Promise<void> => {
    try {
        const verifyEmailTokenData = await tokenServices.verifyToken(
            verifyEmailToken,
            TokenType.VERIFY_EMAIL
        );
        await prisma.token.deleteMany({
            where: {
                userId: verifyEmailTokenData.userId,
                type: TokenType.VERIFY_EMAIL
            }
        });

        await userServices.updateUserById(verifyEmailTokenData.userId, { isEmailVerified: true });
    }catch(error){
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed')
    }
}

export default {
    login,
    logout,
    isPasswordMatch,
    encryptPassword,
    refreshAuth,
    resetPassword,
    verifyEmail
}