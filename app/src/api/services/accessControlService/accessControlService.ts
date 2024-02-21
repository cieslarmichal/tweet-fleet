import { type TokenService } from '../../../application/services/tokenService/tokenService.js';
import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.js';

export interface VerifyBearerTokenPayload {
  readonly authorizationHeader: string | undefined;
}

export interface VerifyBearerTokenResult {
  readonly userId: string;
}

export class AccessControlService {
  public constructor(private readonly tokenService: TokenService) {}

  public async verifyBearerToken(payload: VerifyBearerTokenPayload): Promise<VerifyBearerTokenResult> {
    const { authorizationHeader } = payload;

    if (!authorizationHeader) {
      throw new UnauthorizedAccessError({
        reason: 'Authorization header not provided.',
      });
    }

    const [authorizationType, token] = authorizationHeader.split(' ');

    if (authorizationType !== 'Bearer') {
      throw new UnauthorizedAccessError({
        reason: 'Bearer authorization type not provided.',
      });
    }

    let tokenPayload;

    try {
      tokenPayload = this.tokenService.verifyToken({ token: token as string });
    } catch (error) {
      throw new UnauthorizedAccessError({
        reason: 'Invalid access token.',
      });
    }

    return tokenPayload as unknown as VerifyBearerTokenResult;
  }
}
