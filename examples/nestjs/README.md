# Exemplo NestJS — KnexORM

Exemplo mínimo de integração do `knx-orm` com NestJS.

## Instalação

```bash
npm i knx-orm @nestjs/core @nestjs/common knex reflect-metadata
```

## Uso

Importe `KnexOrmModule` em seu `AppModule`:

```typescript
import { KnexOrmModule } from 'knx-orm/nestjs';

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
import { InjectRepository, InjectConnection } from 'knx-orm/nestjs';
import type { IRepository } from 'knx-orm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: IRepository<User>) {}
}
```

Consulte `app.module.example.ts` para um exemplo completo.
