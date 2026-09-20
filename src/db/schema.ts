import Dexie, { type EntityTable } from 'dexie';
import type { CachedExercise, ExerciseSet, Meta } from '../types';

class FitnessDB extends Dexie {
  sets!: EntityTable<ExerciseSet, 'id'>;
  exercises!: EntityTable<CachedExercise, 'id'>;
  meta!: EntityTable<Meta, 'key'>;

  constructor() {
    super('fitness2');
    this.version(1).stores({
      sets: '++id, clientId, syncedAt, date',
      exercises: '++id, &name',
      meta: 'key',
    });
    // v2 adds notionPageId and source indexes (no data migration needed)
    this.version(2).stores({
      sets: '++id, clientId, syncedAt, date, notionPageId, source',
      exercises: '++id, &name',
      meta: 'key',
    });
  }
}

export const db = new FitnessDB();
