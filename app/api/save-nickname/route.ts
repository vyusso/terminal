import { NextRequest, NextResponse } from "next/server";
import { saveUserNickname, checkNicknameExists } from "../../lib/firestore";
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
 * API Route for saving user nicknames by IP address
 *
 * This endpoint saves the nickname associated with the user's IP address
 * to Firestore database and prevents duplicate nicknames
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

    // Check if nickname already exists (by any IP)
    const nicknameExists = await checkNicknameExists(nickname);
    if (nicknameExists) {
      return NextResponse.json(
        {
          error: "Nickname already taken",
          success: false,
        },
        { status: 409 }
      ); // 409 Conflict
    }

    // Save to Firestore with device-specific ID
    const result = await saveUserNickname(nickname, deviceId);

    if (result.success) {
      const res = NextResponse.json({
        success: true,
        message: "Nickname saved to database",
        ip: ip,
        deviceId: deviceId,
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
      console.error("Firestore error:", result.error);
      return NextResponse.json(
        { error: "Failed to save to database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving nickname:", error);
    return NextResponse.json(
      { error: "Failed to save nickname" },
      { status: 500 }
    );
  }
}
