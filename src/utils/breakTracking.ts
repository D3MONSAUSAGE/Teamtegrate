
export interface BreakRequirements {
  mealBreaks: number;
  restBreaks: number;
  nextBreakDue?: string;
}

export const calculateBreakRequirements = (minutesWorked: number): BreakRequirements => {
  // Calculate meal breaks (30-minute unpaid breaks)
  const mealBreaks = minutesWorked > 720 ? 2 : // More than 12 hours
                     minutesWorked > 300 ? 1 : // More than 5 hours
                     0;

  // Calculate rest breaks (10-minute paid breaks)
  // One 10-minute break per 4 hours (240 minutes)
  const restBreaks = Math.floor(minutesWorked / 240);

  return {
    mealBreaks,
    restBreaks
  };
};
