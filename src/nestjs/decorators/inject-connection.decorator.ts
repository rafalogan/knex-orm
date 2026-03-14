import { Inject } from '@nestjs/common';
import { getConnectionToken } from '../constants';

/**
 * Injects Knex connection by name.
 * Omit name for default connection.
 */
export const InjectConnection = (name?: string) =>
  Inject(getConnectionToken(name));
