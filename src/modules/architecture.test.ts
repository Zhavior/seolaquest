// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? sources(file) : /\.tsx?$/.test(file) && !/(?:\.test\.| 2\.|__tests__)/.test(file) ? [file] : []
  })
}
const owners: Record<string, string> = {
  auroraDecision: 'src/modules/aurora/',
  leadOutcome: 'src/modules/leads/application/LeadOutcomeService.ts',
  gamifyXpTransaction: 'src/modules/gamify/',
  gamifyReputationTransaction: 'src/modules/gamify/',
  creditLedgerEntry: 'src/modules/billing/',
}
const writes = new Set(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'])

describe('governed module boundaries', () => {
  it('keeps critical evidence and ledger writes in their owning modules', () => {
    const violations: string[] = []
    for (const file of ['src/modules', 'app', 'features', 'lib'].flatMap(sources)) {
      const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
          && writes.has(node.expression.name.text) && ts.isPropertyAccessExpression(node.expression.expression)) {
          const model = node.expression.expression.name.text
          const owner = owners[model]
          // Existing scan-credit transactions span Leads and Billing. Freeze that debt to this file.
          const existingScanCreditWriter = model === 'creditLedgerEntry' && file === 'src/modules/leads/application/ScanRunService.ts'
          if (owner && !file.startsWith(owner) && !existingScanCreditWriter) violations.push(`${file}: ${model}.${node.expression.name.text}`)
        }
        ts.forEachChild(node, visit)
      }
      visit(ast)
    }
    expect(violations).toEqual([])
  })

  it('keeps the new state policy pure and backend contracts independent of UI', () => {
    const files = ['src/modules/leads/domain/leadTransition.ts', 'src/modules/leads/domain/leadEvidence.ts',
      'src/modules/leads/application/LeadOutcomeService.ts', 'src/modules/leads/application/LeadQueryService.ts',
      'src/modules/aurora/AuroraDecisionReader.ts']
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text).not.toMatch(/from ['"](?:@\/(?:features|app|components)\/|react|next\/)/)
      if (file.includes('/domain/')) expect(text).not.toMatch(/fetch\(|from ['"]@\/lib\/prisma/)
    }
  })
})
