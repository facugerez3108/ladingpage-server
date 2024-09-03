import prisma from '../client';
import { Strategy as JwtStrategy, ExtractJwt, VerifyCallback } from 'passport-jwt';
import config from './config';
import { TokenType } from '@prisma/client';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

const jwtVerify: VerifyCallback = async (payload, done) => {
  try {
    console.log("JWT Payload", payload)
    if (payload.type !== TokenType.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        username: true
      },
      where: { id: payload.sub }
    });
    if (!user) {
      console.log("User not found")
      return done(null, false);
    }
    console.log("User authenticated", user);
    done(null, user);
  } catch (error) {
    console.log("JWT Verification error", error);
    done(error, false);
  }
};

export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);