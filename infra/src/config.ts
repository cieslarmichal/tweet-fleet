export interface Config {
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly hashSaltRounds: string;
}
