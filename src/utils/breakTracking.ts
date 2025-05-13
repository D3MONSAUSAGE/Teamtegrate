
export const calculateBreakRequirements = (workedMinutes: number) => {
  // California labor law: 30min meal break for 5+ hours, 
  // second meal break for 10+ hours, 10min rest break per 4 hours
  
  // Calculate meal breaks (30 min each)
  const mealBreaks = Math.floor(workedMinutes / 300); // 5 hours = 300 minutes
  
  // Calculate rest breaks (10 min each)
  const restBreaks = Math.floor(workedMinutes / 240); // 4 hours = 240 minutes
  
  // Minutes that should be added to the total (not deducted from work time)
  const earnedBreakMinutes = (mealBreaks * 30) + (restBreaks * 10);
  
  return {
    mealBreaks,
    restBreaks,
    earnedBreakMinutes
  };
};
