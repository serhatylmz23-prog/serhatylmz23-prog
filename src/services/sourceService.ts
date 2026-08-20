import type {
  AgentSource,
} from '../agents/agentTypes';

export async function searchSources(
  query: string
): Promise<AgentSource[]> {
  /*
   * Gerçek kaynak bağlantıları burada
   * toplanacak.
   *
   * Ajanlar doğrudan dış API'lere
   * dağılmayacak.
   */

  console.log(
    'Kaynak aranıyor:',
    query
  );

  return [];
}