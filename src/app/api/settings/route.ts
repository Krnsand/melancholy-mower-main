import { NextResponse } from "next/server";

console.log("🚨 SETTINGS BASE ROUTE LOADED: /api/settings/route.ts");

export async function GET() {
  console.log("GET /api/settings called");
  return NextResponse.json({ message: "Settings base route working" });
}
