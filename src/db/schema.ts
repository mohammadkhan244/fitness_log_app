import Dexie, { type EntityTable } from 'dexie';
import type { CachedExercise, ExerciseAlias, ExerciseSet, InboxEntry, Meta } from '../types';

class FitnessDB extends Dexie {
  sets!: EntityTable<ExerciseSet, 'id'>;
  exercises!: EntityTable<CachedExercise, 'id'>;
  meta!: EntityTable<Meta, 'key'>;
  exerciseAliases!: EntityTable<ExerciseAlias, 'id'>;
  inbox!: EntityTable<InboxEntry, 'id'>;

  constructor() {
    super('fitness2');
    this.version(1).stores({
      sets: '++id, clientId, syncedAt, date',
      exercises: '++id, &name',
      meta: 'key',
    });
    this.version(2).stores({
      sets: '++id, clientId, syncedAt, date, notionPageId, source',
      exercises: '++id, &name',
      meta: 'key',
    });
    this.version(3).stores({
      sets: '++id, clientId, syncedAt, date, notionPageId, source, week',
      exercises: '++id, &name',
      meta: 'key',
      exerciseAliases: '++id, alias',
    });
    // v4: add inbox table
    this.version(4).stores({
      sets: '++id, clientId, syncedAt, date, notionPageId, source, week',
      exercises: '++id, &name',
      meta: 'key',
      exerciseAliases: '++id, alias',
      inbox: '++id, clientId, syncedAt, week, createdAt',
    });
  }
}

export const db = new FitnessDB();
