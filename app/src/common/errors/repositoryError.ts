import { BaseError } from './baseError.js';

interface Context {
  readonly entity: string;
  readonly operation: string;
}

export class RepositoryError extends BaseError<Context> {
  public constructor(context: Context) {
    super('RepositoryError', 'Repository error.', context);
  }
}
