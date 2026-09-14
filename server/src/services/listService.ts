import { CuratedListRepository, ListFilters } from '../repositories/listRepository.js';

export class CuratedListService {
  private listRepository: CuratedListRepository;

  constructor() {
    this.listRepository = new CuratedListRepository();
  }

  async getLists(filters: ListFilters) {
    return this.listRepository.findAll(filters);
  }

  async getListBySlug(slug: string) {
    return this.listRepository.findBySlug(slug);
  }
}
