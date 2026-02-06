const GrowthProgress = require('../models/GrowthProgress');

class GrowthEngine {
  
  // Initialize growth progress for a new user
  static async initializeUserProgress(userId) {
    try {
      const existingProgress = await GrowthProgress.findOne({ userId });
      if (existingProgress) {
        return existingProgress;
      }
      
      const newProgress = new GrowthProgress({
        userId,
        stage: 'starter',
        completedActions: [],
        totalScore: 0,
        badges: [],
        weeklyGoals: this.generateWeeklyGoals()
      });
      
      return await newProgress.save();
    } catch (error) {
      console.error('Error initializing user progress:', error);
      return null;
    }
  }
  
  // Record a completed action
  static async recordAction(userId, actionType) {
    try {
      const progress = await GrowthProgress.findOne({ userId });
      if (!progress) {
        return await this.initializeUserProgress(userId);
      }
      
      // Check if action already exists
      const existingAction = progress.completedActions.find(
        action => action.actionType === actionType
      );
      
      if (!existingAction) {
        progress.completedActions.push({
          actionType,
          completedAt: new Date()
        });
        
        // Check for new badges
        await this.checkAndAwardBadges(progress);
        
        return await progress.save();
      }
      
      return progress;
    } catch (error) {
      console.error('Error recording action:', error);
      return null;
    }
  }
  
  // Generate weekly goals
  static generateWeeklyGoals() {
    const weekStart = this.getWeekStart(new Date());
    
    return [
      {
        goalType: 'daily_check',
        targetCount: 7,
        currentCount: 0,
        weekStart
      },
      {
        goalType: 'price_update',
        targetCount: 3,
        currentCount: 0,
        weekStart
      },
      {
        goalType: 'reflection_entry',
        targetCount: 5,
        currentCount: 0,
        weekStart
      }
    ];
  }
  
  // Update weekly goal progress
  static async updateWeeklyGoal(userId, goalType) {
    try {
      const progress = await GrowthProgress.findOne({ userId });
      if (!progress) return null;
      
      const currentWeekStart = this.getWeekStart(new Date());
      
      // Find or create the goal for current week
      let goal = progress.weeklyGoals.find(g => 
        g.goalType === goalType && 
        g.weekStart.getTime() === currentWeekStart.getTime()
      );
      
      if (!goal) {
        // Create new goal for current week
        goal = {
          goalType,
          targetCount: this.getTargetCount(goalType),
          currentCount: 1,
          weekStart: currentWeekStart
        };
        progress.weeklyGoals.push(goal);
      } else {
        // Update existing goal
        goal.currentCount = Math.min(goal.currentCount + 1, goal.targetCount);
      }
      
      return await progress.save();
    } catch (error) {
      console.error('Error updating weekly goal:', error);
      return null;
    }
  }
  
  // Check and award badges
  static async checkAndAwardBadges(progress) {
    const actionCounts = this.getActionCounts(progress.completedActions);
    
    // Consistent User Badge (7+ actions)
    if (actionCounts.total >= 7 && !this.hasBadge(progress, 'consistent_user')) {
      progress.badges.push({
        badgeType: 'consistent_user',
        earnedAt: new Date()
      });
    }
    
    // Price Tracker Badge (3+ price comparisons)
    if (actionCounts.price_comparison >= 3 && !this.hasBadge(progress, 'price_tracker')) {
      progress.badges.push({
        badgeType: 'price_tracker',
        earnedAt: new Date()
      });
    }
    
    // Brand Builder Badge (brand setup completed)
    if (actionCounts.brand_setup >= 1 && !this.hasBadge(progress, 'brand_builder')) {
      progress.badges.push({
        badgeType: 'brand_builder',
        earnedAt: new Date()
      });
    }
    
    // Reflection Master Badge (5+ reflections)
    if (actionCounts.sales_reflection >= 5 && !this.hasBadge(progress, 'reflection_master')) {
      progress.badges.push({
        badgeType: 'reflection_master',
        earnedAt: new Date()
      });
    }
  }
  
  // Helper methods
  static getActionCounts(actions) {
    const counts = {
      total: actions.length,
      profile_setup: 0,
      first_insight: 0,
      price_comparison: 0,
      sales_reflection: 0,
      brand_setup: 0,
      customer_template: 0
    };
    
    actions.forEach(action => {
      if (counts.hasOwnProperty(action.actionType)) {
        counts[action.actionType]++;
      }
    });
    
    return counts;
  }
  
  static hasBadge(progress, badgeType) {
    return progress.badges.some(badge => badge.badgeType === badgeType);
  }
  
  static getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }
  
  static getTargetCount(goalType) {
    const targets = {
      daily_check: 7,
      price_update: 3,
      reflection_entry: 5,
      brand_consistency: 7
    };
    return targets[goalType] || 5;
  }
  
  // Get user's current growth status
  static async getUserGrowthStatus(userId) {
    try {
      let progress = await GrowthProgress.findOne({ userId });
      
      if (!progress) {
        progress = await this.initializeUserProgress(userId);
      }
      
      const actionCounts = this.getActionCounts(progress.completedActions);
      const currentWeekGoals = this.getCurrentWeekGoals(progress.weeklyGoals);
      
      return {
        stage: progress.stage,
        totalScore: progress.totalScore,
        badges: progress.badges,
        actionCounts,
        weeklyGoals: currentWeekGoals,
        nextMilestone: this.getNextMilestone(progress.stage, progress.totalScore)
      };
    } catch (error) {
      console.error('Error getting user growth status:', error);
      return null;
    }
  }
  
  static getCurrentWeekGoals(weeklyGoals) {
    const currentWeekStart = this.getWeekStart(new Date());
    return weeklyGoals.filter(goal => 
      goal.weekStart.getTime() === currentWeekStart.getTime()
    );
  }
  
  static getNextMilestone(currentStage, currentScore) {
    const milestones = {
      starter: { nextStage: 'growing', requiredScore: 30, message: 'Complete more actions to reach Growing level' },
      growing: { nextStage: 'established', requiredScore: 60, message: 'Keep building your business presence' },
      established: { nextStage: 'pro', requiredScore: 80, message: 'Almost there! Become a Pro seller' },
      pro: { nextStage: 'pro', requiredScore: 100, message: 'You are a Pro! Keep maintaining excellence' }
    };
    
    return milestones[currentStage] || milestones.starter;
  }

  // Alias for controller compatibility
  static async initializeProgress(userId) {
    return await this.initializeUserProgress(userId);
  }

  // Record achievement method for controller compatibility
  static async recordAchievement(userId, type, name, description) {
    try {
      const progress = await GrowthProgress.findOne({ userId });
      if (!progress) {
        return { achievement: null, levelUp: false, newBadges: [] };
      }

      // Add achievement
      const achievement = {
        type,
        name,
        description: description || `Achievement: ${name}`,
        earnedAt: new Date()
      };

      if (!progress.achievements) {
        progress.achievements = [];
      }
      progress.achievements.push(achievement);

      // Check for level up and new badges
      const oldLevel = progress.level || 1;
      await this.checkAndAwardBadges(progress);
      await progress.save();

      const newLevel = progress.level || 1;
      const levelUp = newLevel > oldLevel;
      const newBadges = progress.badges.filter(badge => 
        new Date(badge.earnedAt).getTime() > Date.now() - 1000
      );

      return {
        achievement,
        levelUp,
        newBadges
      };
    } catch (error) {
      console.error('Error recording achievement:', error);
      return { achievement: null, levelUp: false, newBadges: [] };
    }
  }
}

module.exports = GrowthEngine;
