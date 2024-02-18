export interface AppConfig {
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly hashSaltRounds: string;
}
