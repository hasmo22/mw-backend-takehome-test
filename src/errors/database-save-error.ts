import createError from '@fastify/error';

export const DatabaseSaveError = createError(
  'DATABASE_SAVE_ERROR',
  'Failed to save valuation to the database.',
  500
);
