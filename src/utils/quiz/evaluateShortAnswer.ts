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
  matchType: 'contains', // Changed from 'exact' to 'contains' for more forgiving matching
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
  
  // Remove diacritics/accents for more forgiving matching
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  return s;
}

// Enhanced date patterns for better recognition
const DATE_PATTERNS = [
  // Spanish date patterns
  /(\d{1,2})\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
  /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*(\d{1,2})/i,
  // English date patterns
  /(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2})/i,
  /(\d{1,2})\s*(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  // Numeric patterns
  /(\d{1,2})\/(\d{1,2})/,
  /(\d{1,2})-(\d{1,2})/,
];

// Month name translations
const MONTH_TRANSLATIONS: Record<string, string[]> = {
  'january': ['enero'],
  'february': ['febrero'],
  'march': ['marzo'],
  'april': ['abril'],
  'may': ['mayo'],
  'june': ['junio'],
  'july': ['julio'],
  'august': ['agosto'],
  'september': ['septiembre', 'setiembre'],
  'october': ['octubre'],
  'november': ['noviembre'],
  'december': ['diciembre'],
};

// Business terms equivalents
const BUSINESS_TERMS: Record<string, string[]> = {
  'confidentiality agreement': ['acuerdo de confidencialidad', 'contrato de confidencialidad'],
  'non-disclosure agreement': ['acuerdo de no divulgación', 'contrato de no divulgación'],
  'contract': ['contrato'],
  'policy': ['política', 'politica'],
  'procedure': ['procedimiento'],
  'training': ['capacitación', 'entrenamiento'],
  'safety': ['seguridad'],
  'compliance': ['cumplimiento'],
};

function normalizeDate(text: string): string {
  let normalized = text.toLowerCase().trim();
  
  // Extract date components using patterns
  for (const pattern of DATE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      if (match[1] && match[2]) {
        // Handle day + month format
        const day = match[1].padStart(2, '0');
        let month = match[2].toLowerCase();
        
        // Convert month name to number if needed
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                           'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
                           'january', 'february', 'march', 'april', 'may', 'june',
                           'july', 'august', 'september', 'october', 'november', 'december'];
        const monthIndex = monthNames.indexOf(month);
        if (monthIndex >= 0) {
          const monthNum = (monthIndex % 12) + 1;
          return `${day}/${monthNum.toString().padStart(2, '0')}`;
        }
        
        return `${day}/${match[2]}`;
      }
    }
  }
  
  return normalized;
}

function findBusinessTermEquivalents(text: string): string[] {
  const normalized = text.toLowerCase().trim();
  const equivalents = [normalized];
  
  // Find business term equivalents
  for (const [english, spanish] of Object.entries(BUSINESS_TERMS)) {
    if (normalized.includes(english)) {
      spanish.forEach(term => equivalents.push(normalized.replace(english, term)));
    }
    spanish.forEach(term => {
      if (normalized.includes(term)) {
        equivalents.push(normalized.replace(term, english));
      }
    });
  }
  
  return equivalents;
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

  // Normalize both answers
  const normalizedUser = normalize(userAnswer || '', opts);
  const normalizedCorrect = normalize(correctAnswer, opts);

  // Check all accepted answers (including the main correct answer)
  const allAcceptedAnswers = [
    normalizedCorrect,
    ...(opts.acceptedAnswers || []).map(ans => normalize(ans, opts))
  ];

  // Add date-normalized versions
  const dateNormalizedUser = normalizeDate(userAnswer);
  const dateNormalizedCorrect = normalizeDate(correctAnswer);
  if (dateNormalizedUser !== normalizedUser) {
    allAcceptedAnswers.push(dateNormalizedUser);
  }
  if (dateNormalizedCorrect !== normalizedCorrect) {
    allAcceptedAnswers.push(dateNormalizedCorrect);
  }

  // Add business term equivalents
  const userEquivalents = findBusinessTermEquivalents(userAnswer);
  const correctEquivalents = findBusinessTermEquivalents(correctAnswer);
  
  // Test all combinations
  const testAnswers = [normalizedUser, dateNormalizedUser, ...userEquivalents.map(eq => normalize(eq, opts))];
  const acceptedAnswers = [...allAcceptedAnswers, dateNormalizedCorrect, ...correctEquivalents.map(eq => normalize(eq, opts))];

  for (const testAnswer of testAnswers) {
    for (const acceptedAnswer of acceptedAnswers) {
      let isMatch = false;
      
      switch (opts.matchType) {
        case 'exact':
          isMatch = testAnswer === acceptedAnswer;
          break;
        case 'contains':
          isMatch = testAnswer.includes(acceptedAnswer) || acceptedAnswer.includes(testAnswer);
          break;
        case 'regex':
          try {
            const regex = new RegExp(acceptedAnswer, opts.caseInsensitive ? 'gi' : 'g');
            isMatch = regex.test(testAnswer);
          } catch {
            // Fallback to exact match if regex is invalid  
            isMatch = testAnswer === acceptedAnswer;
          }
          break;
      }
      
      if (isMatch) {
        // Check required keywords if any
        if (opts.requiredKeywords && opts.requiredKeywords.length > 0) {
          const hasAllKeywords = opts.requiredKeywords.every(keyword => 
            testAnswer.includes(normalize(keyword, opts))
          );
          if (hasAllKeywords) return true;
        } else {
          return true;
        }
      }
    }
  }

  // Fuzzy matching for close answers (similarity >= 80%)
  if (opts.matchType === 'exact' || opts.matchType === 'contains') {
    for (const acceptedAnswer of acceptedAnswers) {
      const similarity = calculateSimilarity(normalizedUser, acceptedAnswer);
      if (similarity >= 0.8) {
        return true;
      }
    }
  }

  return false;
}

// Simple similarity calculation using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion  
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}
