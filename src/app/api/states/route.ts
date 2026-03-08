/** Public reference data: no auth; anon client, RLS allows anon SELECT on states. */
import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export async function GET() {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("states")
    .select("id, name, state_code")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ states: data ?? [] });
}
