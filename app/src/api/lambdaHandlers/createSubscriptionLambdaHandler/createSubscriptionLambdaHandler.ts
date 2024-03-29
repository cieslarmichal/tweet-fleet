import { type APIGatewayEvent, type Handler, type ProxyResult } from 'aws-lambda';

export const lambda: Handler = async (event: APIGatewayEvent): Promise<ProxyResult> => {
  const authorizationHeader = event.headers['Authorization'];

  console.log({ authorizationHeader });

  // const { message } = await createMessageCommand.createMessage({
  //   title: title as string,
  //   content: content as string,
  //   displayName: displayName as string,
  //   sendDate: sendDate as string,
  //   repeatBy: repeatBy as RepeatBy,
  //   recipientId: recipientId as string,
  //   userId,
  // });

  return {
    statusCode: 201,
    body: JSON.stringify({}),
  };
};
