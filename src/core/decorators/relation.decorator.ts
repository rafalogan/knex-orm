/**
 * Placeholder for v2 relations (OneToMany, ManyToOne, ManyToMany).
 * Currently a no-op. Will be implemented in a future version.
 */
export function Relation(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    void target;
    void propertyKey;
    // Placeholder: no-op for v2
  };
}
