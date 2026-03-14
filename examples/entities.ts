import 'reflect-metadata';
import { Entity, PrimaryKey, Column } from 'knex-orm';

@Entity('users')
export class User {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  email!: string;

  @Column({ type: 'string' })
  name!: string;
}

@Entity('posts')
export class Post {
  @PrimaryKey()
  id!: number;

  @Column({ type: 'string' })
  title!: string;

  @Column({ type: 'integer' })
  userId!: number;
}

export const entities = [User, Post];
