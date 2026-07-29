import { supabase } from "@/lib/supabase/client";
export const r = supabase.from("profiles").update({ full_name: "x" });
