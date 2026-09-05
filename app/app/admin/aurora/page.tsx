import { requireAdminPage } from '../access'
import { AuroraMetricsService } from '@/src/modules/aurora/AuroraMetricsService'

export const dynamic = 'force-dynamic'

export default async function AuroraObservatoryPage() {
  await requireAdminPage()

  const [metrics, recentDecisions] = await Promise.all([
    AuroraMetricsService.getOverviewMetrics(),
    AuroraMetricsService.getRecentDecisions(50),
  ])

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Aurora Observatory</h1>
        <p className="text-muted-foreground mt-2">
          Read-only telemetry and feedback capture for the Aurora Decision Engine.
        </p>
      </header>

      {/* 1. Health Summary */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Health Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border rounded shadow-sm bg-card">
            <p className="text-sm text-muted-foreground">Total Decisions</p>
            <p className="text-3xl font-bold">{metrics.totalDecisions}</p>
          </div>
          <div className="p-4 border rounded shadow-sm bg-card">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="text-3xl font-bold">{metrics.averageScore.toFixed(1)}</p>
          </div>
          <div className="p-4 border rounded shadow-sm bg-card">
            <p className="text-sm text-muted-foreground">Avg Confidence</p>
            <p className="text-3xl font-bold">{metrics.averageConfidence.toFixed(1)}</p>
          </div>
        </div>
      </section>

      {/* 2 & 4. Distributions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Evaluation Status</h2>
          <table className="w-full text-left text-sm border">
            <thead className="bg-muted">
              <tr><th className="p-2 border-b">Status</th><th className="p-2 border-b">Count</th><th className="p-2 border-b">Rate</th></tr>
            </thead>
            <tbody>
              {metrics.evaluationStatus.map(m => (
                <tr key={m.label} className="border-b">
                  <td className="p-2">{m.label}</td>
                  <td className="p-2">{m.count}</td>
                  <td className="p-2">{(m.rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <table className="w-full text-left text-sm border">
            <thead className="bg-muted">
              <tr><th className="p-2 border-b">Action</th><th className="p-2 border-b">Count</th><th className="p-2 border-b">Rate</th></tr>
            </thead>
            <tbody>
              {metrics.recommendedAction.map(m => (
                <tr key={m.label} className="border-b">
                  <td className="p-2">{m.label}</td>
                  <td className="p-2">{m.count}</td>
                  <td className="p-2">{(m.rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Telemetry & Feedback */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div>
          <h2 className="text-xl font-semibold mb-4">Semantic Failures</h2>
          <table className="w-full text-left text-sm border">
            <thead className="bg-muted">
              <tr><th className="p-2 border-b">Code</th><th className="p-2 border-b">Count</th></tr>
            </thead>
            <tbody>
              {metrics.semanticFailureCodes.length > 0 ? metrics.semanticFailureCodes.map(m => (
                <tr key={m.label} className="border-b">
                  <td className="p-2">{m.label}</td>
                  <td className="p-2">{m.count}</td>
                </tr>
              )) : <tr><td colSpan={2} className="p-2 text-muted-foreground text-center">No failures</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Feedback Distribution</h2>
          <table className="w-full text-left text-sm border">
            <thead className="bg-muted">
              <tr><th className="p-2 border-b">Type</th><th className="p-2 border-b">Count</th></tr>
            </thead>
            <tbody>
              {metrics.feedbackDistribution.length > 0 ? metrics.feedbackDistribution.map(m => (
                <tr key={m.label} className="border-b">
                  <td className="p-2">{m.label}</td>
                  <td className="p-2">{m.count}</td>
                </tr>
              )) : <tr><td colSpan={2} className="p-2 text-muted-foreground text-center">No feedback yet</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Recent Decision History */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Decisions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border">
            <thead className="bg-muted whitespace-nowrap">
              <tr>
                <th className="p-3 border-b">Time</th>
                <th className="p-3 border-b">Score / Conf</th>
                <th className="p-3 border-b">Action / Priority</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b">Versions (P/C/D)</th>
                <th className="p-3 border-b">Reasons</th>
              </tr>
            </thead>
            <tbody>
              {recentDecisions.map(d => (
                <tr key={d.id} className="border-b hover:bg-muted/50 align-top">
                  <td className="p-3 whitespace-nowrap">{d.createdAt.toISOString().slice(0, 19).replace('T', ' ')}</td>
                  <td className="p-3 whitespace-nowrap font-medium">
                    {d.finalScore} / {d.confidence}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="block font-medium">{d.recommendedAction}</span>
                    <span className="block text-muted-foreground text-xs">{d.priority}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs">
                    <span className="block font-medium">{d.evaluationStatus}</span>
                    {d.semanticFailureCode && <span className="block text-red-500">{d.semanticFailureCode}</span>}
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    <span className="block" title="Policy">{d.policyVersion}</span>
                    <span className="block" title="Classifier">{d.classifierVersion}</span>
                    <span className="block" title="Deterministic">{d.deterministicScorerVersion}</span>
                  </td>
                  <td className="p-3 text-xs max-w-sm">
                    <ul className="list-disc pl-4 space-y-1">
                      {Array.isArray(d.reasons) ? (d.reasons as string[]).map((r, i) => <li key={i}>{r}</li>) : null}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
