import 'reflect-metadata';
import { Entity, PrimaryKey, Column } from 'knex-orm';

@Entity('users')
export class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  name!: string;

  @Column({ type: 'boolean' })
  active!: boolean;
}
