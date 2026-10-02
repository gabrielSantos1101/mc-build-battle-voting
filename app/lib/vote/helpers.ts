import { supabase } from '../supabase/client'
import { getClientIP } from '../ip/detection'
import { getDeviceId } from '../auth'

export async function hasIPVotedInRound(roundId: string, ip: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('round_id', roundId)
    .eq('ip', ip)
    .limit(1)
    .maybeSingle()
  
  return !error && !!data
}

export async function canVote(roundId: string): Promise<{ canVote: boolean; reason?: string }> {
  const deviceId = getDeviceId()
  const { data: deviceVote } = await supabase
    .from('votes')
    .select('id')
    .eq('round_id', roundId)
    .eq('device_id', deviceId)
    .limit(1)
    .maybeSingle()
  
  if (deviceVote) {
    return { canVote: false, reason: 'device' }
  }

  const ipInfo = await getClientIP()
  const ipVoted = await hasIPVotedInRound(roundId, ipInfo.ip)
  if (ipVoted) {
    return { canVote: false, reason: 'ip' }
  }

  return { canVote: true }
}