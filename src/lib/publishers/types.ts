export type PublishResult =
  | { ok: true; platformPostId?: string; url?: string }
  | { ok: false; error: string; composerUrl?: string };

export interface PublishConnection {
  accessToken: string;
  platformUserId?: string | null;
}

export interface PublishInput {
  platform: string;
  body: string;
  connection?: PublishConnection | null;
}
