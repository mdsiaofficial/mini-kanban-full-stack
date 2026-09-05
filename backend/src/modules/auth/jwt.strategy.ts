import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: (req: Request) => {
        return req.cookies?.accessToken;
      },
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    return { userId: Number(payload.sub), email: payload.email };
  }
}
