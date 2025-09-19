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

  console.log(`getSettings: Fetching settings for id: ${id}`);
  
  const { data, error } = await supabase
    .from("settings")
    .select()
    .eq("id", id)
    .single();

  console.log(`getSettings result:`, { 
    data: data ? {
      id: data.id,
      name: data.name,
      instructions: data.instructions,
      voice_id: data.voice_id,
      bump_instruction: data.bump_instruction,
      session_length: data.session_length
    } : null, 
    error 
  });

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

  console.log(`getSettingsByName result:`, { 
    data: data ? {
      id: data.id,
      name: data.name,
      instructions: data.instructions,
      voice_id: data.voice_id,
      bump_instruction: data.bump_instruction,
      session_length: data.session_length
    } : null, 
    error 
  });

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

  console.log(`getAllSettings result:`, { 
    data: data ? data.map(setting => ({
      id: setting.id,
      name: setting.name,
      instructions: setting.instructions,
      voice_id: setting.voice_id,
      bump_instruction: setting.bump_instruction,
      session_length: setting.session_length
    })) : null, 
    error 
  });

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

  console.log(`updateSettings: Updating id ${id} with:`, updates);

  // First verify the record exists and show current values
  const { data: existing } = await supabase
    .from("settings")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) {
    throw new Error(`Settings with id ${id} not found in database`);
  }

  console.log(`BEFORE UPDATE - Current record:`, {
    id: existing.id,
    name: existing.name,
    instructions: existing.instructions,
    voice_id: existing.voice_id,
    bump_instruction: existing.bump_instruction,
    session_length: existing.session_length
  });

  const { data, error } = await supabase
    .from("settings")
    .update(updates)
    .eq("id", id)
    .select();

  console.log(`Update result:`, { 
    data: data ? data.map(setting => ({
      id: setting.id,
      name: setting.name,
      instructions: setting.instructions,
      voice_id: setting.voice_id,
      bump_instruction: setting.bump_instruction,
      session_length: setting.session_length
    })) : null, 
    error 
  });

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error(`Settings with id ${id} not found`);
    }
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // The update succeeded but returned no rows - fetch the updated record
    const { data: updatedRecord } = await supabase
      .from("settings")
      .select()
      .eq("id", id)
      .single();
    
    if (updatedRecord) {
      console.log(`AFTER UPDATE - Fetched record separately:`, {
        id: updatedRecord.id,
        name: updatedRecord.name,
        instructions: updatedRecord.instructions,
        voice_id: updatedRecord.voice_id,
        bump_instruction: updatedRecord.bump_instruction,
        session_length: updatedRecord.session_length
      });
      return updatedRecord;
    } else {
      throw new Error(`Update succeeded but could not retrieve updated record for id ${id}`);
    }
  }

  console.log(`Settings with id ${id} updated successfully.`);
  return data[0];
}

export async function deleteSettings(id: string): Promise<void> {
  const supabase = createSupabaseClient();

  const { error } = await supabase.from("settings").delete().eq("id", id);

  console.log(`deleteSettings result:`, { error });

  if (error) {
    throw new Error(`Failed to delete settings: ${error.message}`);
  }
}
