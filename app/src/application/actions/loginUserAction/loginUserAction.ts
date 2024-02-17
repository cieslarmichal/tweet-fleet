export interface LoginUserCommandHandlerPayload {
  readonly email: string;
  readonly password: string;
}

export interface LoginUserCommandHandlerResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessTokenExpiresIn: number;
}

export class LoginUserCommandHandler {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly loggerService: LoggerService,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
  ) {}

  public async execute(payload: LoginUserCommandHandlerPayload): Promise<LoginUserCommandHandlerResult> {
    const { email: emailInput, password } = payload;

    const email = emailInput.toLowerCase();

    this.loggerService.debug({
      message: 'Logging User in...',
      context: { email },
    });

    const user = await this.userRepository.findUser({ email });

    if (!user) {
      throw new UnauthorizedAccessError({
        reason: 'User not found.',
        email,
      });
    }

    const passwordIsValid = await this.hashService.compare({
      plainData: password,
      hashedData: user.getPassword(),
    });

    if (!passwordIsValid) {
      throw new UnauthorizedAccessError({
        reason: 'User not found.',
        email,
      });
    }

    if (!user.getIsEmailVerified()) {
      throw new OperationNotValidError({
        reason: 'User email is not verified.',
        email,
      });
    }

    const accessTokenExpiresIn = this.configProvider.getAccessTokenExpiresIn();

    const accessToken = this.tokenService.createToken({
      data: { userId: user.getId() },
      expiresIn: accessTokenExpiresIn,
    });

    const refreshTokenExpiresIn = this.configProvider.getRefreshTokenExpiresIn();

    const refreshToken = this.tokenService.createToken({
      data: { userId: user.getId() },
      expiresIn: refreshTokenExpiresIn,
    });

    const expiresAt = new Date(Date.now() + refreshTokenExpiresIn * 1000);

    user.addCreateRefreshTokenAction({
      token: refreshToken,
      expiresAt,
    });

    await this.userRepository.updateUser({
      id: user.getId(),
      domainActions: user.getDomainActions(),
    });

    this.loggerService.info({
      message: 'User logged in.',
      context: {
        email,
        userId: user.getId(),
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
    };
  }
}
