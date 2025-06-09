
import React from 'react';
import EnhancedDailyScoreCard from './dashboard/EnhancedDailyScoreCard';
import { DailyScore } from '@/types';

interface DailyScoreCardProps {
  score: DailyScore;
}

const DailyScoreCard: React.FC<DailyScoreCardProps> = (props) => {
  return <EnhancedDailyScoreCard {...props} />;
};

export default DailyScoreCard;
