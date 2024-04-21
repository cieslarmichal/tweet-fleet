export interface Tweet {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
  readonly urls: string[];
  readonly selfUrl: string;
  readonly author: {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly profileImageUrl: string;
  };
}
