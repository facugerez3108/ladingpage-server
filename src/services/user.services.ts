import { User, Role, Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../client";
import ApiError from "../utils/ApiError";
import { encryptPassword } from "../utils/encyption";
import jwt from 'jsonwebtoken';
import config from "../config/config";

const createUser = async (
    email: string,
    password: string,
    username: string,
    role: Role = Role.USER
): Promise<User> => {
    if (await getUserByEmail(email)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
    }
    return prisma.user.create({
        data: {
            email,
            password: await encryptPassword(password),
            username,
            role
        }
    })
}

const queryUsers = async <Key extends keyof User>(
    keys: Key[] = [
      'id',
      'email',
      'username',
      'password',
      'role',
      'isEmailVerified',
      'createdAt',
      'updatedAt'
    ] as Key[]
  ): Promise<Pick<User, Key>[]> => {
    const users = await prisma.user.findMany({
      select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    });
    return users as Pick<User, Key>[];
  };

const getUserByEmail = async <Key extends keyof User>(
    email: string,
    keys: Key[] = [
        'id',
        'email',
        'password',
        'username',
        'role',
        'isEmailVerified',
        'createdAt',
        'updatedAt'
    ] as Key[]
): Promise<Pick <User, Key> | null> => {
    const user = await prisma.user.findUnique({
        where: { email },
        select: keys.reduce((obj, k) => ({ ...obj, [k]: true}), {})
    })
    return user ? (user as Pick<User, Key> | null) : null;
}


const getUserById = async <Key extends keyof User>(
    id: number,
    keys: Key[] = [
      'id',
      'email',
      'username',
      'password',
      'role',
      'isEmailVerified',
      'createdAt',
      'updatedAt'
    ] as Key[]
  ): Promise<Pick<User, Key> | null> => {
    return prisma.user.findUnique({
      where: { id },
      select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    }) as Promise<Pick<User, Key> | null>;
  };


const updateUserById = async <Key extends keyof User>(
    userId: number,
    updateBody: Prisma.UserUpdateInput,
    keys: Key[] = [
        'id',
        'email',
        'username',
        'role',
    ] as Key[]
): Promise<Pick<User, Key> | null> => {
    const user = await getUserById(userId, ['id', 'email', 'username']);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (updateBody.email && (await getUserByEmail(updateBody.email as string))) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateBody,
      select: keys.reduce((obj, k) => ({ ...obj, [k]: true }), {})
    });
    return updatedUser as Pick<User, Key> | null;
} 

const deleteUserById = async (userId: number): Promise<User> => {
    const user = await getUserById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    await prisma.user.delete({ where: { id: user.id } });
    return user;
};

const getUserRole = async (token: string): Promise<Role> => {
    try {
        const decodedToken = jwt.verify(token, config.jwt.secret)

        let userId: number;
        if(typeof decodedToken === 'object' && decodedToken.sub !== undefined){
            if (typeof decodedToken.sub === 'string'){
                userId = parseInt(decodedToken.sub);
            }else {
                userId = decodedToken.sub;
            }
        }else {
            throw new Error('Invalid token');
        }
        console.log(userId)

        const user = await getUserById(userId);
        if(!user){
            throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
        }
        
        return user.role;
    }catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }
}

export default {
    createUser,
    queryUsers,
    getUserById,
    getUserByEmail,
    getUserRole,
    updateUserById,
    deleteUserById
};