import { ResourceAlreadyExistsError } from '../../../common/errors/resourceAlreadyExistsError.js';
import { LoggerClient } from '../../../common/loggerClient.js';
import { UserRepository } from '../../../domain/repositories/userRepository/userRepository.js';
import { HashService } from '../../services/hashService/hashService.js';

export interface RegisterUserActionPayload {
  readonly email: string;
  readonly password: string;
}

export class RegisterUserAction {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly logger: LoggerClient,
  ) {}

  public async execute(payload: RegisterUserActionPayload): Promise<void> {
    const { email, password } = payload;

    this.logger.debug({
      message: 'Registering User...',
      context: { email },
    });

    const existingUser = await this.userRepository.findUserByEmail({ email });

    if (existingUser) {
      throw new ResourceAlreadyExistsError({
        name: 'User',
        email,
      });
    }

    const hashedPassword = await this.hashService.hash({ plainData: password });

    await this.userRepository.createUser({
      email,
      password: hashedPassword,
    });

    this.logger.info({
      message: 'User registered.',
      context: { email },
    });
  }
}
