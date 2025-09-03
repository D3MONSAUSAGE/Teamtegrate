import { QuizAnswerOverride } from '@/hooks/useQuizOverrides';

export interface QuizAttemptWithOverrides {
  id: string;
  quiz_id: string;
  user_id: string;
  attempt_number: number;
  score: number;
  max_score: number;
  passed: boolean;
  answers: any[];
  started_at: string;
  completed_at: string | null;
  organization_id: string;
  // User data
  users?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  // Override data
  overrides?: QuizAnswerOverride[];
  // Calculated fields
  adjusted_score?: number;
  adjusted_passed?: boolean;
  has_overrides?: boolean;
}

export interface QuestionOverrideInfo {
  question_id: string;
  original_score: number;
  override_score: number;
  adjustment: number;
}

/**
 * Calculate adjusted score for a quiz attempt based on manual overrides
 */
export const calculateAdjustedScore = (
  originalScore: number,
  overrides: QuizAnswerOverride[] = []
): number => {
  const totalAdjustment = overrides.reduce((sum, override) => {
    return sum + (override.override_score - override.original_score);
  }, 0);
  
  return Math.max(0, originalScore + totalAdjustment);
};

/**
 * Determine if an attempt passes based on adjusted score and passing threshold
 */
export const calculateAdjustedPassStatus = (
  adjustedScore: number,
  maxScore: number,
  passingScore: number = 70
): boolean => {
  if (maxScore === 0) return false;
  const percentage = (adjustedScore / maxScore) * 100;
  return percentage >= passingScore;
};

/**
 * Get detailed override information for each question
 */
export const getQuestionOverrideDetails = (
  overrides: QuizAnswerOverride[] = []
): QuestionOverrideInfo[] => {
  return overrides.map(override => ({
    question_id: override.question_id,
    original_score: override.original_score,
    override_score: override.override_score,
    adjustment: override.override_score - override.original_score
  }));
};

/**
 * Process quiz attempts with override data to calculate adjusted scores
 */
export const processQuizAttemptsWithOverrides = (
  attempts: any[],
  overridesMap: Record<string, QuizAnswerOverride[]>,
  passingScore: number = 70
): QuizAttemptWithOverrides[] => {
  return attempts.map(attempt => {
    const attemptOverrides = overridesMap[attempt.id] || [];
    const adjustedScore = calculateAdjustedScore(attempt.score, attemptOverrides);
    const adjustedPassed = calculateAdjustedPassStatus(adjustedScore, attempt.max_score, passingScore);
    
    return {
      ...attempt,
      overrides: attemptOverrides,
      adjusted_score: adjustedScore,
      adjusted_passed: adjustedPassed,
      has_overrides: attemptOverrides.length > 0
    };
  });
};

/**
 * Calculate summary statistics with override adjustments
 */
export interface QuizSummaryStats {
  total_attempts: number;
  passed_attempts_original: number;
  passed_attempts_adjusted: number;
  failed_attempts_original: number;
  failed_attempts_adjusted: number;
  average_score_original: number;
  average_score_adjusted: number;
  pass_rate_original: number;
  pass_rate_adjusted: number;
  total_overrides: number;
  attempts_with_overrides: number;
}

export const calculateQuizSummaryStats = (
  attempts: QuizAttemptWithOverrides[]
): QuizSummaryStats => {
  const total = attempts.length;
  
  if (total === 0) {
    return {
      total_attempts: 0,
      passed_attempts_original: 0,
      passed_attempts_adjusted: 0,
      failed_attempts_original: 0,
      failed_attempts_adjusted: 0,
      average_score_original: 0,
      average_score_adjusted: 0,
      pass_rate_original: 0,
      pass_rate_adjusted: 0,
      total_overrides: 0,
      attempts_with_overrides: 0
    };
  }
  
  const passedOriginal = attempts.filter(a => a.passed).length;
  const passedAdjusted = attempts.filter(a => a.adjusted_passed).length;
  const totalOverrides = attempts.reduce((sum, a) => sum + (a.overrides?.length || 0), 0);
  const attemptsWithOverrides = attempts.filter(a => a.has_overrides).length;
  
  const avgScoreOriginal = attempts.reduce((sum, a) => sum + (a.score / a.max_score * 100), 0) / total;
  const avgScoreAdjusted = attempts.reduce((sum, a) => sum + ((a.adjusted_score || a.score) / a.max_score * 100), 0) / total;
  
  return {
    total_attempts: total,
    passed_attempts_original: passedOriginal,
    passed_attempts_adjusted: passedAdjusted,
    failed_attempts_original: total - passedOriginal,
    failed_attempts_adjusted: total - passedAdjusted,
    average_score_original: Math.round(avgScoreOriginal),
    average_score_adjusted: Math.round(avgScoreAdjusted),
    pass_rate_original: Math.round((passedOriginal / total) * 100),
    pass_rate_adjusted: Math.round((passedAdjusted / total) * 100),
    total_overrides: totalOverrides,
    attempts_with_overrides: attemptsWithOverrides
  };
};