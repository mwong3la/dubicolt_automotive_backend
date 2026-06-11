import { dubicoltStore } from '../dubicolt/store';

export class CategoriesService {
  list() {
    return dubicoltStore.listCategories();
  }

  get(id: string) {
    return dubicoltStore.getCategory(id);
  }

  create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    status?: 'draft' | 'published';
    origins?: string[];
  }) {
    return dubicoltStore.createCategory(data);
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      imageUrl: string;
      status: 'draft' | 'published';
      origins: string[];
    }>,
  ) {
    return dubicoltStore.updateCategory(id, data);
  }

  delete(id: string) {
    return dubicoltStore.deleteCategory(id);
  }
}

export const categoriesService = new CategoriesService();
