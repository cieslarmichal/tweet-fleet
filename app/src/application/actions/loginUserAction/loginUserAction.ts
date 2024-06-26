import { OperationNotValidError } from '../../../common/errors/operationNotValidError.js';
import { type LoggerService } from '../../../common/loggerService.js';
import { type Config } from '../../../config/config.js';
import { type UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';
import { type HashService } from '../../services/hashService/hashService.js';
import { type TokenService } from '../../services/tokenService/tokenService.js';

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
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
    private readonly logger: LoggerService,
    private readonly config: Config,
  ) {}

  public async execute(payload: LoginUserActionPayload): Promise<LoginUserActionResult> {
    const { email, password } = payload;

    this.logger.debug({
      message: 'Logging User in...',
      email,
    });

    const user = await this.userRepository.findUserByEmail({ email });

    if (!user) {
      throw new OperationNotValidError({
        reason: 'User not found.',
        email,
      });
    }

    const passwordIsValid = await this.hashService.compare({
      plainData: password,
      hashedData: user.password,
    });

    if (!passwordIsValid) {
      throw new OperationNotValidError({
        reason: 'User not found.',
        email,
      });
    }

    const expiresIn = this.config.jwtExpiration;

    const accessToken = this.tokenService.createToken({
      data: { userId: user.id },
      expiresIn,
    });

    this.logger.info({
      message: 'User logged in.',
      email,
      userId: user.id,
      expiresIn,
    });

    return {
      accessToken,
      expiresIn,
    };
  }
}
