export interface RegisterUserActionPayload {
  readonly email: string;
  readonly password: string;
  readonly name: string;
}

export interface RegisterUserActionResult {
  readonly user: User;
}

export class RegisterUserCommandHandler {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly loggerService: LoggerService,
  ) {}

  public async execute(payload: RegisterUserCommandHandlerPayload): Promise<RegisterUserCommandHandlerResult> {
    const { email: emailInput, password, name } = payload;

    const email = emailInput.toLowerCase();

    this.loggerService.debug({
      message: 'Registering User...',
      context: {
        email,
        name,
      },
    });

    const existingUser = await this.userRepository.findUser({ email });

    if (existingUser) {
      throw new ResourceAlreadyExistsError({
        name: 'User',
        email,
      });
    }

    const hashedPassword = await this.hashService.hash({ plainData: password });

    const user = await this.userRepository.createUser({
      email,
      password: hashedPassword,
      name,
      isEmailVerified: false,
    });

    this.loggerService.info({
      message: 'User registered.',
      context: {
        email,
        userId: user.getId(),
      },
    });

    return { user };
  }
}
