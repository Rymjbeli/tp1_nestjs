import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CV } from '../../cv/entities/cv.entity';
import { TimestampEntities } from '../../Generics/timestamp.entities';
import { UserRoleEnum } from '../../Generics/Enums/role-user.enum';

@Entity('user')
export class User extends TimestampEntities {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 50,
    unique: true,
  })
  username: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  password: string;
  @Column()
  salt: string;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.USER,
  })
  role: string;
  @OneToMany(() => CV, (cv) => cv.user, {
    nullable: true,
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  cvs: CV[];
}
