import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

let supabaseInstance = null;

export const Supabase = {
    init() {
        if (!supabaseInstance) {
            supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        return supabaseInstance;
    },

    get client() {
        return this.init();
    }
};
