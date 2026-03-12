import type { EntityMetadata } from '../types/entity-metadata';

const entityRegistry = new Map<object, EntityMetadata>();

/**
 * Stores entity metadata for a class. Used internally by @Entity decorator.
 */
export function setEntityMetadata(target: object, metadata: EntityMetadata): void {
  entityRegistry.set(target, metadata);
}

/**
 * Retrieves entity metadata for a class, if it was decorated with @Entity.
 */
export function getEntityMetadata(target: object): EntityMetadata | undefined {
  return entityRegistry.get(target);
}
