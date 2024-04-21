export interface Config {
  readonly jwtSecret: string;
  readonly hashSaltRounds: string;
  readonly sendGridApiKey: string;
  readonly twitter: {
    readonly apiKey: string;
    readonly apiSecret: string;
    readonly accessToken: string;
    readonly accessTokenSecret: string;
  };
}
