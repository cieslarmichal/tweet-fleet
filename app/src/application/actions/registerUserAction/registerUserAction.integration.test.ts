import { beforeEach, afterEach, expect, it, describe, vi } from 'vitest';

import { SpyFactory } from '@common/tests';

import { type RegisterUserCommandHandler } from './registerUserAction.js';
import { OperationNotValidError } from '../../../../../common/errors/common/operationNotValidError.js';
import { ResourceAlreadyExistsError } from '../../../../../common/errors/common/resourceAlreadyExistsError.js';
import { Application } from '../../../../../core/application.js';
import { type SqliteDatabaseClient } from '../../../../../core/database/sqliteDatabaseClient/sqliteDatabaseClient.js';
import { coreSymbols } from '../../../../../core/symbols.js';
import { type TokenService } from '../../../../authModule/application/services/tokenService/tokenService.js';
import { authSymbols } from '../../../../authModule/symbols.js';
import { symbols } from '../../../symbols.js';
import { UserTestFactory } from '../../../tests/factories/userTestFactory/userTestFactory.js';
import { UserTestUtils } from '../../../tests/utils/userTestUtils/userTestUtils.js';
import { type EmailService } from '../../services/emailService/emailService.js';

describe('RegisterUserCommandHandler', () => {
  const spyFactory = new SpyFactory(vi);

  let registerUserCommandHandler: RegisterUserCommandHandler;

  let sqliteDatabaseClient: SqliteDatabaseClient;

  let emailService: EmailService;

  let tokenService: TokenService;

  let userTestUtils: UserTestUtils;

  const userTestFactory = new UserTestFactory();

  beforeEach(async () => {
    const container = Application.createContainer();

    registerUserCommandHandler = container.get<RegisterUserCommandHandler>(symbols.registerUserCommandHandler);

    tokenService = container.get<TokenService>(authSymbols.tokenService);

    sqliteDatabaseClient = container.get<SqliteDatabaseClient>(coreSymbols.sqliteDatabaseClient);

    emailService = container.get<EmailService>(symbols.emailService);

    userTestUtils = new UserTestUtils(sqliteDatabaseClient);

    await userTestUtils.truncate();
  });

  afterEach(async () => {
    await userTestUtils.truncate();

    await sqliteDatabaseClient.destroy();
  });

  it('creates a User', async () => {
    const user = userTestFactory.create();

    spyFactory.create(emailService, 'sendEmail').mockImplementation(async () => {});

    const { user: createdUser } = await registerUserCommandHandler.execute({
      email: user.getEmail(),
      password: user.getPassword(),
      name: user.getName(),
    });

    const foundUser = await userTestUtils.findByEmail({ email: user.getEmail() });

    expect(createdUser.getEmail()).toEqual(user.getEmail());

    expect(createdUser.getIsEmailVerified()).toEqual(false);

    expect(foundUser?.email).toEqual(user.getEmail());

    const userTokens = await userTestUtils.findTokensByUserId({ userId: createdUser.getId() });

    expect(userTokens.emailVerificationToken).toBeDefined();

    const emailVerificationTokenPayload = tokenService.verifyToken({ token: userTokens.emailVerificationToken! });

    expect(emailVerificationTokenPayload['userId']).toBe(createdUser.getId());
  });

  it('throws an error when a User with the same email already exists', async () => {
    const existingUser = await userTestUtils.createAndPersist();

    expect(async () => {
      await registerUserCommandHandler.execute({
        email: existingUser.email,
        password: existingUser.password,
        name: existingUser.name,
      });
    }).toThrowErrorInstance({
      instance: ResourceAlreadyExistsError,
      context: {
        name: 'User',
        email: existingUser.email,
      },
    });
  });

  it('throws an error when password does not meet requirements', async () => {
    const user = userTestFactory.create();

    expect(async () => {
      await registerUserCommandHandler.execute({
        email: user.getEmail(),
        password: '123',
        name: user.getName(),
      });
    }).toThrowErrorInstance({
      instance: OperationNotValidError,
    });
  });
});
