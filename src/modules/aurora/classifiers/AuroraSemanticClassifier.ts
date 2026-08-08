import { AuroraSemanticInput, AuroraSemanticResult } from '../types';

export interface AuroraSemanticClassifier {
  classify(input: AuroraSemanticInput): Promise<AuroraSemanticResult>;
}
