import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Location')
export class Location {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public latitude: string;

  @Column()
  public longitude: string;
}
