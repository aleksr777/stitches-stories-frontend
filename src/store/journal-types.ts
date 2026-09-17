export type JournalPhoto = { id: string; width: number; height: number };
export type JournalPost = {
  id: string;
  text: string;
  sourceUrl: string;
  sourcePublishedAt: string;
  publishedAt: string | null;
  otherAttachments: string[];
  photos: JournalPhoto[];
};
export type JournalStatus = 'pending' | 'published' | 'rejected';
export type JournalReviewPost = JournalPost & {
  status: JournalStatus;
  revision: number;
  importedAt: string;
};
export type JournalPage<T = JournalPost> = { items: T[]; total: number; nextOffset: number | null };
export type JournalConfig = { pageUrl: string; tokenConfigured: boolean };
export type JournalImport = {
  added: number;
  existing: number;
  skipped: number;
  nextOffset: number | null;
  total: number;
};
export const journalStatuses: Record<JournalStatus, string> = {
  pending: 'На проверке',
  published: 'На сайте',
  rejected: 'Отклонённые',
};
export const journalDate = (date: string) =>
  new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
