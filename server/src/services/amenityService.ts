import { AmenityRepository } from '../repositories/amenityRepository.js';

export class AmenityService {
  private amenityRepository: AmenityRepository;

  constructor() {
    this.amenityRepository = new AmenityRepository();
  }

  async getAllAmenities() {
    return this.amenityRepository.findAll();
  }
}
