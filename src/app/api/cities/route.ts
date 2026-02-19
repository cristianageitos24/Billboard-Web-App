import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(value: string | null): string | null {
  if (value == null || value === "") return null;
  const t = value.trim();
  return UUID_REGEX.test(t) ? t : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateId = parseUuid(searchParams.get("state_id"));

  if (!stateId) {
    return NextResponse.json({ error: "state_id is required" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name")
    .eq("state_id", stateId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cities: data ?? [] });
}
