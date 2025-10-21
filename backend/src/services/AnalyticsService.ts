import { AnalyticsResponse, AnalyticsOverview, CategoryDistribution, EmailTrends, PerformanceMetrics, EmailCategory } from '../types/email';

export class AnalyticsService {
  constructor() {
    console.log('📊 Analytics Service initialized');
  }

  public async getAnalytics(period: string = '7d'): Promise<AnalyticsResponse> {
    // Return sample analytics data for now
    return this.getSampleAnalytics(period);
  }

  private getSampleAnalytics(period: string): AnalyticsResponse {
    const sampleCategories: CategoryDistribution[] = [
      { category: 'Interested', count: 45, percentage: 32.1, trend: 'up' },
      { category: 'Meeting Booked', count: 23, percentage: 16.4, trend: 'stable' },
      { category: 'Not Interested', count: 18, percentage: 12.9, trend: 'down' },
      { category: 'Spam', count: 42, percentage: 30.0, trend: 'up' },
      { category: 'Out of Office', count: 12, percentage: 8.6, trend: 'stable' }
    ];

    const sampleTrends: EmailTrends[] = [
      { date: '2024-10-14', total: 18, interested: 6, meetings: 3, spam: 5, notInterested: 2, ooo: 2 },
      { date: '2024-10-15', total: 22, interested: 8, meetings: 4, spam: 6, notInterested: 2, ooo: 2 },
      { date: '2024-10-16', total: 15, interested: 5, meetings: 2, spam: 5, notInterested: 1, ooo: 2 },
      { date: '2024-10-17', total: 25, interested: 9, meetings: 5, spam: 7, notInterested: 2, ooo: 2 },
      { date: '2024-10-18', total: 20, interested: 7, meetings: 3, spam: 6, notInterested: 2, ooo: 2 },
      { date: '2024-10-19', total: 28, interested: 10, meetings: 6, spam: 8, notInterested: 2, ooo: 2 },
      { date: '2024-10-20', total: 12, interested: 4, meetings: 2, spam: 4, notInterested: 1, ooo: 1 }
    ];

    const samplePerformance: PerformanceMetrics[] = [
      {
        period: 'Current Week',
        emailsProcessed: 140,
        leadsGenerated: 45,
        meetingsScheduled: 23,
        avgCategorizationTime: 2.3,
        categorizationAccuracy: 87.5
      },
      {
        period: 'Previous Week',
        emailsProcessed: 125,
        leadsGenerated: 38,
        meetingsScheduled: 19,
        avgCategorizationTime: 2.8,
        categorizationAccuracy: 82.1
      }
    ];

    return {
      overview: {
        totalEmails: 140,
        categorizedEmails: 140,
        interestedLeads: 45,
        responseRate: 65.5,
        avgResponseTime: 4.5,
        spamCount: 42,
        meetingCount: 23,
        oooCount: 12,
        notInterestedCount: 18
      },
      categories: sampleCategories,
      trends: sampleTrends,
      performance: samplePerformance,
      period
    };
  }

  public async getCategoryInsights(category: EmailCategory): Promise<{ count: number; percentage: number; trend: string }> {
    // Sample insights for now
    const insights: { [key in EmailCategory]: { count: number; percentage: number; trend: string } } = {
      'Interested': { count: 45, percentage: 32.1, trend: 'up' },
      'Meeting Booked': { count: 23, percentage: 16.4, trend: 'stable' },
      'Not Interested': { count: 18, percentage: 12.9, trend: 'down' },
      'Spam': { count: 42, percentage: 30.0, trend: 'up' },
      'Out of Office': { count: 12, percentage: 8.6, trend: 'stable' },
      'Uncategorized': { count: 0, percentage: 0, trend: 'stable' }
    };

    return insights[category] || { count: 0, percentage: 0, trend: 'stable' };
  }
}