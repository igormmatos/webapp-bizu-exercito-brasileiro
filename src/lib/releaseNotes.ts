export type ReleaseNotesEntry = {
  title: string;
  publishedAt?: string;
  items: string[];
};

type ReleaseNotesCatalog = Record<string, ReleaseNotesEntry>;

const RELEASE_NOTES_STORAGE_KEY = 'manual_de_bolso_last_seen_version_v1';

export const RELEASE_NOTES: ReleaseNotesCatalog = {
  '1.0.0': {
    title: 'Novidades desta versão',
    publishedAt: '2026-03-20',
    items: [
      'Compartilhamento de conteúdos com link direto para cada item.',
      'Melhorias na instalação e atualização do app em modo PWA.',
      'Correções de texto e ajustes na navegação do app.',
    ],
  },
};

function getStoredSeenVersion(): string | null {
  try {
    return window.localStorage.getItem(RELEASE_NOTES_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getReleaseNotesForVersion(version: string): ReleaseNotesEntry | null {
  return RELEASE_NOTES[version] || null;
}

export function shouldShowCurrentReleaseNotes(version: string): boolean {
  if (typeof window === 'undefined') return false;

  const releaseNotes = getReleaseNotesForVersion(version);
  if (!releaseNotes || releaseNotes.items.length === 0) return false;

  return getStoredSeenVersion() !== version;
}

export function markCurrentReleaseNotesAsSeen(version: string): void {
  try {
    window.localStorage.setItem(RELEASE_NOTES_STORAGE_KEY, version);
  } catch {
    // Ignore localStorage write failures.
  }
}
