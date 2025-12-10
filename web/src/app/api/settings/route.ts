import { NextResponse } from "next/server";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { getOrCreateUserSettings, updateUserSettings } from "@lib/db";
import { encryptSecret, setSecret } from "@lib/keyVault";

const USER_ID = process.env.DEFAULT_USER_ID ?? "demo-user";

const bodySchema = z.object({
  botEnabled: z.boolean(),
  leverage: z.number().min(1).max(50),
  riskPerTradePct: z.number().min(0.005).max(0.03),
  stopLossPct: z.number().min(0.001).max(0.005),
  takeProfitPct: z.number().min(0.002).max(0.02),
  maxDailyLossPct: z.number().min(0.02).max(0.2),
  apiKey: z.string().min(10).optional(),
  apiSecret: z.string().min(10).optional(),
  notes: z.string().max(280).optional(),
});

function serialize(settings: Awaited<ReturnType<typeof getOrCreateUserSettings>>) {
  return {
    botEnabled: settings.botEnabled,
    leverage: settings.leverage,
    riskPerTradePct: Number(settings.riskPerTradePct),
    stopLossPct: Number(settings.stopLossPct),
    takeProfitPct: Number(settings.takeProfitPct),
    maxDailyLossPct: Number(settings.maxDailyLossPct),
    notes: settings.notes,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function GET() {
  const settings = await getOrCreateUserSettings(USER_ID);
  return NextResponse.json(serialize(settings));
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.parse(json);

    const updatePayload: Parameters<typeof updateUserSettings>[1] = {
      botEnabled: parsed.botEnabled,
      leverage: parsed.leverage,
      riskPerTradePct: new Decimal(parsed.riskPerTradePct),
      stopLossPct: new Decimal(parsed.stopLossPct),
      takeProfitPct: new Decimal(parsed.takeProfitPct),
      maxDailyLossPct: new Decimal(parsed.maxDailyLossPct),
      notes: parsed.notes,
    };

    if (parsed.apiKey) {
      updatePayload.apiKeyCipher = await encryptSecret(parsed.apiKey);
      await setSecret(`mexc-api-key-${USER_ID}`, parsed.apiKey);
    }
    if (parsed.apiSecret) {
      updatePayload.apiSecretCipher = await encryptSecret(parsed.apiSecret);
      await setSecret(`mexc-api-secret-${USER_ID}`, parsed.apiSecret);
    }

    const updated = await updateUserSettings(USER_ID, updatePayload);
    return NextResponse.json(serialize(updated));
  } catch (error) {
    console.error("/api/settings", error);
    return NextResponse.json({ error: "Unable to save settings" }, { status: 400 });
  }
}
