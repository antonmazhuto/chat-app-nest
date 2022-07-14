import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '@app/location/location.entity';
import { LocationService } from '@app/location/location.service';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
