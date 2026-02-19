import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("states")
    .select("id, name, state_code")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ states: data ?? [] });
}
