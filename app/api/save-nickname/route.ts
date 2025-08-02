import { NextRequest, NextResponse } from "next/server";

/**
 * API Route for saving user nicknames by IP address
 *
 * This endpoint saves the nickname associated with the user's IP address
 * For now, it just returns success (future database integration)
 */
export async function POST(request: NextRequest) {
  try {
    const { nickname } = await request.json();

    if (!nickname || typeof nickname !== "string") {
      return NextResponse.json({ error: "Invalid nickname" }, { status: 400 });
    }

    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json(
        { error: "Nickname must be between 2 and 20 characters" },
        { status: 400 }
      );
    }

    // Get client IP address
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0] : realIp || "unknown";

    // TODO: Save to database with IP address
    // For now, just log the data
    console.log(`Saving nickname "${nickname}" for IP: ${ip}`);

    // Future database integration:
    // await db.nicknames.upsert({
    //   where: { ip },
    //   update: { nickname },
    //   create: { ip, nickname }
    // });

    return NextResponse.json({
      success: true,
      message: "Nickname saved successfully",
      ip: ip,
    });
  } catch (error) {
    console.error("Error saving nickname:", error);
    return NextResponse.json(
      { error: "Failed to save nickname" },
      { status: 500 }
    );
  }
}
