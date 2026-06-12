import { createClient } from "@supabase/supabase-js";

// External Supabase project (docs.dharaneesh.in)
// Publishable keys are safe to ship in client code.
const supabaseUrl = "https://ofluahvlbrfyaiprwoqk.supabase.co";
const supabaseKey = "sb_publishable_bR2FbHKzR4nFnXmZ-R7chQ_MegvOnLv";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
