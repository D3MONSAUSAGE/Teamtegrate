
export interface BreakRequirements {
  mealBreaks: number;
  restBreaks: number;
  earnedBreakMinutes: number;
}

export const calculateBreakRequirements = (minutesWorked: number): BreakRequirements => {
  // Calculate meal breaks (30-minute unpaid breaks)
  const mealBreaks = minutesWorked > 720 ? 2 : // More than 12 hours
                     minutesWorked > 300 ? 1 : // More than 5 hours
                     0;

  // Calculate rest breaks (one 10-minute break per 4 hours)
  // But first break is awarded after 2 hours
  let earnedBreakMinutes = 0;
  if (minutesWorked >= 120) { // 2 hours minimum
    // First break after 2 hours
    earnedBreakMinutes = 10;
    
    // Additional breaks every 4 hours after that
    const additionalBreaks = Math.floor((minutesWorked - 120) / 240); // 240 minutes = 4 hours
    earnedBreakMinutes += additionalBreaks * 10;
  }

  // Calculate number of rest breaks for display
  const restBreaks = Math.ceil(earnedBreakMinutes / 10);

  return {
    mealBreaks,
    restBreaks,
    earnedBreakMinutes
  };
};
