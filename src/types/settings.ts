export interface Settings {
  id: string;
  name: string;
  agent_id: string;
  voice_id: string;
  instructions: string;
  bump_instruction: string;
  accelerometer_sensitivity: number;
  session_length: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettings {
  name?: string;
  agent_id?: string;
  voice_id?: string;
  instructions?: string;
  bump_instruction?: string;
  accelerometer_sensitivity?: number;
  session_length?: number;
}
