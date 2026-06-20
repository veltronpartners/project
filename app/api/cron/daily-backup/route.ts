import { NextResponse } from "next/server";
import { runDailyBackup } from "@/lib/backup/snapshot";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyBackup();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Daily backup failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Backup failed" },
      { status: 500 },
    );
  }
}
