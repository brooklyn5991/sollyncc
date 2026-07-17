import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://tlcwkgcprbvoldrlvndy.supabase.co";

const SUPABASE_KEY = "sb_publishable_-KkGwdC-Gkn0mvzoMaLbXA_2Bi32ecM";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);