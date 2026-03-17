# Exemplo NestJS — KnexORM

Exemplo mínimo de integração do `knex-orm` com NestJS.

## Instalação

```bash
npm i knex-orm @nestjs/core @nestjs/common knex reflect-metadata
```

## Uso

Importe `KnexOrmModule` em seu `AppModule`:

```typescript
import { KnexOrmModule } from 'knex-orm/nestjs';

@Module({
  imports: [
    KnexOrmModule.forRoot({
      /* orm config */
    }),
    KnexOrmModule.forFeature([User, Product]),
  ],
})
export class AppModule {}
```

Use `@InjectRepository(Entity)` e `@InjectConnection(name?)` nos serviços:

```typescript
import { InjectRepository, InjectConnection } from 'knex-orm/nestjs';
import type { IRepository } from 'knex-orm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: IRepository<User>) {}
}
```

Consulte `app.module.example.ts` para um exemplo completo.
