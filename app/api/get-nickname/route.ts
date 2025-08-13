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
    const suppliedDeviceId = request.headers.get("x-device-id") || "";
    const cookieDeviceId =
      request.cookies.get("terminal_device_id")?.value || "";

    // Prefer: header device id -> cookie device id -> UA hash fallback
    const deviceId =
      suppliedDeviceId || cookieDeviceId || createShortHash(userAgent);

    // Get user data from Firestore using device-specific ID
    const result = await getUserByIP(deviceId);

    if (result.success && result.data) {
      const res = NextResponse.json({
        success: true,
        nickname: result.data.nickname,
        ip: ip,
        deviceId: deviceId,
        exists: true,
      });
      // Ensure cookie is set for persistence across localStorage clears
      if (!cookieDeviceId && deviceId) {
        res.cookies.set({
          name: "terminal_device_id",
          value: deviceId,
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
        });
      }
      return res;
    } else {
      const res = NextResponse.json({
        success: true,
        nickname: null,
        ip: ip,
        deviceId: deviceId,
        exists: false,
      });
      // Ensure cookie is set for persistence across localStorage clears
      if (!cookieDeviceId && deviceId) {
        res.cookies.set({
          name: "terminal_device_id",
          value: deviceId,
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365 * 5, // 5 years
        });
      }
      return res;
    }
  } catch (error) {
    console.error("Error getting nickname:", error);
    return NextResponse.json(
      { error: "Failed to get nickname" },
      { status: 500 }
    );
  }
}
