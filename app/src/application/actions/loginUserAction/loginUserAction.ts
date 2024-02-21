import { UnauthorizedAccessError } from '../../../common/errors/unathorizedAccessError.js';
import { LoggerClient } from '../../../common/loggerClient.js';
import { Config } from '../../../config/config.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';
import { HashService } from '../../services/hashService/hashService.js';
import { TokenService } from '../../services/tokenService/tokenService.js';

export interface LoginUserActionPayload {
  readonly email: string;
  readonly password: string;
}

export interface LoginUserActionResult {
  readonly accessToken: string;
  readonly expiresIn: number;
}

export class LoginUserAction {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly loggerService: LoggerClient,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
    private readonly config: Config,
  ) {}

  public async execute(payload: LoginUserActionPayload): Promise<LoginUserActionResult> {
    const { email, password } = payload;

    this.loggerService.debug({
      message: 'Logging User in...',
      context: { email },
    });

    const user = await this.userRepository.findUserByEmail({ email });

    if (!user) {
      throw new UnauthorizedAccessError({
        reason: 'User not found.',
        email,
      });
    }

    const passwordIsValid = await this.hashService.compare({
      plainData: password,
      hashedData: user.password,
    });

    if (!passwordIsValid) {
      throw new UnauthorizedAccessError({
        reason: 'User not found.',
        email,
      });
    }

    const expiresIn = this.config.jwtExpiration;

    const accessToken = this.tokenService.createToken({
      data: { userId: user.id },
      expiresIn,
    });

    this.loggerService.info({
      message: 'User logged in.',
      context: {
        email,
        userId: user.id,
        expiresIn,
      },
    });

    return {
      accessToken,
      expiresIn,
    };
  }
}
