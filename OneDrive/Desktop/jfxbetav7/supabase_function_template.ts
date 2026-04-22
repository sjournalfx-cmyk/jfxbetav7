
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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { sync_key, account_info, trades } = await req.json()

        if (!sync_key) {
            return new Response(JSON.stringify({ error: 'Missing sync key' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 1. Find the profile with this sync key
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('sync_key', sync_key)
            .single()

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'Invalid sync key' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 2. Update profile connection status
        await supabaseClient
            .from('profiles')
            .update({ ea_connected: true, updated_at: new Date().toISOString() })
            .eq('id', profile.id)

        // 3. Process trades (optional: you can implement logic to insert new trades here)
        // For now, we just acknowledge the connection

        return new Response(JSON.stringify({ message: 'Sync successful', userId: profile.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
