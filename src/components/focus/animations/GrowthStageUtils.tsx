
export const getGrowthStage = (progress: number) => {
  const safeProgress = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  if (safeProgress === 0) return 'seed';
  if (safeProgress < 25) return 'sprout';
  if (safeProgress < 50) return 'small';
  if (safeProgress < 75) return 'medium';
  if (safeProgress < 100) return 'large';
  return 'complete';
};

export const getStageMessage = (stage: string) => {
  switch (stage) {
    case 'seed': return 'Ready to plant your focus';
    case 'sprout': return 'Beginning to grow';
    case 'small': return 'Making progress';
    case 'medium': return 'Growing strong';
    case 'large': return 'Almost there';
    case 'complete': return 'Fully grown!';
    default: return 'Growing...';
  }
};
