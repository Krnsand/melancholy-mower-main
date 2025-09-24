import { createServerClient } from "@supabase/ssr";
import { Settings, UpdateSettings } from "@/types/settings";

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

export async function createSettings(
  settings: Omit<Settings, "id" | "created_at" | "updated_at">
): Promise<Settings> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("settings")
    .insert(settings)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create settings: ${error.message}`);
  }

  return data;
}

export async function getSettings(id: string): Promise<Settings | null> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("settings")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get settings: ${error.message}`);
  }

  return data;
}

export async function getSettingsByName(
  name: string
): Promise<Settings | null> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("settings")
    .select()
    .eq("name", name)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get settings by name: ${error.message}`);
  }

  return data;
}

export async function getAllSettings(): Promise<Settings[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("settings")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get all settings: ${error.message}`);
  }

  return data || [];
}

export async function updateSettings(
  id: string,
  updates: UpdateSettings
): Promise<Settings> {
  const supabase = createSupabaseClient();

  const { data: existing } = await supabase
    .from("settings")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) {
    throw new Error(`Settings with id ${id} not found in database`);
  }

  const updateKeys = Object.keys(updates);
  const updateValues = Object.values(updates);

  if (updateKeys.length === 1) {
    const field = updateKeys[0];
    const value = updateValues[0];

    const { data: rawData, error: rawError } = await supabase
      .from("settings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (!rawError && rawData) {
      return rawData;
    }
  }

  const { data, error } = await supabase
    .from("settings")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error(`Settings with id ${id} not found`);
    }
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  if (!data || data.length === 0) {
    const { data: updatedRecord, error: fetchError } = await supabase
      .from("settings")
      .select()
      .eq("id", id)
      .single();

    if (updatedRecord) {
      return updatedRecord;
    } else {
      throw new Error(`Update succeeded but could not retrieve updated record for id ${id}`);
    }
  }

  return data[0];
}

export async function deleteSettings(id: string): Promise<void> {
  const supabase = createSupabaseClient();

  const { error } = await supabase.from("settings").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete settings: ${error.message}`);
  }
}
