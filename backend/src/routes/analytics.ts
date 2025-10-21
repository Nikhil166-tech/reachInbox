import express from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AICategoryStats } from '../types/account';

const router = express.Router();
const analyticsService = new AnalyticsService();

router.get('/categories', (req, res) => {
    const categoryStats: AICategoryStats = {
        interested: 3,
        spam: 2,
        outOfOffice: 1,
        meetingBooked: 0,
        notInterested: 0
    };
    
    res.json({
        success: true,
        data: categoryStats
    });
});


// Get comprehensive analytics
router.get('/overview', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    console.log('📊 Fetching analytics overview for period:', period);
    const analytics = await analyticsService.getAnalytics(period as string);
    
    res.json({
      success: true,
      data: analytics,
      message: 'Analytics data retrieved successfully'
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve analytics'
    });
  }
});

// Get category distribution
router.get('/categories', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const analytics = await analyticsService.getAnalytics(period as string);
    
    res.json({
      success: true,
      data: analytics.categories,
      message: 'Category distribution retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get email trends
router.get('/trends', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const analytics = await analyticsService.getAnalytics(period as string);
    
    res.json({
      success: true,
      data: analytics.trends,
      message: 'Email trends retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const analytics = await analyticsService.getAnalytics(period as string);
    
    res.json({
      success: true,
      data: analytics.performance,
      message: 'Performance metrics retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;