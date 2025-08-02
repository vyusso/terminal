import { NextRequest, NextResponse } from "next/server";
import { getUserByIP } from "../../lib/firestore";
import { createHash } from "crypto";

/**
 * Create a short hash from a string
 * @param input - String to hash
 * @returns Short hash string
 */
function createShortHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").substring(0, 16);
}

/**
 * API Route for getting user nickname by IP address
 *
 * This endpoint retrieves the nickname associated with the user's IP address
 * from Firestore database
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP address and user agent for device-specific identification
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0] : realIp || "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    // Create a unique device identifier (hash of User Agent for cross-network consistency)
    const deviceId = createShortHash(userAgent);

    // Get user data from Firestore using device-specific ID
    const result = await getUserByIP(deviceId);

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        nickname: result.data.nickname,
        ip: ip,
        deviceId: deviceId,
        exists: true,
      });
    } else {
      return NextResponse.json({
        success: true,
        nickname: null,
        ip: ip,
        deviceId: deviceId,
        exists: false,
      });
    }
  } catch (error) {
    console.error("Error getting nickname:", error);
    return NextResponse.json(
      { error: "Failed to get nickname" },
      { status: 500 }
    );
  }
}
