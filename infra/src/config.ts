export interface Config {
  readonly jwtSecret: string;
  readonly hashSaltRounds: string;
  readonly sendGridApiKey: string;
}
