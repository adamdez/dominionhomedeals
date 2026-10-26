import { receiveTeamAlertStatus } from '@/server/team-lead-alerts'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try { return new Response(null,{status:await receiveTeamAlertStatus(request)}) }
  catch { return new Response(null,{status:503}) }
}
