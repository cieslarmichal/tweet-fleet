import { sign, verify } from 'jsonwebtoken';

export interface TokenServiceConfig {
  readonly jwtSecret: string;
}

export interface CreateTokenPayload {
  readonly data: Record<string, string>;
  readonly expiresIn: number;
}

export interface VerifyTokenPayload {
  readonly token: string;
}

export class TokenService {
  public constructor(private readonly config: TokenServiceConfig) {}

  public createToken(payload: CreateTokenPayload): string {
    const { data, expiresIn } = payload;

    const token = sign(data, this.config.jwtSecret, {
      expiresIn,
      algorithm: 'HS512',
    });

    return token;
  }

  public verifyToken(payload: VerifyTokenPayload): Record<string, string> {
    const { token } = payload;

    const data = verify(token, this.config.jwtSecret, { algorithms: ['HS512'] });

    return data as Record<string, string>;
  }
}
