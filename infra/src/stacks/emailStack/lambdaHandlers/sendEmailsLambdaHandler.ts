import { Handler } from 'aws-lambda';

export const lambda: Handler = async (): Promise<void> => {
  console.log('hello');
};
