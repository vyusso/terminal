import { NextResponse } from "next/server";
import { getAllActiveComments } from "../../lib/firestore";

export async function GET() {
  const res = await getAllActiveComments();
  if (!res.success) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: res.data || [] });
}
