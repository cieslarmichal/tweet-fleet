import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

// const databaseName = process.env[EnvKey.databaseName] as string;
// const host = process.env[EnvKey.databaseHost] as string;
// const user = process.env[EnvKey.databaseUser] as string;
// const databasePassword = process.env[EnvKey.databasePassword] as string;
// const jwtSecret = process.env[EnvKey.jwtSecret] as string;
// const jwtExpiresIn = parseInt(process.env[EnvKey.jwtExpiresIn] as string);

// const databaseQueryBuilder = new QueryBuilderFactoryImpl().create({
//   databaseName,
//   host,
//   password: databasePassword,
//   user,
// });

// const messageMapper = new MessageMapperImpl();
// const messageRepositoryImpl = new MessageRepositoryImpl(databaseQueryBuilder, messageMapper);
// const deleteMessageCommandImpl = new DeleteMessageCommandImpl(messageRepositoryImpl);
// const tokenService = new TokenServiceImpl(jwtSecret, jwtExpiresIn);
// const verifyAccessTokenQuery = new VerifyAccessTokenQueryImpl(tokenService);

export const lambda: Handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
  const authorizationHeader = event.headers['Authorization'];

  console.log({ authorizationHeader });

  // await deleteMessageCommandImpl.deleteMessage({
  //   id: messageId as string,
  //   userId,
  // });

  return {
    statusCode: 200,
    body: '',
  };
};
