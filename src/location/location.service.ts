import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from '@app/location/location.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private publicLocationRepository: Repository<Location>,
  ) {}

  async saveUserLocation(location: Omit<Location, 'id'>) {
    return await this.publicLocationRepository.save(location);
  }

  async deleteLocation(id: string) {
    return await this.publicLocationRepository.delete(id);
  }
}
