import { NextResponse } from "next/server";
import { getTaskReadiness } from "@/lib/readiness";

export async function GET() {
  return NextResponse.json({ network: "mainnet", ...(await getTaskReadiness()) });
}
