// Utility for evaluating short answer quiz questions with flexible matching
// Supports multiple accepted answers, case/whitespace/punctuation normalization,
// contains and regex match types, and optional required keywords.

export type ShortAnswerMatchType = 'exact' | 'contains' | 'regex';

export interface ShortAnswerOptions {
  acceptedAnswers?: string[]; // Additional accepted answers besides the primary correctAnswer
  caseInsensitive?: boolean; // default true
  ignoreWhitespace?: boolean; // default true (trims and collapses spaces)
  ignorePunctuation?: boolean; // default true (removes punctuation)
  matchType?: ShortAnswerMatchType; // default 'exact'
  requiredKeywords?: string[]; // Optional: all must appear in the user's answer
}

const defaultOptions: Required<Omit<ShortAnswerOptions, 'acceptedAnswers' | 'requiredKeywords'>> = {
  caseInsensitive: true,
  ignoreWhitespace: true,
  ignorePunctuation: true,
  matchType: 'exact',
};

function normalize(input: string, opts: ShortAnswerOptions): string {
  let s = input;
  if (opts.caseInsensitive ?? defaultOptions.caseInsensitive) s = s.toLowerCase();
  if (opts.ignorePunctuation ?? defaultOptions.ignorePunctuation) {
    // Remove punctuation, keep letters, numbers, and whitespace
    s = s.replace(/[^\p{L}\p{N}\s]/gu, '');
  }
  if (opts.ignoreWhitespace ?? defaultOptions.ignoreWhitespace) {
    s = s.trim().replace(/\s+/g, ' ');
  }
  return s;
}

export function evaluateShortAnswer(
  userAnswer: string,
  correctAnswer: string,
  rawOptions?: any
): boolean {
  const opts: ShortAnswerOptions = {
    ...defaultOptions,
    ...(rawOptions || {}),
  } as ShortAnswerOptions;

  const user = normalize(userAnswer || '', opts);

  // Build candidates list
  const accepted = [correctAnswer, ...((opts.acceptedAnswers ?? []) as string[])].filter(Boolean);
  const normalizedAccepted = accepted.map((a) => normalize(String(a), opts));

  // Required keywords gate (checked against normalized user answer)
  if (opts.requiredKeywords && opts.requiredKeywords.length > 0) {
    const allPresent = opts.requiredKeywords.every((kw) => {
      const n = normalize(String(kw), opts);
      return n.length === 0 ? true : user.includes(n);
    });
    if (!allPresent) return false;
  }

  const matchType: ShortAnswerMatchType = (opts.matchType as ShortAnswerMatchType) || 'exact';

  // Matching strategies
  switch (matchType) {
    case 'regex': {
      // Try each accepted as a regex pattern
      for (const patternRaw of accepted) {
        const pattern = String(patternRaw);
        try {
          const flags = (opts.caseInsensitive ?? defaultOptions.caseInsensitive) ? 'i' : undefined;
          const re = new RegExp(pattern, flags);
          if (re.test(userAnswer ?? '')) return true; // test against raw user input for regex
        } catch {
          // Fallback to exact normalized comparison if regex invalid
          const normalizedPattern = normalize(pattern, opts);
          if (normalizedPattern === user) return true;
        }
      }
      return false;
    }
    case 'contains': {
      return normalizedAccepted.some((cand) => user.includes(cand));
    }
    case 'exact':
    default:
      return normalizedAccepted.some((cand) => cand === user);
  }
}
