import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export function useExerciseAliases() {
  const aliases = useLiveQuery(() => db.exerciseAliases.toArray(), []) ?? [];

  async function addAlias(alias: string, canonical: string): Promise<void> {
    await db.exerciseAliases.add({ alias: alias.trim(), canonical: canonical.trim() });
  }

  async function removeAlias(id: number): Promise<void> {
    await db.exerciseAliases.delete(id);
  }

  return { aliases, addAlias, removeAlias };
}
