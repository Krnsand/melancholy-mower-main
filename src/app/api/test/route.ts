import { NextResponse } from "next/server";

export async function GET() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] TEST API ROUTE: Server-side code is executing!`);
  
  return NextResponse.json({
    message: "Server is working",
    timestamp,
    serverSide: true
  });
}
