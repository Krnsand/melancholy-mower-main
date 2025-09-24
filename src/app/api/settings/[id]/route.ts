import { NextRequest, NextResponse } from "next/server";
import { updateSettings } from "@/db/settings";
import { revalidatePath } from "next/cache";

console.log("🚨 API ROUTE FILE LOADED: /api/settings/[id]/route.ts");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const timestamp = new Date().toISOString();
  const executionId = Math.random().toString(36).substring(7);
  
  console.log(`[${timestamp}][${executionId}] API ROUTE: PATCH request received!`);
  
  try {
    const { id } = await params;
    const updates = await request.json();
    
    console.log(`[${timestamp}][${executionId}] API ROUTE: PATCH /api/settings/${id} called with updates:`, updates);
    
    const updatedSettings = await updateSettings(id, updates);
    console.log(`[${timestamp}][${executionId}] API ROUTE: Settings updated successfully:`, updatedSettings);
    
    // Force cache invalidation
    revalidatePath(`/edit/${id}`);
    console.log(`[${timestamp}][${executionId}] API ROUTE: Cache invalidated for /edit/${id}`);
    
    return NextResponse.json({
      success: true,
      data: updatedSettings,
      error: null
    });
  } catch (error) {
    console.error(`[${timestamp}][${executionId}] API ROUTE ERROR:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
