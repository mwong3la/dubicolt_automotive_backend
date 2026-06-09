import { dubicoltStore } from '../dubicolt/store';

export class ReportsService {
  dashboard() {
    return dubicoltStore.getDashboard();
  }
}

export const reportsService = new ReportsService();
