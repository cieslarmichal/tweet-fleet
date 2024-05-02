export interface Tweet {
  readonly text: string;
  readonly createdAt: string;
  readonly selfUrl: string;
  readonly author: {
    readonly name: string;
    readonly username: string;
  };
}
