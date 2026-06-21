export interface PublishAdapter {
  name: string;
  validate(config: Record<string, unknown>): string | null;
  publish(params: {
    config: Record<string, unknown>;
    title: string;
    content: string;
  }): Promise<{ success: boolean; externalUrl?: string; error?: string }>;
}

export type AdapterMap = Map<string, PublishAdapter>;
