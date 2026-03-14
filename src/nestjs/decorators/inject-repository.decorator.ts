import { Inject } from '@nestjs/common';
import { getRepositoryToken } from '../constants';

/**
 * Injects Repository for the given entity.
 * Use with KnexOrmModule.forFeature([Entity]).
 */
export const InjectRepository = (entity: new (...args: unknown[]) => unknown) =>
  Inject(getRepositoryToken(entity));
