export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendedAction = 'IGNORE' | 'WATCH' | 'ENGAGE';
export type EvaluationStatus = 'LIVE' | 'DETERMINISTIC_ONLY' | 'FALLBACK' | 'UNAVAILABLE';
export type FeedbackType = 'DISMISSED' | 'SAVED' | 'ENGAGED' | 'REPLIED' | 'QUALIFIED' | 'CONVERTED' | 'MANUAL_OVERRIDE';

export interface AuroraSemanticInput {
  opportunityId: string;
  sourceEventId: string;
  text: string;
  context: Record<string, unknown>;
}

export type SemanticFailureCode = 'TIMEOUT' | 'RATE_LIMITED' | 'PROVIDER_ERROR' | 'MALFORMED_RESPONSE' | 'VALIDATION_ERROR';

export interface AuroraSemanticResult {
  confidence: number;
  semanticSignals: Record<string, unknown> | null;
  reasons: string[];
  failureCode?: SemanticFailureCode;
}

export interface AuroraSemanticClassifier {
  classify(input: AuroraSemanticInput): Promise<AuroraSemanticResult>;
}

export interface DeterministicScorerResult {
  hardReject: boolean;
  hardRejectReasons: string[];
  signals: Record<string, unknown>;
}

export interface CanonicalPolicyResult {
  finalScore: number;
  confidence: number;
  priority: Priority;
  recommendedAction: RecommendedAction;
  canonicalReasons: string[];
  semanticFailureCode?: SemanticFailureCode | null;
}

export interface AuroraEvaluationContext {
  opportunityId: string;
  sourceEventId: string;
  policyVersion: string;
  text: string;
  source: string;
  discoveredAt: string;
  keywordContext?: Record<string, unknown>;
  campaignContext?: Record<string, unknown>;
  businessContext?: Record<string, unknown>;
  additionalData?: Record<string, unknown>;
}
