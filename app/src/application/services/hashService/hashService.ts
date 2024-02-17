import { compare, genSalt, hash } from 'bcrypt';

export interface HashPayload {
  readonly plainData: string;
}

export interface ComparePayload {
  readonly plainData: string;
  readonly hashedData: string;
}

export interface HashServiceConfig {
  readonly hashSaltRounds: number;
}

export class HashService {
  public constructor(private readonly config: HashServiceConfig) {}

  public async hash(payload: HashPayload): Promise<string> {
    const { plainData } = payload;

    const salt = await genSalt(this.config.hashSaltRounds);

    return hash(plainData, salt);
  }

  public async compare(payload: ComparePayload): Promise<boolean> {
    const { plainData, hashedData } = payload;

    return compare(plainData, hashedData);
  }
}
