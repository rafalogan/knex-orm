import { getEntityMetadata } from '@core/decorators';

/**
 * Obtém metadados de entidades a partir de classes já carregadas.
 * O caller (CLI) é responsável por importar os arquivos das entidades.
 */
export class EntityScanner {
  /**
   * Retorna classes que possuem @Entity e metadata válida.
   */
  scan(constructors: (new () => object)[]): (new () => object)[] {
    return constructors.filter((ctor) => {
      const meta = getEntityMetadata(ctor);
      return meta?.tableName != null;
    });
  }

  /**
   * Retorna metadados das entidades escaneadas.
   */
  getMetadata(constructors: (new () => object)[]) {
    return this.scan(constructors).map((ctor) => ({
      constructor: ctor,
      metadata: getEntityMetadata(ctor),
    }));
  }
}
