import { en, type MessageKey } from '@/i18n/en';

export type { MessageKey };

export function t(key: MessageKey, params?: Record<string, string | number>) {
  const text: string = en[key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}
