// Conversion quests stay suspended until a verified conversion producer exists.
// Customer reports and CRM exports are not reward evidence.
export function questCompletionAvailable(eventType: string) {
  return eventType !== 'lead.converted'
}
