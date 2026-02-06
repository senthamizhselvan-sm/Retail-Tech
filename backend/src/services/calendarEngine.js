class CalendarEngine {
  
  // Generate monthly calendar with business events
  static generateMonthlyCalendar(year, month) {
    const events = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add festival days
    const festivals = this.getFestivalDays(year, month);
    events.push(...festivals);
    
    // Add salary cycle days
    const salaryCycles = this.getSalaryCycleDays(year, month, daysInMonth);
    events.push(...salaryCycles);
    
    // Add weekend market days
    const weekendMarkets = this.getWeekendMarketDays(year, month, daysInMonth);
    events.push(...weekendMarkets);
    
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }
  
  // Get festival days for the month
  static getFestivalDays(year, month) {
    const festivals = [];
    
    // Static festival calendar (simplified)
    const festivalCalendar = {
      0: [ // January
        { day: 26, name: 'Republic Day', impact: 'high', suggestion: 'National holiday brings families. Stock sweets and decorations.' }
      ],
      2: [ // March
        { day: 8, name: 'Holi', impact: 'high', suggestion: 'Festival of colors! High demand for sweets and festive items.' }
      ],
      7: [ // August
        { day: 15, name: 'Independence Day', impact: 'high', suggestion: 'Patriotic celebration. Display tricolor items prominently.' }
      ],
      9: [ // October
        { day: 2, name: 'Gandhi Jayanti', impact: 'medium', suggestion: 'National holiday. Moderate footfall expected.' },
        { day: 24, name: 'Diwali', impact: 'high', suggestion: 'Biggest festival! Peak season for all festive items.' }
      ],
      10: [ // November
        { day: 12, name: 'Bhai Dooj', impact: 'medium', suggestion: 'Sibling celebration. Focus on sweets and gifts.' }
      ]
    };
    
    if (festivalCalendar[month]) {
      festivalCalendar[month].forEach(festival => {
        festivals.push({
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(festival.day).padStart(2, '0')}`,
          type: 'festival',
          name: festival.name,
          impact: festival.impact,
          suggestion: festival.suggestion
        });
      });
    }
    
    return festivals;
  }
  
  // Get salary cycle days (1st, 15th, 30th)
  static getSalaryCycleDays(year, month, daysInMonth) {
    const salaryCycles = [];
    const cycleDays = [1, 15, Math.min(30, daysInMonth)];
    
    cycleDays.forEach(day => {
      let name, suggestion;
      
      if (day === 1) {
        name = 'Month Start - Salary Day';
        suggestion = 'Fresh salary! Good time for premium products and bulk offers.';
      } else if (day === 15) {
        name = 'Mid-Month Salary';
        suggestion = 'Mid-month salary boost. Promote household essentials.';
      } else {
        name = 'Month End';
        suggestion = 'Month end. Focus on budget-friendly options and essentials.';
      }
      
      salaryCycles.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        type: 'salary',
        name,
        impact: 'medium',
        suggestion
      });
    });
    
    return salaryCycles;
  }
  
  // Get weekend market days
  static getWeekendMarketDays(year, month, daysInMonth) {
    const weekendMarkets = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        const name = dayOfWeek === 0 ? 'Sunday Market' : 'Saturday Rush';
        const suggestion = dayOfWeek === 0 
          ? 'Sunday family shopping. Focus on bulk items and family packs.'
          : 'Saturday evening rush. Keep popular items well-stocked.';
        
        weekendMarkets.push({
          date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          type: 'market',
          name,
          impact: 'medium',
          suggestion
        });
      }
    }
    
    return weekendMarkets;
  }
  
  // Get events for a specific date
  static getEventsForDate(date) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const day = dateObj.getDate();
    
    const monthlyEvents = this.generateMonthlyCalendar(year, month);
    return monthlyEvents.filter(event => event.date === date);
  }
  
  // Get best days for offers in a month
  static getBestOfferDays(year, month) {
    const events = this.generateMonthlyCalendar(year, month);
    
    // Filter high-impact days
    const bestDays = events.filter(event => 
      event.impact === 'high' || 
      (event.type === 'salary' && event.name.includes('Salary Day'))
    );
    
    return bestDays.map(day => ({
      date: day.date,
      reason: day.name,
      suggestion: `Perfect day for offers! ${day.suggestion}`
    }));
  }
}

module.exports = CalendarEngine;
