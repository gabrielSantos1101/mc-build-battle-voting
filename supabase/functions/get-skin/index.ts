// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface ReqPayload {
  nick: string;
  competitor_id?: string;
}

interface SkinResponse {
  skinUrl?: string;
  error?: string;
}

console.info("get-skin function started");

export default {
  fetch: async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    try {
      const { nick, competitor_id }: ReqPayload = await req.json();

      if (!nick) {
        return new Response(
          JSON.stringify({ error: 'nick is required' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
          }
        );
      }

      // 1. Get UUID from Mojang API
      const uuidRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${nick}`);
      if (!uuidRes.ok) {
        return new Response(
          JSON.stringify({ error: 'Player not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      const { id: uuid } = await uuidRes.json();

      // 2. Get skin URL from Mojang sessionserver
      const profileRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
      if (!profileRes.ok) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const profile = await profileRes.json();
      const textures = JSON.parse(atob(profile.properties[0].value));
      // O Mojang devolve http://, que o navegador bloqueia como mixed
      // content em pagina https (Vercel). textures.minecraft.net serve https.
      const skinUrl = textures.textures.SKIN.url.replace(/^http:\/\//, 'https://');

      // Optional: Save to database if competitor_id provided
      // Note: Database operations would need Supabase client with service role
      // For now just return the skin URL

      return new Response(
        JSON.stringify({ skinUrl }),
        { 
          headers: { 
            'Content-Type': 'application/json', 
            'Access-Control-Allow-Origin': '*' 
          } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
  },
};