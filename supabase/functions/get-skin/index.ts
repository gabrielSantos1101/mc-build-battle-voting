import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nick } = await req.json()
    
    if (!nick) {
      return new Response(
        JSON.stringify({ error: 'nick is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Get UUID from Mojang
    const uuidRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${nick}`)
    if (!uuidRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Player not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { id: uuid } = await uuidRes.json()

    // 2. Get skin URL from Mojang sessionserver
    const profileRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)
    if (!profileRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const profile = await profileRes.json()
    const textures = JSON.parse(atob(profile.properties[0].value))
    const skinUrl = textures.textures.SKIN.url

    // Optional: Save to database if competitor_id provided
    const { competitor_id } = await req.json().catch(() => ({}))
    
    if (competitor_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      await supabase
        .from('competitors')
        .update({ skin_url: skinUrl })
        .eq('id', competitor_id)
    }

    return new Response(
      JSON.stringify({ skinUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})