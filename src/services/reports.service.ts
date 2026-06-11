import { dubicoltStore } from '../dubicolt/store';

export class ReportsService {
  dashboard() {
    return dubicoltStore.getDashboard();
  }

  analytics() {
    return dubicoltStore.getAnalytics();
  }
}

export const reportsService = new ReportsService();
