import { NextResponse } from "next/server";
import { getAvailableVoices } from "@/db/voices";

export async function GET() {
  try {
    const voices = await getAvailableVoices();
    return NextResponse.json(voices);
  } catch (error) {
    console.error("Error fetching voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
