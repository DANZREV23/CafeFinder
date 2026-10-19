import net from 'net';
import path from 'path';
import fs from 'fs';

let localServerInstance: net.Server | null = null;
let pgliteDbInstance: any = null;
let isStarting = false;

export const LOCAL_PG_PORT = 5445;
export const LOCAL_PG_HOST = '127.0.0.1';
export const LOCAL_DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${LOCAL_PG_PORT}/cloud_sql_development_database?sslmode=disable&connect_timeout=15&connection_limit=1&pool_timeout=30&statement_cache_size=0`;

const IDENT_TO_MESSAGE_NAME: Record<number, string> = {
  ['B'.charCodeAt(0)]: 'Bind',
  ['C'.charCodeAt(0)]: 'Close',
  ['f'.charCodeAt(0)]: 'CopyFail',
  ['d'.charCodeAt(0)]: 'CopyData',
  ['c'.charCodeAt(0)]: 'CopyDone',
  ['D'.charCodeAt(0)]: 'Describe',
  ['E'.charCodeAt(0)]: 'Execute',
  ['H'.charCodeAt(0)]: 'Flush',
  ['F'.charCodeAt(0)]: 'FunctionCall',
  ['P'.charCodeAt(0)]: 'Parse',
  ['p'.charCodeAt(0)]: 'PasswordMessage',
  ['Q'.charCodeAt(0)]: 'Query',
  ['S'.charCodeAt(0)]: 'Sync',
  ['X'.charCodeAt(0)]: 'Terminate',
};

function parseWireMessage(buffer: Buffer): { name: string; length: number; buffer: Buffer } {
  if (buffer.length < 5) {
    return { name: 'InsufficientData', length: 0, buffer: Buffer.alloc(0) };
  }
  if (buffer.length >= 8) {
    const b4 = buffer[4];
    const b5 = buffer[5];
    const b6 = buffer[6];
    const b7 = buffer[7];
    let specialName: string | null = null;
    if (b4 === 4 && b5 === 210 && b6 === 22 && b7 === 46) specialName = 'CancelRequest';
    else if (b4 === 4 && b5 === 210 && b6 === 22 && b7 === 48) specialName = 'GSSENCRequest';
    else if (b4 === 4 && b5 === 210 && b6 === 22 && b7 === 47) specialName = 'SSLRequest';
    else if (b4 === 0 && b5 === 3 && b6 === 0 && b7 === 0) specialName = 'StartupMessage';

    if (specialName) {
      const len = buffer.readUInt32BE(0);
      if (buffer.length < len) {
        return { name: 'InsufficientData', length: 0, buffer: Buffer.alloc(0) };
      }
      return { name: specialName, length: len, buffer: Buffer.from(buffer.subarray(0, len)) };
    }
  }

  const name = IDENT_TO_MESSAGE_NAME[buffer[0]];
  if (!name) {
    if (buffer.length < 8) {
      return { name: 'InsufficientData', length: 0, buffer: Buffer.alloc(0) };
    }
    return { name: 'Unknown', length: buffer.length, buffer: Buffer.alloc(0) };
  }
  const length = buffer.readUInt32BE(1) + 1;
  if (buffer.length < length) {
    return { name: 'InsufficientData', length: 0, buffer: Buffer.alloc(0) };
  }
  return { name, length, buffer: Buffer.from(buffer.subarray(0, length)) };
}

function buildParamStatus(key: string, value: string): Buffer {
  const keyBuf = Buffer.from(key, 'utf8');
  const valBuf = Buffer.from(value, 'utf8');
  const totalLen = 4 + keyBuf.length + 1 + valBuf.length + 1;
  const buf = Buffer.alloc(1 + totalLen);
  buf.write('S', 0);
  buf.writeUInt32BE(totalLen, 1);
  keyBuf.copy(buf, 5);
  buf[5 + keyBuf.length] = 0;
  valBuf.copy(buf, 6 + keyBuf.length);
  buf[6 + keyBuf.length + valBuf.length] = 0;
  return buf;
}

function buildStartupResponse(): Buffer {
  const authOk = Buffer.alloc(9);
  authOk.write('R', 0);
  authOk.writeUInt32BE(8, 1);
  authOk.writeUInt32BE(0, 5);

  const params = buildParamStatus('server_version', 'pglite');

  const backendKey = Buffer.alloc(13);
  backendKey.write('K', 0);
  backendKey.writeUInt32BE(12, 1);
  backendKey.writeUInt32BE(1, 5);
  backendKey.writeUInt32BE(2, 9);

  const ready = Buffer.alloc(6);
  ready.write('Z', 0);
  ready.writeUInt32BE(5, 1);
  ready.write('I', 5);

  return Buffer.concat([authOk, params, backendKey, ready]);
}

function buildErrorResponse(message: string): Buffer {
  const msgBuf = Buffer.from(message, 'utf8');
  const errLen = 4 + 1 + msgBuf.length + 1 + 1;
  const errBuf = Buffer.alloc(1 + errLen);
  errBuf.write('E', 0);
  errBuf.writeUInt32BE(errLen, 1);
  errBuf.write('M', 5);
  msgBuf.copy(errBuf, 6);
  errBuf[6 + msgBuf.length] = 0;
  errBuf[7 + msgBuf.length] = 0;

  const ready = Buffer.alloc(6);
  ready.write('Z', 0);
  ready.writeUInt32BE(5, 1);
  ready.write('I', 5);

  return Buffer.concat([errBuf, ready]);
}

const STARTUP_RESPONSE_BUFFER = buildStartupResponse();
const NO_RESPONSE_BUFFER = Buffer.from('N');

const FLUSH_BOUNDARY_MESSAGES = new Set([
  'Sync',
  'Flush',
  'Query',
  'StartupMessage',
  'SSLRequest',
  'GSSENCRequest',
  'PasswordMessage',
  'Terminate',
  'CancelRequest',
  'CopyDone',
  'CopyFail',
  'FunctionCall',
  'Unknown',
]);

function findCompleteBatchBoundary(buffer: Buffer): number {
  let offset = 0;
  let lastBoundaryEnd = 0;

  while (offset < buffer.length) {
    const slice = buffer.subarray(offset);
    const msg = parseWireMessage(slice);
    if (msg.name === 'InsufficientData' || msg.length <= 0) {
      break;
    }
    offset += msg.length;
    if (FLUSH_BOUNDARY_MESSAGES.has(msg.name)) {
      lastBoundaryEnd = offset;
    }
  }

  return lastBoundaryEnd;
}

/**
 * Creates a PostgreSQL wire-protocol TCP server around a single PGlite instance
 * with strict batch serialization so concurrent sockets never interleave extended-query
 * protocol frames (Parse/Bind/Describe/Execute/Sync), even across fragmented TCP packets.
 */
function createSerializedPgliteServer(db: any): net.Server {
  let dbQueue: Promise<void> = Promise.resolve();

  const runExclusive = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = dbQueue.then(fn, fn);
    dbQueue = next.then(() => undefined, () => undefined);
    return next;
  };

  return net.createServer((socket) => {
    socket.setNoDelay(true);
    let clientBuffer: Buffer = Buffer.alloc(0);

    socket.on('data', (data: Buffer) => {
      clientBuffer = Buffer.concat([clientBuffer, data]);

      const boundaryEnd = findCompleteBatchBoundary(clientBuffer);
      if (boundaryEnd === 0) {
        // Wait for more TCP data until a Sync/Flush/Query boundary arrives
        return;
      }

      const batchBuffer = Buffer.from(clientBuffer.subarray(0, boundaryEnd));
      clientBuffer = Buffer.from(clientBuffer.subarray(boundaryEnd));

      void runExclusive(async () => {
        let workBuffer = batchBuffer;
        const outgoingChunks: Buffer[] = [];
        let shouldEndSocket = false;

        while (workBuffer.length > 0 && !socket.destroyed) {
          const msg = parseWireMessage(workBuffer);
          if (msg.name === 'InsufficientData') {
            break;
          }

          if (msg.name === 'CancelRequest' || msg.name === 'Terminate' || msg.name === 'Unknown') {
            workBuffer = Buffer.from(workBuffer.subarray(msg.length));
            shouldEndSocket = true;
            break;
          }

          if (msg.name === 'SSLRequest' || msg.name === 'GSSENCRequest') {
            workBuffer = Buffer.from(workBuffer.subarray(msg.length));
            outgoingChunks.push(NO_RESPONSE_BUFFER);
            continue;
          }

          if (msg.name === 'StartupMessage') {
            workBuffer = Buffer.from(workBuffer.subarray(msg.length));
            outgoingChunks.push(STARTUP_RESPONSE_BUFFER);
            continue;
          }

          workBuffer = Buffer.from(workBuffer.subarray(msg.length));

          let responseBuf: Buffer | null = null;
          let hadEarlyExtendedError = false;
          try {
            const res = await db.execProtocol(msg.buffer);
            if (res?.data?.byteLength > 0) {
              responseBuf = Buffer.from(res.data);
              // If an extended-query message before Sync returned ErrorResponse ('E'),
              // PGlite already appended ReadyForQuery ('Z'). Skip remaining messages up to Sync.
              if (msg.name !== 'Sync' && msg.name !== 'Query' && responseBuf[0] === 0x45) {
                hadEarlyExtendedError = true;
              }
            }
          } catch (err: any) {
            responseBuf = buildErrorResponse(err instanceof Error ? err.message : 'Protocol execution error');
            if (msg.name !== 'Sync' && msg.name !== 'Query') {
              hadEarlyExtendedError = true;
            }
          }

          if (hadEarlyExtendedError) {
            while (workBuffer.length > 0) {
              const skipped = parseWireMessage(workBuffer);
              if (skipped.name === 'InsufficientData') break;
              workBuffer = Buffer.from(workBuffer.subarray(skipped.length));
              if (skipped.name === 'Sync') break;
            }
          }

          if (responseBuf) {
            outgoingChunks.push(responseBuf);
          }
        }

        if (outgoingChunks.length > 0 && !socket.destroyed) {
          socket.write(outgoingChunks.length === 1 ? outgoingChunks[0] : Buffer.concat(outgoingChunks));
        }
        if (shouldEndSocket && !socket.destroyed) {
          socket.end();
        }
      }).catch((err) => {
        console.error('[LocalPostgres]: Unhandled buffer error:', err);
        if (!socket.destroyed) socket.end();
      });
    });

    socket.on('error', (err: any) => {
      if (err?.code !== 'ECONNRESET' && err?.code !== 'EPIPE') {
        console.error('[LocalPostgres]: Socket error:', err.message || err);
      }
    });
  });
}

function checkPortListening(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function ensurePostgresDirectories(dataDir: string) {
  const requiredDirs = [
    'base',
    'global',
    'pg_commit_ts',
    'pg_dynshmem',
    'pg_logical',
    'pg_logical/mappings',
    'pg_logical/snapshots',
    'pg_multixact',
    'pg_multixact/members',
    'pg_multixact/offsets',
    'pg_notify',
    'pg_replslot',
    'pg_serial',
    'pg_snapshots',
    'pg_stat',
    'pg_stat_tmp',
    'pg_subtrans',
    'pg_tblspc',
    'pg_twophase',
    'pg_wal',
    'pg_xact'
  ];
  for (const dir of requiredDirs) {
    const full = path.join(dataDir, dir);
    if (!fs.existsSync(full)) {
      try {
        fs.mkdirSync(full, { recursive: true });
      } catch (_) {}
    }
  }

  // Remove stale postmaster.pid only if it is older than 15 seconds (unclean shutdown)
  const pidFile = path.join(dataDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      const stat = fs.statSync(pidFile);
      if (Date.now() - stat.mtimeMs > 15000) {
        fs.unlinkSync(pidFile);
        console.log(`[LocalPostgres]: Removed stale postmaster.pid from ${dataDir}`);
      }
    } catch (_) {}
  }
}

/**
 * Starts the embedded PostgreSQL server using PGlite if not already running.
 */
export async function startLocalPostgresServer(): Promise<string> {
  if (localServerInstance && localServerInstance.listening) {
    return LOCAL_DATABASE_URL;
  }

  // Check if port is already active from an existing process
  const alreadyListening = await checkPortListening(LOCAL_PG_PORT);
  if (alreadyListening) {
    console.log(`[LocalPostgres]: Port ${LOCAL_PG_PORT} is already active and accepting connections.`);
    return LOCAL_DATABASE_URL;
  }

  const dataDir = path.resolve(process.cwd(), 'prisma/pgdata_v10');
  const pidFile = path.join(dataDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    try {
      const stat = fs.statSync(pidFile);
      if (Date.now() - stat.mtimeMs < 15000) {
        // Another process may be actively initializing PGlite; poll port briefly before starting a second instance
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 300));
          if (await checkPortListening(LOCAL_PG_PORT)) {
            console.log(`[LocalPostgres]: Port ${LOCAL_PG_PORT} became active from another process.`);
            return LOCAL_DATABASE_URL;
          }
        }
      }
    } catch (_) {}
  }

  if (isStarting) {
    console.log('[LocalPostgres]: Already starting, waiting...');
    while (isStarting) {
      await new Promise(r => setTimeout(r, 100));
    }
    return LOCAL_DATABASE_URL;
  }

  isStarting = true;
  console.log('[LocalPostgres]: Starting embedded PostgreSQL service...');
  try {
    const { PGlite } = await import('@electric-sql/pglite');

    const dataDir = path.resolve(process.cwd(), 'prisma/pgdata_v10');
    console.log(`[LocalPostgres]: Using data directory: ${dataDir}`);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Ensure all mandatory Postgres subdirectories exist to avoid startup crash
    ensurePostgresDirectories(dataDir);

    console.log('[LocalPostgres]: Initializing PGlite...');
    try {
      pgliteDbInstance = new PGlite(dataDir);
      await pgliteDbInstance.waitReady;
      await pgliteDbInstance.query('SELECT 1');
    } catch (pgErr: any) {
      console.warn('[LocalPostgres]: PGlite failed with existing dataDir, resetting corrupted directory:', pgErr.message || pgErr);
      try {
        fs.rmSync(dataDir, { recursive: true, force: true });
        fs.mkdirSync(dataDir, { recursive: true });
        ensurePostgresDirectories(dataDir);
        pgliteDbInstance = new PGlite(dataDir);
        await pgliteDbInstance.waitReady;
      } catch (resetErr: any) {
        console.warn('[LocalPostgres]: Disk PGlite reset failed, falling back to in-memory PGlite:', resetErr.message || resetErr);
        pgliteDbInstance = new PGlite();
        await pgliteDbInstance.waitReady;
      }
    }
    console.log('[LocalPostgres]: PGlite ready.');

    // Check if initial schema needs to be applied
    try {
      const checkRes = await pgliteDbInstance.query(`SELECT to_regclass('public.cafes') AS reg;`);
      const hasCafesTable = Boolean(checkRes?.rows?.[0]?.reg);
      if (!hasCafesTable) {
        const fullSchemaPath = path.resolve(process.cwd(), 'prisma/full_schema.sql');
        if (fs.existsSync(fullSchemaPath)) {
          console.log('[LocalPostgres]: Applying full_schema.sql to initialize database...');
          const fullSql = fs.readFileSync(fullSchemaPath, 'utf8');
          await pgliteDbInstance.exec(fullSql);
          console.log('[LocalPostgres]: Full schema initialized successfully.');
        }
      }
    } catch (initErr: any) {
      console.warn('[LocalPostgres]: Notice during full schema check:', initErr.message || initErr);
    }

    // Ensure Stage 40 & 41 schema tables, columns, and enums exist in local PGlite instance
    try {
      await pgliteDbInstance.exec(`
        DO $$ BEGIN
          CREATE TYPE "InquiryCategory" AS ENUM ('GENERAL', 'HOURS', 'MENU', 'RESERVATION', 'EVENT', 'SPECIAL', 'WIFI', 'AMENITIES', 'PRIVATE_EVENT', 'ACCESSIBILITY', 'OTHER');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'READ', 'IN_PROGRESS', 'RESPONDED', 'CLOSED', 'SPAM');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "InquiryPriority" AS ENUM ('NORMAL', 'HIGH');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "InquirySource" AS ENUM ('CAFE_PROFILE', 'EVENT', 'SPECIAL', 'EXPLORE', 'OTHER');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "InquirySenderRole" AS ENUM ('OWNER', 'CUSTOMER', 'ADMIN');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          ALTER TYPE "CafeAnalyticsEventType" ADD VALUE IF NOT EXISTS 'INQUIRY_SUBMITTED';
        EXCEPTION WHEN others THEN null; END $$;

        ALTER TABLE "cafes" ADD COLUMN IF NOT EXISTS "followerCount" INTEGER NOT NULL DEFAULT 0;

        CREATE TABLE IF NOT EXISTS "cafe_follows" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "cafeId" TEXT NOT NULL,
          "eventsEnabled" BOOLEAN NOT NULL DEFAULT true,
          "specialsEnabled" BOOLEAN NOT NULL DEFAULT true,
          "announcementsEnabled" BOOLEAN NOT NULL DEFAULT true,
          "menuUpdatesEnabled" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cafe_follows_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_follows_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "cafe_follows_userId_cafeId_key" ON "cafe_follows"("userId", "cafeId");
        CREATE INDEX IF NOT EXISTS "cafe_follows_userId_idx" ON "cafe_follows"("userId");
        CREATE INDEX IF NOT EXISTS "cafe_follows_cafeId_idx" ON "cafe_follows"("cafeId");
        CREATE INDEX IF NOT EXISTS "cafe_follows_userId_createdAt_idx" ON "cafe_follows"("userId", "createdAt");
        CREATE INDEX IF NOT EXISTS "cafe_follows_cafeId_createdAt_idx" ON "cafe_follows"("cafeId", "createdAt");

        CREATE TABLE IF NOT EXISTS "cafe_inquiries" (
          "id" TEXT NOT NULL,
          "cafeId" TEXT NOT NULL,
          "userId" TEXT,
          "guestName" TEXT,
          "guestEmail" TEXT,
          "subject" VARCHAR(150) NOT NULL,
          "message" TEXT NOT NULL,
          "category" "InquiryCategory" NOT NULL DEFAULT 'GENERAL',
          "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
          "priority" "InquiryPriority" NOT NULL DEFAULT 'NORMAL',
          "source" "InquirySource" NOT NULL DEFAULT 'CAFE_PROFILE',
          "eventId" TEXT,
          "specialId" TEXT,
          "hasUnreadResponse" BOOLEAN NOT NULL DEFAULT false,
          "ipAddressHash" VARCHAR(64),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "readAt" TIMESTAMP(3),
          "respondedAt" TIMESTAMP(3),
          "closedAt" TIMESTAMP(3),
          CONSTRAINT "cafe_inquiries_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_inquiries_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "cafe_inquiries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "cafe_events"("id") ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "cafe_inquiries_specialId_fkey" FOREIGN KEY ("specialId") REFERENCES "cafe_specials"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );

        CREATE INDEX IF NOT EXISTS "cafe_inquiries_cafeId_idx" ON "cafe_inquiries"("cafeId");
        CREATE INDEX IF NOT EXISTS "cafe_inquiries_userId_idx" ON "cafe_inquiries"("userId");
        CREATE INDEX IF NOT EXISTS "cafe_inquiries_status_idx" ON "cafe_inquiries"("status");
        CREATE INDEX IF NOT EXISTS "cafe_inquiries_category_idx" ON "cafe_inquiries"("category");
        CREATE INDEX IF NOT EXISTS "cafe_inquiries_priority_idx" ON "cafe_inquiries"("priority");
        CREATE INDEX IF NOT EXISTS "cafe_inquiries_createdAt_idx" ON "cafe_inquiries"("createdAt");
        CREATE INDEX IF NOT EXISTS "cafe_inquiries_cafeId_status_idx" ON "cafe_inquiries"("cafeId", "status");
        CREATE INDEX IF NOT EXISTS "cafe_inquiries_userId_status_idx" ON "cafe_inquiries"("userId", "status");

        CREATE TABLE IF NOT EXISTS "cafe_inquiry_responses" (
          "id" TEXT NOT NULL,
          "inquiryId" TEXT NOT NULL,
          "responderUserId" TEXT NOT NULL,
          "senderRole" "InquirySenderRole" NOT NULL DEFAULT 'OWNER',
          "message" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cafe_inquiry_responses_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_inquiry_responses_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "cafe_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_inquiry_responses_responderUserId_fkey" FOREIGN KEY ("responderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE INDEX IF NOT EXISTS "cafe_inquiry_responses_inquiryId_idx" ON "cafe_inquiry_responses"("inquiryId");
        CREATE INDEX IF NOT EXISTS "cafe_inquiry_responses_responderUserId_idx" ON "cafe_inquiry_responses"("responderUserId");
        CREATE INDEX IF NOT EXISTS "cafe_inquiry_responses_createdAt_idx" ON "cafe_inquiry_responses"("createdAt");

        DO $$ BEGIN
          CREATE TYPE "LoyaltyProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'ENDED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "LoyaltyAccountStatus" AS ENUM ('ACTIVE', 'LEFT', 'SUSPENDED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARN', 'REDEEM', 'ADJUSTMENT', 'EXPIRE', 'REVERSAL');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "LoyaltyRewardStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "LoyaltyRedemptionStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'REDEEMED', 'CANCELLED', 'EXPIRED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          CREATE TYPE "CheckInStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
          ALTER TYPE "CafeAnalyticsEventType" ADD VALUE IF NOT EXISTS 'LOYALTY_ENROLLED';
        EXCEPTION WHEN others THEN null; END $$;

        DO $$ BEGIN
          ALTER TYPE "CafeAnalyticsEventType" ADD VALUE IF NOT EXISTS 'REWARD_REDEEMED';
        EXCEPTION WHEN others THEN null; END $$;

        CREATE TABLE IF NOT EXISTS "cafe_loyalty_programs" (
          "id" TEXT NOT NULL,
          "cafeId" TEXT NOT NULL,
          "name" VARCHAR(120) NOT NULL,
          "description" TEXT,
          "status" "LoyaltyProgramStatus" NOT NULL DEFAULT 'DRAFT',
          "pointsEnabled" BOOLEAN NOT NULL DEFAULT true,
          "pointsPerVisit" INTEGER NOT NULL DEFAULT 10,
          "minimumRedemptionPoints" INTEGER NOT NULL DEFAULT 50,
          "maxPointsPerDay" INTEGER NOT NULL DEFAULT 50,
          "checkInCooldownHours" INTEGER NOT NULL DEFAULT 12,
          "termsAndConditions" TEXT,
          "startsAt" TIMESTAMP(3),
          "endsAt" TIMESTAMP(3),
          "moderationNotes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cafe_loyalty_programs_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_loyalty_programs_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "cafes"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "cafe_loyalty_programs_cafeId_key" ON "cafe_loyalty_programs"("cafeId");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_programs_cafeId_idx" ON "cafe_loyalty_programs"("cafeId");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_programs_status_idx" ON "cafe_loyalty_programs"("status");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_programs_startsAt_idx" ON "cafe_loyalty_programs"("startsAt");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_programs_endsAt_idx" ON "cafe_loyalty_programs"("endsAt");

        CREATE TABLE IF NOT EXISTS "cafe_loyalty_accounts" (
          "id" TEXT NOT NULL,
          "programId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "status" "LoyaltyAccountStatus" NOT NULL DEFAULT 'ACTIVE',
          "pointsBalance" INTEGER NOT NULL DEFAULT 0,
          "lifetimePointsEarned" INTEGER NOT NULL DEFAULT 0,
          "lifetimePointsRedeemed" INTEGER NOT NULL DEFAULT 0,
          "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "leftAt" TIMESTAMP(3),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cafe_loyalty_accounts_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_loyalty_accounts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "cafe_loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_loyalty_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "cafe_loyalty_accounts_programId_userId_key" ON "cafe_loyalty_accounts"("programId", "userId");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_accounts_programId_idx" ON "cafe_loyalty_accounts"("programId");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_accounts_userId_idx" ON "cafe_loyalty_accounts"("userId");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_accounts_status_idx" ON "cafe_loyalty_accounts"("status");

        CREATE TABLE IF NOT EXISTS "cafe_loyalty_transactions" (
          "id" TEXT NOT NULL,
          "accountId" TEXT NOT NULL,
          "type" "LoyaltyTransactionType" NOT NULL,
          "points" INTEGER NOT NULL,
          "balanceAfter" INTEGER NOT NULL,
          "description" TEXT NOT NULL,
          "reason" TEXT,
          "referenceType" VARCHAR(64),
          "referenceId" VARCHAR(64),
          "idempotencyKey" VARCHAR(128),
          "createdByUserId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cafe_loyalty_transactions_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_loyalty_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "cafe_loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_loyalty_transactions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "cafe_loyalty_transactions_idempotencyKey_key" ON "cafe_loyalty_transactions"("idempotencyKey");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_transactions_accountId_idx" ON "cafe_loyalty_transactions"("accountId");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_transactions_type_idx" ON "cafe_loyalty_transactions"("type");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_transactions_createdAt_idx" ON "cafe_loyalty_transactions"("createdAt");
        CREATE INDEX IF NOT EXISTS "cafe_loyalty_transactions_referenceType_referenceId_idx" ON "cafe_loyalty_transactions"("referenceType", "referenceId");

        CREATE TABLE IF NOT EXISTS "cafe_rewards" (
          "id" TEXT NOT NULL,
          "programId" TEXT NOT NULL,
          "name" VARCHAR(120) NOT NULL,
          "description" TEXT NOT NULL,
          "pointsCost" INTEGER NOT NULL,
          "status" "LoyaltyRewardStatus" NOT NULL DEFAULT 'ACTIVE',
          "stockLimit" INTEGER,
          "redeemedCount" INTEGER NOT NULL DEFAULT 0,
          "maxPerCustomer" INTEGER,
          "startsAt" TIMESTAMP(3),
          "endsAt" TIMESTAMP(3),
          "termsAndConditions" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cafe_rewards_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_rewards_programId_fkey" FOREIGN KEY ("programId") REFERENCES "cafe_loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "cafe_rewards_programId_idx" ON "cafe_rewards"("programId");
        CREATE INDEX IF NOT EXISTS "cafe_rewards_status_idx" ON "cafe_rewards"("status");
        CREATE INDEX IF NOT EXISTS "cafe_rewards_pointsCost_idx" ON "cafe_rewards"("pointsCost");
        CREATE INDEX IF NOT EXISTS "cafe_rewards_endsAt_idx" ON "cafe_rewards"("endsAt");

        CREATE TABLE IF NOT EXISTS "cafe_reward_redemptions" (
          "id" TEXT NOT NULL,
          "rewardId" TEXT NOT NULL,
          "accountId" TEXT NOT NULL,
          "pointsSpent" INTEGER NOT NULL,
          "status" "LoyaltyRedemptionStatus" NOT NULL DEFAULT 'REQUESTED',
          "redemptionCodeHash" VARCHAR(128),
          "codeHint" VARCHAR(16),
          "notes" TEXT,
          "rejectionReason" TEXT,
          "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "approvedAt" TIMESTAMP(3),
          "redeemedAt" TIMESTAMP(3),
          "cancelledAt" TIMESTAMP(3),
          "expiresAt" TIMESTAMP(3),
          "processedByUserId" TEXT,
          CONSTRAINT "cafe_reward_redemptions_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_reward_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "cafe_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_reward_redemptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "cafe_loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_reward_redemptions_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_rewardId_idx" ON "cafe_reward_redemptions"("rewardId");
        CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_accountId_idx" ON "cafe_reward_redemptions"("accountId");
        CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_status_idx" ON "cafe_reward_redemptions"("status");
        CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_requestedAt_idx" ON "cafe_reward_redemptions"("requestedAt");
        CREATE INDEX IF NOT EXISTS "cafe_reward_redemptions_expiresAt_idx" ON "cafe_reward_redemptions"("expiresAt");

        CREATE TABLE IF NOT EXISTS "cafe_visit_check_ins" (
          "id" TEXT NOT NULL,
          "programId" TEXT NOT NULL,
          "accountId" TEXT NOT NULL,
          "status" "CheckInStatus" NOT NULL DEFAULT 'PENDING',
          "visitNotes" TEXT,
          "ownerNotes" TEXT,
          "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
          "processedByUserId" TEXT,
          "processedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "cafe_visit_check_ins_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "cafe_visit_check_ins_programId_fkey" FOREIGN KEY ("programId") REFERENCES "cafe_loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_visit_check_ins_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "cafe_loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "cafe_visit_check_ins_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "cafe_visit_check_ins_programId_idx" ON "cafe_visit_check_ins"("programId");
        CREATE INDEX IF NOT EXISTS "cafe_visit_check_ins_accountId_idx" ON "cafe_visit_check_ins"("accountId");
        CREATE INDEX IF NOT EXISTS "cafe_visit_check_ins_status_idx" ON "cafe_visit_check_ins"("status");
        CREATE INDEX IF NOT EXISTS "cafe_visit_check_ins_createdAt_idx" ON "cafe_visit_check_ins"("createdAt");
      `);
    } catch (schemaErr: any) {
      console.warn('[LocalPostgres]: Non-fatal notice during schema sync:', schemaErr.message || schemaErr);
    }

    console.log('[LocalPostgres]: Creating serialized wire-protocol server...');
    localServerInstance = createSerializedPgliteServer(pgliteDbInstance);

    await new Promise<void>((resolve, reject) => {
      localServerInstance!.once('error', async (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[LocalPostgres]: Port ${LOCAL_PG_PORT} was already in use. Checking connectivity...`);
          if (pgliteDbInstance) {
            try {
              await pgliteDbInstance.close();
            } catch (_) {}
            pgliteDbInstance = null;
          }
          localServerInstance = null;
          const isAlive = await checkPortListening(LOCAL_PG_PORT);
          if (isAlive) {
            console.log(`[LocalPostgres]: Port ${LOCAL_PG_PORT} is accessible. Continuing with existing instance.`);
            resolve();
          } else {
            reject(err);
          }
        } else {
          console.error(`[LocalPostgres]: Server error:`, err);
          reject(err);
        }
      });
      localServerInstance!.listen(LOCAL_PG_PORT, '127.0.0.1', () => {
        console.log(`[LocalPostgres]: Embedded PostgreSQL service listening on 127.0.0.1:${LOCAL_PG_PORT}`);
        resolve();
      });
    });

    return LOCAL_DATABASE_URL;
  } catch (err: any) {
    console.error('[LocalPostgres]: Failed to start embedded PostgreSQL:', err);
    throw err;
  } finally {
    isStarting = false;
  }
}

export async function stopLocalPostgresServer(): Promise<void> {
  if (localServerInstance) {
    await new Promise<void>((resolve) => {
      localServerInstance!.close(() => resolve());
    });
    localServerInstance = null;
  }
  if (pgliteDbInstance) {
    try {
      await pgliteDbInstance.close();
    } catch (_) {}
    pgliteDbInstance = null;
  }
}
