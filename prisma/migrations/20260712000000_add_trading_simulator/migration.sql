-- Trading simulator (paper trading). Additive only.

CREATE TABLE "SimPortfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cashUsd" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "startUsd" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SimPortfolio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SimPortfolio_userId_key" ON "SimPortfolio"("userId");

CREATE TABLE "SimHolding" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "avgCostUsd" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SimHolding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SimHolding_portfolioId_coinId_key" ON "SimHolding"("portfolioId", "coinId");

CREATE TABLE "SimTrade" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "totalUsd" DOUBLE PRECISION NOT NULL,
    "realizedPnlUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimTrade_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SimTrade_portfolioId_createdAt_idx" ON "SimTrade"("portfolioId", "createdAt");

ALTER TABLE "SimPortfolio" ADD CONSTRAINT "SimPortfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimHolding" ADD CONSTRAINT "SimHolding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "SimPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimTrade" ADD CONSTRAINT "SimTrade_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "SimPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
