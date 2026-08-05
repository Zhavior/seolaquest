import { QuestRouteSkeleton } from '@/components/quest'

/** Mage Tower route fallback: dossier banner, stat fields, then the post board. */
export default function ProfileLoading() {
  return (
    <QuestRouteSkeleton
      label="Mage Tower"
      rows={['h-40', { count: 6, columns: 3, height: 'h-24' }, 'h-64']}
    />
  )
}
