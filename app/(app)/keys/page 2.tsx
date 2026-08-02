import ApiKeyVault from '@/components/keys/ApiKeyVault'

export const metadata = {
  title: 'API Rune Forge | CoQuest',
  description: 'Manage secret API Runes, permissions, and daily Mana quotas for external bot integrations.',
}

export default function ApiKeysPage() {
  return <ApiKeyVault />
}
