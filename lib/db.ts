import { PrismaClient, TradeSide, TradeStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function getOrCreateUserSettings(userId: string) {
  return prisma.userSetting.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      botEnabled: false,
      apiKeyCipher: "",
      apiSecretCipher: "",
    },
  });
}

type UserSettingData = Parameters<typeof prisma.userSetting.update>[0]["data"];

export async function updateUserSettings(userId: string, data: UserSettingData) {
  return prisma.userSetting.update({
    where: { userId },
    data,
  });
}

export async function recordTrade(params: {
  userSettingId: string;
  userId: string;
  side: TradeSide;
  entryPrice: number;
  quantity: number;
  leverage: number;
  confidence: number;
  stopLoss: number;
  takeProfit: number;
  reason: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.trade.create({
    data: {
      ...params,
      entryPrice: new Decimal(params.entryPrice),
      quantity: new Decimal(params.quantity),
      stopLoss: new Decimal(params.stopLoss),
      takeProfit: new Decimal(params.takeProfit),
    },
  });
}

export async function closeTrade(params: {
  tradeId: string;
  exitPrice: number;
  pnl: number;
}) {
  return prisma.trade.update({
    where: { id: params.tradeId },
    data: {
      status: TradeStatus.CLOSED,
      exitPrice: new Decimal(params.exitPrice),
      pnl: new Decimal(params.pnl),
      closedAt: new Date(),
    },
  });
}

export async function getOpenTrade(userSettingId: string) {
  return prisma.trade.findFirst({
    where: { userSettingId, status: TradeStatus.OPEN },
    orderBy: { openedAt: "desc" },
  });
}

export async function listRecentTrades(userId: string, take = 20) {
  return prisma.trade.findMany({
    where: { userId },
    orderBy: { openedAt: "desc" },
    take,
  });
}

export async function appendStrategyLog(params: {
  userSettingId: string;
  level?: "info" | "warn" | "error";
  message: string;
  payload?: Prisma.InputJsonValue;
}) {
  return prisma.strategyLog.create({
    data: {
      ...params,
      level: params.level ?? "info",
    },
  });
}

export async function getTodayLossPct(userSettingId: string) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const record = await prisma.dailyLimit.findUnique({
    where: {
      userSettingId_date: {
        userSettingId,
        date: startOfDay,
      },
    },
  });
  return Number(record?.loss ?? 0);
}

export async function incrementDailyLoss(userSettingId: string, lossPct: number) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  await prisma.dailyLimit.upsert({
    where: {
      userSettingId_date: {
        userSettingId,
        date: startOfDay,
      },
    },
    update: {
      loss: {
        increment: new Decimal(lossPct),
      },
    },
    create: {
      userSettingId,
      date: startOfDay,
      loss: new Decimal(lossPct),
    },
  });
}
