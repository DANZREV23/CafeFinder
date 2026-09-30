var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/src/config/localDbServer.ts
function checkPortListening(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new import_net.default.Socket();
    socket.setTimeout(1e3);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}
function ensurePostgresDirectories(dataDir) {
  const requiredDirs = [
    "base",
    "global",
    "pg_commit_ts",
    "pg_dynshmem",
    "pg_logical",
    "pg_logical/mappings",
    "pg_logical/snapshots",
    "pg_multixact",
    "pg_multixact/members",
    "pg_multixact/offsets",
    "pg_notify",
    "pg_replslot",
    "pg_serial",
    "pg_snapshots",
    "pg_stat",
    "pg_stat_tmp",
    "pg_subtrans",
    "pg_tblspc",
    "pg_twophase",
    "pg_wal",
    "pg_xact"
  ];
  for (const dir of requiredDirs) {
    const full = import_path.default.join(dataDir, dir);
    if (!import_fs.default.existsSync(full)) {
      try {
        import_fs.default.mkdirSync(full, { recursive: true });
      } catch (_) {
      }
    }
  }
  const pidFile = import_path.default.join(dataDir, "postmaster.pid");
  if (import_fs.default.existsSync(pidFile)) {
    try {
      import_fs.default.unlinkSync(pidFile);
      console.log(`[LocalPostgres]: Removed stale postmaster.pid from ${dataDir}`);
    } catch (_) {
    }
  }
}
async function startLocalPostgresServer() {
  if (localServerInstance && localServerInstance.listening) {
    return LOCAL_DATABASE_URL;
  }
  const alreadyListening = await checkPortListening(LOCAL_PG_PORT);
  if (alreadyListening) {
    console.log(`[LocalPostgres]: Port ${LOCAL_PG_PORT} is already active and accepting connections.`);
    return LOCAL_DATABASE_URL;
  }
  if (isStarting) {
    console.log("[LocalPostgres]: Already starting, waiting...");
    while (isStarting) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return LOCAL_DATABASE_URL;
  }
  isStarting = true;
  console.log("[LocalPostgres]: Starting embedded PostgreSQL service...");
  try {
    const { PGlite } = await import("@electric-sql/pglite");
    const { createServer } = await import("pglite-server");
    const dataDir = import_path.default.resolve(process.cwd(), "prisma/pgdata_v9");
    console.log(`[LocalPostgres]: Using data directory: ${dataDir}`);
    if (!import_fs.default.existsSync(dataDir)) {
      import_fs.default.mkdirSync(dataDir, { recursive: true });
    }
    ensurePostgresDirectories(dataDir);
    console.log("[LocalPostgres]: Initializing PGlite...");
    try {
      pgliteDbInstance = new PGlite(dataDir);
      await pgliteDbInstance.waitReady;
    } catch (pgErr) {
      console.error("[LocalPostgres]: PGlite constructor/waitReady failed with primary dataDir:", pgErr.message || pgErr);
      ensurePostgresDirectories(dataDir);
      try {
        pgliteDbInstance = new PGlite(dataDir);
        await pgliteDbInstance.waitReady;
      } catch (retryErr) {
        console.error("[LocalPostgres]: Retry with primary dataDir failed, falling back to clean dataDir:", retryErr.message || retryErr);
        const fallbackDir = import_path.default.resolve(process.cwd(), "prisma/pgdata_fallback");
        import_fs.default.mkdirSync(fallbackDir, { recursive: true });
        ensurePostgresDirectories(fallbackDir);
        pgliteDbInstance = new PGlite(fallbackDir);
        await pgliteDbInstance.waitReady;
      }
    }
    console.log("[LocalPostgres]: PGlite ready.");
    console.log("[LocalPostgres]: Creating server...");
    localServerInstance = createServer(pgliteDbInstance);
    await new Promise((resolve, reject) => {
      localServerInstance.once("error", async (err) => {
        if (err.code === "EADDRINUSE") {
          console.warn(`[LocalPostgres]: Port ${LOCAL_PG_PORT} was already in use. Checking connectivity...`);
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
      localServerInstance.listen(LOCAL_PG_PORT, "0.0.0.0", () => {
        console.log(`[LocalPostgres]: Embedded PostgreSQL service listening on 0.0.0.0:${LOCAL_PG_PORT}`);
        resolve();
      });
    });
    return LOCAL_DATABASE_URL;
  } catch (err) {
    console.error("[LocalPostgres]: Failed to start embedded PostgreSQL:", err);
    throw err;
  } finally {
    isStarting = false;
  }
}
async function stopLocalPostgresServer() {
  if (localServerInstance) {
    await new Promise((resolve) => {
      localServerInstance.close(() => resolve());
    });
    localServerInstance = null;
  }
  if (pgliteDbInstance) {
    try {
      await pgliteDbInstance.close();
    } catch (_) {
    }
    pgliteDbInstance = null;
  }
}
var import_net, import_path, import_fs, localServerInstance, pgliteDbInstance, isStarting, LOCAL_PG_PORT, LOCAL_PG_HOST, LOCAL_DATABASE_URL;
var init_localDbServer = __esm({
  "server/src/config/localDbServer.ts"() {
    import_net = __toESM(require("net"), 1);
    import_path = __toESM(require("path"), 1);
    import_fs = __toESM(require("fs"), 1);
    localServerInstance = null;
    pgliteDbInstance = null;
    isStarting = false;
    LOCAL_PG_PORT = 5442;
    LOCAL_PG_HOST = "127.0.0.1";
    LOCAL_DATABASE_URL = `postgresql://postgres:postgres@${LOCAL_PG_HOST}:${LOCAL_PG_PORT}/cloud_sql_development_database?sslmode=disable&statement_cache_size=0&connect_timeout=3`;
  }
});

// server/src/utils/logger.ts
var import_fs2, import_path2, Logger, logger;
var init_logger = __esm({
  "server/src/utils/logger.ts"() {
    import_fs2 = __toESM(require("fs"), 1);
    import_path2 = __toESM(require("path"), 1);
    Logger = class {
      constructor() {
        this.level = process.env.LOG_LEVEL || "INFO" /* INFO */;
        this.logDir = import_path2.default.resolve(process.cwd(), "logs");
        this.logFile = import_path2.default.join(this.logDir, "app.log");
        if (!import_fs2.default.existsSync(this.logDir)) {
          import_fs2.default.mkdirSync(this.logDir, { recursive: true });
        }
      }
      shouldLog(level) {
        const levels = ["DEBUG" /* DEBUG */, "INFO" /* INFO */, "WARN" /* WARN */, "ERROR" /* ERROR */];
        return levels.indexOf(level) >= levels.indexOf(this.level);
      }
      formatEntry(entry) {
        if (process.env.NODE_ENV === "production") {
          return JSON.stringify(entry);
        }
        const color = this.getLevelColor(entry.level);
        const reset = "\x1B[0m";
        const time = new Date(entry.timestamp).toLocaleTimeString();
        let msg = `[${time}] ${color}${entry.level}${reset}: ${entry.message}`;
        if (entry.event) msg = `${msg} [${entry.event}]`;
        if (entry.requestId) msg = `${msg} (req:${entry.requestId})`;
        if (entry.route) msg = `${msg} ${entry.method} ${entry.route} ${entry.statusCode} ${entry.durationMs}ms`;
        return msg;
      }
      getLevelColor(level) {
        switch (level) {
          case "DEBUG" /* DEBUG */:
            return "\x1B[36m";
          // Cyan
          case "INFO" /* INFO */:
            return "\x1B[32m";
          // Green
          case "WARN" /* WARN */:
            return "\x1B[33m";
          // Yellow
          case "ERROR" /* ERROR */:
            return "\x1B[31m";
          // Red
          default:
            return "\x1B[0m";
        }
      }
      log(level, message, data = {}) {
        if (!this.shouldLog(level)) return;
        const entry = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          message,
          ...data
        };
        const formatted = this.formatEntry(entry);
        if (level === "ERROR" /* ERROR */) {
          console.error(formatted);
        } else if (level === "WARN" /* WARN */) {
          console.warn(formatted);
        } else {
          console.log(formatted);
        }
        try {
          import_fs2.default.appendFileSync(this.logFile, formatted + "\n");
        } catch (err) {
          console.error("Failed to write to log file:", err);
        }
      }
      debug(message, data) {
        this.log("DEBUG" /* DEBUG */, message, data);
      }
      info(message, data) {
        this.log("INFO" /* INFO */, message, data);
      }
      warn(message, data) {
        this.log("WARN" /* WARN */, message, data);
      }
      error(message, error, data) {
        const details = error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : void 0
        } : error;
        this.log("ERROR" /* ERROR */, message, { ...data, details });
      }
    };
    logger = new Logger();
  }
});

// server/src/services/metricsService.ts
var metricsService_exports = {};
__export(metricsService_exports, {
  metricsService: () => metricsService
});
var MetricsService, metricsService;
var init_metricsService = __esm({
  "server/src/services/metricsService.ts"() {
    init_logger();
    MetricsService = class {
      constructor() {
        this.routeMetrics = /* @__PURE__ */ new Map();
        this.recentEvents = [];
        this.MAX_EVENTS = 100;
        this.SLOW_THRESHOLD_MS = parseInt(process.env.SLOW_REQUEST_MS || "1000");
        this.SLOW_DB_QUERY_MS = parseInt(process.env.SLOW_DB_QUERY_MS || "500");
      }
      recordRequest(route, statusCode, durationMs, requestId, method) {
        let metric = this.routeMetrics.get(route);
        if (!metric) {
          metric = {
            requests: 0,
            errors4xx: 0,
            errors5xx: 0,
            totalMs: 0,
            slowRequests: 0
          };
          this.routeMetrics.set(route, metric);
        }
        metric.requests++;
        metric.totalMs += durationMs;
        if (statusCode >= 500) {
          metric.errors5xx++;
        } else if (statusCode >= 400) {
          metric.errors4xx++;
        }
        if (durationMs > this.SLOW_THRESHOLD_MS) {
          metric.slowRequests++;
          logger.warn(`slow_request: ${method} ${route} took ${durationMs}ms`, {
            requestId,
            method,
            route,
            statusCode,
            durationMs,
            event: "performance.slow_request"
          });
          this.recordEvent("WARN", "slow_request", `${method} ${route} took ${durationMs}ms`, {
            requestId,
            durationMs,
            statusCode
          });
        }
      }
      recordOperation(type, name, durationMs, details) {
        const threshold = type === "database" ? this.SLOW_DB_QUERY_MS : this.SLOW_THRESHOLD_MS;
        if (durationMs > threshold) {
          logger.warn(`slow_operation: ${type}:${name} took ${durationMs}ms`, {
            type,
            name,
            durationMs,
            ...details,
            event: "performance.slow_operation"
          });
          this.recordEvent("WARN", "slow_operation", `${type}:${name} took ${durationMs}ms`, {
            type,
            name,
            durationMs,
            ...details
          });
        }
      }
      recordEvent(level, event, message, details) {
        const operationalEvent = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level,
          event,
          message,
          details
        };
        this.recentEvents.unshift(operationalEvent);
        if (this.recentEvents.length > this.MAX_EVENTS) {
          this.recentEvents.pop();
        }
        if (level === "ERROR") {
          logger.error(message, details, { event });
        } else if (level === "WARN") {
          logger.warn(message, { event, details });
        } else {
          logger.info(message, { event, details });
        }
      }
      getMetrics() {
        const result = [];
        this.routeMetrics.forEach((metric, route) => {
          result.push({
            route,
            requests: metric.requests,
            errors4xx: metric.errors4xx,
            errors5xx: metric.errors5xx,
            averageMs: Math.round(metric.totalMs / metric.requests),
            slowRequests: metric.slowRequests
          });
        });
        return result;
      }
      getRecentEvents() {
        return this.recentEvents;
      }
      resetMetrics() {
        this.routeMetrics.clear();
      }
    };
    metricsService = new MetricsService();
  }
});

// server/src/config/database.ts
var database_exports = {};
__export(database_exports, {
  connectWithRetry: () => connectWithRetry,
  createPrismaClient: () => createPrismaClient,
  getDatabaseUrl: () => getDatabaseUrl,
  prisma: () => prisma,
  stopLocalPostgresServer: () => stopLocalPostgresServer
});
async function checkCloudSqlReady(socketDir) {
  if (!socketDir) return false;
  const socketPath = import_path3.default.join(socketDir, ".s.PGSQL.5432");
  if (!import_fs3.default.existsSync(socketPath)) return false;
  return new Promise((resolve) => {
    const socket = import_net2.default.createConnection(socketPath);
    let gotData = false;
    socket.setTimeout(2e3);
    socket.on("connect", () => {
      socket.write(Buffer.from([0, 0, 0, 8, 4, 210, 22, 47]));
    });
    socket.on("data", () => {
      gotData = true;
      socket.end();
      resolve(true);
    });
    socket.on("close", () => {
      if (!gotData) resolve(false);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}
var import_net2, import_path3, import_fs3, import_client, getDatabaseUrl, initialDatabaseUrl, globalForPrisma, createPrismaClient, currentPrismaClient, prisma, connectWithRetry;
var init_database = __esm({
  "server/src/config/database.ts"() {
    import_net2 = __toESM(require("net"), 1);
    import_path3 = __toESM(require("path"), 1);
    import_fs3 = __toESM(require("fs"), 1);
    import_client = require("@prisma/client");
    init_localDbServer();
    getDatabaseUrl = () => {
      const envUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;
      console.log("[DatabaseConfig]: process.env.SQL_HOST:", process.env.SQL_HOST);
      console.log("[DatabaseConfig]: process.env.SQL_ADMIN_USER:", process.env.SQL_ADMIN_USER);
      if (envUrl && envUrl.includes("://")) {
        return envUrl;
      }
      const sqlUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
      const sqlPass = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
      const sqlHost = process.env.SQL_HOST;
      const sqlDb = process.env.SQL_DB_NAME || process.env.DB_NAME;
      const dbHost = process.env.DB_HOST || (envUrl && !envUrl.includes("://") ? envUrl : void 0);
      const dbUser = process.env.DB_USERNAME || process.env.DB_USER;
      const dbPass = process.env.DB_PASSWORD;
      if (sqlUser && sqlPass && sqlHost && sqlDb) {
        return `postgresql://${sqlUser}:${encodeURIComponent(sqlPass)}@localhost/${sqlDb}?host=${sqlHost}&connect_timeout=3`;
      }
      if (dbHost && dbUser && dbPass) {
        const port = process.env.DB_PORT || "5432";
        const db = process.env.DB_NAME || "cafefinder";
        const ssl = dbHost === "localhost" || dbHost === "127.0.0.1" ? "?sslmode=disable" : "";
        return `postgresql://${dbUser}:${encodeURIComponent(dbPass)}@${dbHost}:${port}/${db}${ssl}`;
      }
      if (dbHost) {
        const user = dbUser || "postgres";
        const pass = dbPass || "";
        const port = process.env.DB_PORT || "5432";
        const db = process.env.DB_NAME || "cafefinder";
        const ssl = dbHost === "localhost" || dbHost === "127.0.0.1" ? "?sslmode=disable" : "";
        return `postgresql://${user}:${encodeURIComponent(pass)}@${dbHost}:${port}/${db}${ssl}`;
      }
      return LOCAL_DATABASE_URL;
    };
    initialDatabaseUrl = getDatabaseUrl();
    if (initialDatabaseUrl) {
      process.env.PRISMA_DATABASE_URL = initialDatabaseUrl;
      const redactedUrl = initialDatabaseUrl.replace(/:[^@:]+@/, ":****@");
      console.log(`[DatabaseConfig]: Initialized with URL: ${redactedUrl}`);
    } else {
      console.error("[DatabaseConfig]: Failed to construct database URL. Check environment variables.");
    }
    globalForPrisma = global;
    createPrismaClient = (url) => {
      const client = new import_client.PrismaClient({
        datasources: {
          db: {
            url: url || process.env.PRISMA_DATABASE_URL
          }
        },
        log: process.env.PRISMA_LOG_QUERIES === "true" ? ["query", "error", "warn"] : ["error", "warn"]
      });
      client.$use(async (params, next) => {
        const start = Date.now();
        try {
          const result = await next(params);
          const duration = Date.now() - start;
          const { metricsService: metricsService2 } = await Promise.resolve().then(() => (init_metricsService(), metricsService_exports));
          metricsService2.recordOperation("database", `${params.model}.${params.action}`, duration, {
            model: params.model,
            action: params.action
          });
          return result;
        } catch (error) {
          throw error;
        }
      });
      client.$use(async (params, next) => {
        let retries = 0;
        const maxRetries = 3;
        const delay = 1e3;
        while (retries < maxRetries) {
          try {
            return await next(params);
          } catch (error) {
            const isTransientError = error.message?.includes("E57P01") || error.code === "P2024" || error.message?.includes("connection");
            if (isTransientError && retries < maxRetries - 1) {
              retries++;
              const waitTime = delay * Math.pow(2, retries - 1);
              console.warn(`[Prisma]: Transient error detected. Retrying in ${waitTime}ms... (${retries}/${maxRetries})`);
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              continue;
            }
            throw error;
          }
        }
        return next(params);
      });
      return client;
    };
    currentPrismaClient = globalForPrisma.prisma || createPrismaClient(initialDatabaseUrl);
    prisma = new Proxy({}, {
      get(_target, prop, receiver) {
        const value = Reflect.get(currentPrismaClient, prop, receiver);
        if (typeof value === "function") {
          return value.bind(currentPrismaClient);
        }
        return value;
      }
    });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = currentPrismaClient;
    }
    connectWithRetry = async (retries = 3, delay = 1500) => {
      if (process.env.SQL_HOST) {
        const isCloudReady = await checkCloudSqlReady(process.env.SQL_HOST);
        if (!isCloudReady) {
          console.log("[Database]: Cloud SQL instance is not reachable. Launching embedded PostgreSQL service...");
          const localUrl = await startLocalPostgresServer();
          process.env.PRISMA_DATABASE_URL = localUrl;
          try {
            await currentPrismaClient.$disconnect();
          } catch (_) {
          }
          currentPrismaClient = createPrismaClient(localUrl);
          if (process.env.NODE_ENV !== "production") {
            globalForPrisma.prisma = currentPrismaClient;
          }
          await currentPrismaClient.$connect();
          console.log("[Database]: Successfully connected to embedded PostgreSQL service.");
          return true;
        }
      }
      for (let i = 0; i < retries; i++) {
        try {
          await currentPrismaClient.$connect();
          console.log("[Database]: Successfully connected to database.");
          return true;
        } catch (error) {
          console.warn(`[Database]: Connection attempt ${i + 1}/${retries} failed: ${error.message || error}`);
          if (i === 0) {
            try {
              console.log("[Database]: Falling back to embedded local PostgreSQL service...");
              const localUrl = await startLocalPostgresServer();
              process.env.PRISMA_DATABASE_URL = localUrl;
              try {
                await currentPrismaClient.$disconnect();
              } catch (_) {
              }
              currentPrismaClient = createPrismaClient(localUrl);
              if (process.env.NODE_ENV !== "production") {
                globalForPrisma.prisma = currentPrismaClient;
              }
              await currentPrismaClient.$connect();
              console.log("[Database]: Successfully connected to local PostgreSQL database.");
              return true;
            } catch (fallbackError) {
              console.error("[Database]: Local database fallback failed:", fallbackError.message || fallbackError);
            }
          }
          if (i < retries - 1) {
            console.log(`[Database]: Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      try {
        const localUrl = await startLocalPostgresServer();
        process.env.PRISMA_DATABASE_URL = localUrl;
        currentPrismaClient = createPrismaClient(localUrl);
        await currentPrismaClient.$connect();
        console.log("[Database]: Connected to local PostgreSQL after retries.");
        return true;
      } catch (err) {
        console.error("[Database]: Failed to connect to any database:", err.message || err);
        throw err;
      }
    };
  }
});

// server/src/services/deploymentService.ts
var deploymentService_exports = {};
__export(deploymentService_exports, {
  DeploymentService: () => DeploymentService,
  DeploymentStatus: () => DeploymentStatus,
  deploymentService: () => deploymentService
});
var import_fs4, import_path4, DeploymentStatus, DeploymentService, deploymentService;
var init_deploymentService = __esm({
  "server/src/services/deploymentService.ts"() {
    import_fs4 = __toESM(require("fs"), 1);
    import_path4 = __toESM(require("path"), 1);
    init_database();
    init_metricsService();
    DeploymentStatus = /* @__PURE__ */ ((DeploymentStatus2) => {
      DeploymentStatus2["PENDING"] = "PENDING";
      DeploymentStatus2["BUILDING"] = "BUILDING";
      DeploymentStatus2["MIGRATING"] = "MIGRATING";
      DeploymentStatus2["RESTARTING"] = "RESTARTING";
      DeploymentStatus2["VERIFYING"] = "VERIFYING";
      DeploymentStatus2["SUCCEEDED"] = "SUCCEEDED";
      DeploymentStatus2["FAILED"] = "FAILED";
      DeploymentStatus2["ROLLED_BACK"] = "ROLLED_BACK";
      return DeploymentStatus2;
    })(DeploymentStatus || {});
    DeploymentService = class {
      constructor() {
        this.packageJson = null;
        this.loadPackageJson();
      }
      loadPackageJson() {
        try {
          const pkgPath = import_path4.default.resolve(process.cwd(), "package.json");
          if (import_fs4.default.existsSync(pkgPath)) {
            this.packageJson = JSON.parse(import_fs4.default.readFileSync(pkgPath, "utf-8"));
          }
        } catch (err) {
          console.error("[DeploymentService]: Error reading package.json:", err);
        }
      }
      /**
       * Returns safe release metadata to administrators without exposing secrets.
       */
      getReleaseMetadata() {
        const manifestPath = import_path4.default.resolve(process.cwd(), "release.json");
        const distManifestPath = import_path4.default.resolve(process.cwd(), "dist", "release.json");
        let manifest = {};
        if (import_fs4.default.existsSync(manifestPath)) {
          try {
            manifest = JSON.parse(import_fs4.default.readFileSync(manifestPath, "utf-8"));
          } catch (e) {
          }
        } else if (import_fs4.default.existsSync(distManifestPath)) {
          try {
            manifest = JSON.parse(import_fs4.default.readFileSync(distManifestPath, "utf-8"));
          } catch (e) {
          }
        }
        const version = manifest.version || process.env.APP_VERSION || this.packageJson?.version || "1.0.0";
        const buildId = manifest.commit || manifest.buildId || "build-current";
        const buildTime = manifest.buildTime || (/* @__PURE__ */ new Date()).toISOString();
        return {
          application: "CafeFinder",
          version,
          environment: process.env.NODE_ENV || "development",
          buildId,
          buildTime,
          nodeVersion: process.version,
          schemaVersion: manifest.schemaVersion || "prisma-v6.4.1",
          uptime: process.uptime(),
          platform: `${process.platform}-${process.arch}`
        };
      }
      /**
       * Get deployment history with pagination
       */
      async getDeployments(params) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.min(50, Math.max(1, params.limit || 10));
        const skip = (page - 1) * limit;
        const [total, deployments] = await Promise.all([
          prisma.deploymentRecord.count(),
          prisma.deploymentRecord.findMany({
            skip,
            take: limit,
            orderBy: { startedAt: "desc" }
          })
        ]);
        return {
          deployments,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      }
      /**
       * Get latest deployment record
       */
      async getLatestDeployment() {
        return prisma.deploymentRecord.findFirst({
          orderBy: { startedAt: "desc" }
        });
      }
      /**
       * Record deployment start
       */
      async createDeploymentRecord(data) {
        const record = await prisma.deploymentRecord.create({
          data: {
            deploymentId: data.deploymentId,
            version: data.version,
            environment: data.environment,
            status: "PENDING" /* PENDING */,
            details: data.details || {}
          }
        });
        metricsService.recordEvent(
          "INFO",
          "deployment.started",
          `Deployment ${data.deploymentId} (v${data.version}) initiated in ${data.environment}`
        );
        return record;
      }
      /**
       * Update deployment status
       */
      async updateDeploymentStatus(deploymentId, status, extra) {
        const current = await prisma.deploymentRecord.findUnique({
          where: { deploymentId }
        });
        if (!current) {
          console.warn(`[DeploymentService]: Deployment record ${deploymentId} not found`);
          return null;
        }
        const mergedDetails = {
          ...typeof current.details === "object" && current.details !== null ? current.details : {},
          ...extra?.details || {}
        };
        const record = await prisma.deploymentRecord.update({
          where: { deploymentId },
          data: {
            status,
            migrationStatus: extra?.migrationStatus ?? current.migrationStatus,
            healthStatus: extra?.healthStatus ?? current.healthStatus,
            rollbackStatus: extra?.rollbackStatus ?? current.rollbackStatus,
            details: mergedDetails,
            completedAt: extra?.completedAt ?? (status === "SUCCEEDED" /* SUCCEEDED */ || status === "FAILED" /* FAILED */ || status === "ROLLED_BACK" /* ROLLED_BACK */ ? /* @__PURE__ */ new Date() : void 0)
          }
        });
        let eventLevel = "INFO";
        let eventName = `deployment.${status.toLowerCase()}`;
        if (status === "FAILED" /* FAILED */) {
          eventLevel = "ERROR";
        } else if (status === "ROLLED_BACK" /* ROLLED_BACK */) {
          eventLevel = "WARN";
        }
        metricsService.recordEvent(
          eventLevel,
          eventName,
          `Deployment ${deploymentId} transitioned to ${status}`
        );
        return record;
      }
      /**
       * Cleans up old release directories (simulated or real depending on environment)
       */
      async cleanupOldReleases() {
        const releasesDir = import_path4.default.resolve(process.cwd(), "releases");
        if (!import_fs4.default.existsSync(releasesDir)) {
          return 0;
        }
        try {
          const dirs = import_fs4.default.readdirSync(releasesDir);
          const now = Date.now();
          const maxAge = 30 * 24 * 60 * 60 * 1e3;
          let removedCount = 0;
          for (const dir of dirs) {
            const dirPath = import_path4.default.join(releasesDir, dir);
            const stats = import_fs4.default.statSync(dirPath);
            const age = now - stats.mtime.getTime();
            if (age > maxAge) {
              import_fs4.default.rmSync(dirPath, { recursive: true, force: true });
              removedCount++;
            }
          }
          if (removedCount > 0) {
            console.log(`[DeploymentService]: Cleaned up ${removedCount} old release directories.`);
          }
          return removedCount;
        } catch (err) {
          console.error("[DeploymentService]: Failed to cleanup old releases:", err);
          return 0;
        }
      }
    };
    deploymentService = new DeploymentService();
  }
});

// server/src/services/jobRunnerService.ts
var jobRunnerService_exports = {};
__export(jobRunnerService_exports, {
  JobRunnerService: () => JobRunnerService,
  JobStatus: () => JobStatus,
  jobRunnerService: () => jobRunnerService
});
var import_uuid2, JobStatus, JobRunnerService, jobRunnerService;
var init_jobRunnerService = __esm({
  "server/src/services/jobRunnerService.ts"() {
    init_database();
    init_logger();
    import_uuid2 = require("uuid");
    JobStatus = {
      RUNNING: "RUNNING",
      SUCCEEDED: "SUCCEEDED",
      FAILED: "FAILED",
      SKIPPED: "SKIPPED"
    };
    JobRunnerService = class _JobRunnerService {
      static {
        this.LOCK_TIMEOUT_MS = 30 * 60 * 1e3;
      }
      // 30 minutes
      async notifyAdmins(jobName, error) {
        try {
          const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true }
          });
          if (admins.length > 0) {
            await prisma.notification.createMany({
              data: admins.map((admin) => ({
                userId: admin.id,
                title: `Job Failure: ${jobName}`,
                message: `The maintenance job "${jobName}" failed. Error: ${error}`,
                type: "SYSTEM_ERROR",
                isRead: false
              }))
            });
          }
        } catch (err) {
          logger.error("[JobRunner]: Failed to send failure notifications", err);
        }
      }
      async runJob(jobName, jobFn) {
        const executionId = (0, import_uuid2.v4)();
        const startTime = Date.now();
        const locked = await this.acquireLock(jobName);
        if (!locked) {
          logger.warn(`[JobRunner]: Job ${jobName} is already running. Skipping.`);
          await prisma.maintenanceJobRun.create({
            data: {
              jobName,
              executionId,
              status: JobStatus.SKIPPED,
              errorMessage: "Job already running"
            }
          });
          return executionId;
        }
        await prisma.maintenanceJobRun.create({
          data: {
            jobName,
            executionId,
            status: JobStatus.RUNNING
          }
        });
        try {
          logger.info(`[JobRunner]: Starting job ${jobName} (${executionId})`);
          const result = await jobFn();
          const durationMs = Date.now() - startTime;
          await prisma.maintenanceJobRun.update({
            where: { executionId },
            data: {
              status: JobStatus.SUCCEEDED,
              finishedAt: /* @__PURE__ */ new Date(),
              durationMs,
              processedCount: result.processedCount,
              successCount: result.successCount,
              failureCount: result.failureCount
            }
          });
          logger.info(`[JobRunner]: Job ${jobName} finished successfully in ${durationMs}ms`);
        } catch (error) {
          const durationMs = Date.now() - startTime;
          logger.error(`[JobRunner]: Job ${jobName} failed after ${durationMs}ms`, error);
          await prisma.maintenanceJobRun.update({
            where: { executionId },
            data: {
              status: JobStatus.FAILED,
              finishedAt: /* @__PURE__ */ new Date(),
              durationMs,
              errorMessage: error.message || "Unknown error"
            }
          });
          const criticalJobs = ["backup-database", "backup-uploads", "health-verification", "data-integrity-scan"];
          if (criticalJobs.includes(jobName)) {
            await this.notifyAdmins(jobName, error.message || "Unknown error");
          }
        } finally {
          await this.releaseLock(jobName);
        }
        return executionId;
      }
      async acquireLock(jobName) {
        try {
          return await prisma.$transaction(async (tx) => {
            const now = /* @__PURE__ */ new Date();
            const existingLock = await tx.maintenanceJobLock.findUnique({
              where: { jobName }
            });
            if (existingLock) {
              if (existingLock.expiresAt > now) {
                return false;
              }
              await tx.maintenanceJobLock.delete({ where: { jobName } });
            }
            await tx.maintenanceJobLock.create({
              data: {
                jobName,
                expiresAt: new Date(Date.now() + _JobRunnerService.LOCK_TIMEOUT_MS),
                processId: process.pid.toString()
              }
            });
            return true;
          });
        } catch (err) {
          return false;
        }
      }
      async releaseLock(jobName) {
        try {
          await prisma.maintenanceJobLock.deleteMany({
            where: { jobName }
          });
        } catch (err) {
          logger.error(`[JobRunner]: Failed to release lock for ${jobName}`, err);
        }
      }
      async getRecentRuns(limit = 20) {
        return prisma.maintenanceJobRun.findMany({
          orderBy: { startedAt: "desc" },
          take: limit
        });
      }
      async getJobsStatus() {
        const jobs = await prisma.maintenanceJobRun.findMany({
          distinct: ["jobName"],
          orderBy: { startedAt: "desc" }
        });
        return jobs;
      }
    };
    jobRunnerService = new JobRunnerService();
  }
});

// server/src/services/operationalService.ts
var operationalService_exports = {};
__export(operationalService_exports, {
  OperationalService: () => OperationalService,
  operationalService: () => operationalService
});
var import_fs5, import_path5, import_os, import_child_process, import_util, execAsync, OperationalService, operationalService;
var init_operationalService = __esm({
  "server/src/services/operationalService.ts"() {
    init_database();
    import_fs5 = __toESM(require("fs"), 1);
    import_path5 = __toESM(require("path"), 1);
    import_os = __toESM(require("os"), 1);
    import_child_process = require("child_process");
    import_util = require("util");
    init_metricsService();
    init_deploymentService();
    init_jobRunnerService();
    execAsync = (0, import_util.promisify)(import_child_process.exec);
    OperationalService = class {
      constructor() {
        this.maintenanceMode = process.env.MAINTENANCE_MODE === "true";
      }
      async getStatus() {
        const startTime = Date.now();
        let dbStatus = "connected";
        let dbLatency = 0;
        try {
          await prisma.$queryRaw`SELECT 1`;
          dbLatency = Date.now() - startTime;
        } catch (err) {
          dbStatus = "disconnected";
        }
        const uploadsDir = import_path5.default.resolve(process.cwd(), "uploads");
        const backupsDir = import_path5.default.resolve(process.cwd(), process.env.BACKUP_DIR || "./backups");
        const uploadsSize = this.getDirectorySize(uploadsDir);
        const backupsSize = this.getDirectorySize(backupsDir);
        const diskSpace = await this.getAvailableDiskSpace();
        let pendingEmails = 0;
        let failedEmails = 0;
        let tableSizes = [];
        let alertsInfo = { openCount: 0, criticalCount: 0 };
        let jobsInfo = { total: 0, failedCount: 0, lastRun: void 0 };
        if (dbStatus === "connected") {
          try {
            const [pCount, fCount, tSizes, openAlerts, criticalAlerts, jStatus, recentRuns] = await Promise.all([
              prisma.emailJob.count({ where: { status: "PENDING" } }),
              prisma.emailJob.count({ where: { status: "FAILED" } }),
              prisma.$queryRawUnsafe(`
            SELECT relname AS name, pg_total_relation_size(relid)::text AS size
            FROM pg_catalog.pg_statio_user_tables
            ORDER BY pg_total_relation_size(relid) DESC
            LIMIT 10
          `),
              prisma.operationalAlert.count({ where: { status: "OPEN" } }),
              prisma.operationalAlert.count({ where: { status: "OPEN", severity: "CRITICAL" } }),
              jobRunnerService.getJobsStatus(),
              jobRunnerService.getRecentRuns(1)
            ]);
            pendingEmails = pCount;
            failedEmails = fCount;
            tableSizes = tSizes;
            alertsInfo = { openCount: openAlerts, criticalCount: criticalAlerts };
            jobsInfo = {
              total: jStatus.length,
              failedCount: jStatus.filter((j) => j.status === "FAILED").length,
              lastRun: recentRuns.length > 0 ? recentRuns[0].startedAt.toISOString() : void 0
            };
          } catch (err) {
            console.warn("[OperationalService]: Failed to fetch DB stats:", err);
          }
        }
        const backupFiles = this.getBackupFiles(backupsDir);
        const lastBackupFile = backupFiles.length > 0 ? backupFiles[0] : void 0;
        const lastBackupTime = lastBackupFile?.mtime;
        let backupStatus = "UNKNOWN";
        if (lastBackupTime) {
          const hoursSinceBackup = (Date.now() - lastBackupTime.getTime()) / (1e3 * 60 * 60);
          if (hoursSinceBackup > 48) backupStatus = "FAILED";
          else if (hoursSinceBackup > 24) backupStatus = "WARNING";
          else backupStatus = "HEALTHY";
        } else {
          backupStatus = "FAILED";
        }
        const release = deploymentService.getReleaseMetadata();
        const latestDeployment = await deploymentService.getLatestDeployment();
        return {
          application: {
            status: this.maintenanceMode ? "maintenance" : "ok",
            environment: process.env.NODE_ENV || "development",
            version: release.version,
            uptime: process.uptime(),
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
            maintenanceMode: this.maintenanceMode,
            loadAvg: import_os.default.loadavg(),
            cpus: import_os.default.cpus().length,
            platform: import_os.default.platform(),
            release,
            lastDeployment: latestDeployment
          },
          database: {
            status: dbStatus,
            latencyMs: dbLatency,
            tableSizes
          },
          storage: {
            uploadsSize,
            backupsSize,
            availableDiskSpace: diskSpace
          },
          email: {
            pendingJobs: pendingEmails,
            failedJobs: failedEmails
          },
          backups: {
            lastBackup: lastBackupTime?.toISOString(),
            backupCount: backupFiles.length,
            status: backupStatus
          },
          jobs: jobsInfo,
          alerts: alertsInfo,
          metrics: {
            requests: metricsService.getMetrics(),
            recentEvents: metricsService.getRecentEvents()
          }
        };
      }
      setMaintenanceMode(enabled) {
        this.maintenanceMode = enabled;
        metricsService.recordEvent(
          enabled ? "WARN" : "INFO",
          enabled ? "system.maintenance_enabled" : "system.maintenance_disabled",
          `Maintenance mode ${enabled ? "enabled" : "disabled"}`
        );
      }
      isMaintenanceMode() {
        return this.maintenanceMode;
      }
      getDirectorySize(directoryPath) {
        if (!import_fs5.default.existsSync(directoryPath)) return 0;
        let totalSize = 0;
        const files = import_fs5.default.readdirSync(directoryPath);
        for (const file of files) {
          const filePath = import_path5.default.join(directoryPath, file);
          const stats = import_fs5.default.statSync(filePath);
          if (stats.isDirectory()) {
            totalSize += this.getDirectorySize(filePath);
          } else {
            totalSize += stats.size;
          }
        }
        return totalSize;
      }
      async getAvailableDiskSpace() {
        try {
          const { stdout } = await execAsync("df -h . | tail -1 | awk '{print $4}'");
          return stdout.trim();
        } catch (err) {
          return "unknown";
        }
      }
      getBackupFiles(directoryPath) {
        if (!import_fs5.default.existsSync(directoryPath)) return [];
        return import_fs5.default.readdirSync(directoryPath).filter((f) => f.startsWith("cafefinder-db-") || f.startsWith("cafefinder-uploads-") || f.startsWith("cafefinder-db-json-")).map((f) => {
          const stats = import_fs5.default.statSync(import_path5.default.join(directoryPath, f));
          return {
            name: f,
            mtime: stats.mtime
          };
        }).sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      }
    };
    operationalService = new OperationalService();
  }
});

// server/src/services/editorialService.ts
var editorialService_exports = {};
__export(editorialService_exports, {
  EditorialService: () => EditorialService
});
var EditorialService;
var init_editorialService = __esm({
  "server/src/services/editorialService.ts"() {
    init_database();
    init_logger();
    EditorialService = class {
      /**
       * Create a content revision snapshot
       */
      async createRevision(params) {
        const { entityType, entityId, snapshot, authorId } = params;
        const lastRevision = await prisma.contentRevision.findFirst({
          where: { entityType, entityId },
          orderBy: { revisionNumber: "desc" }
        });
        const revisionNumber = (lastRevision?.revisionNumber || 0) + 1;
        return prisma.contentRevision.create({
          data: {
            entityType,
            entityId,
            revisionNumber,
            snapshot,
            authorId
          }
        });
      }
      /**
       * Get revisions for an entity
       */
      async getRevisions(entityType, entityId) {
        return prisma.contentRevision.findMany({
          where: { entityType, entityId },
          orderBy: { revisionNumber: "desc" },
          include: {
            author: {
              select: { id: true, name: true }
            }
          }
        });
      }
      /**
       * Restore an entity to a previous revision
       */
      async restoreRevision(revisionId, authorId) {
        const revision = await prisma.contentRevision.findUnique({
          where: { id: revisionId }
        });
        if (!revision) throw new Error("Revision not found");
        const { entityType, entityId, snapshot } = revision;
        switch (entityType) {
          case "BlogPost":
            await prisma.blogPost.update({
              where: { id: entityId },
              data: snapshot
            });
            break;
          case "Cafe":
            await prisma.cafe.update({
              where: { id: entityId },
              data: snapshot
            });
            break;
          case "CuratedList":
            await prisma.curatedList.update({
              where: { id: entityId },
              data: snapshot
            });
            break;
          case "Testimonial":
            await prisma.testimonial.update({
              where: { id: entityId },
              data: snapshot
            });
            break;
        }
        await this.createRevision({
          entityType,
          entityId,
          snapshot,
          authorId
        });
        return true;
      }
      /**
       * Handle scheduled publishing logic
       * This is intended to be called by a maintenance job
       */
      async publishScheduledContent() {
        const now = /* @__PURE__ */ new Date();
        const results = {
          blogPosts: 0,
          curatedLists: 0,
          errors: []
        };
        try {
          const scheduledPosts = await prisma.blogPost.findMany({
            where: {
              status: "SCHEDULED",
              scheduledAt: { lte: now }
            }
          });
          for (const post of scheduledPosts) {
            try {
              await prisma.blogPost.update({
                where: { id: post.id },
                data: {
                  status: "PUBLISHED",
                  publishedAt: post.publishedAt || now
                }
              });
              results.blogPosts++;
            } catch (err) {
              results.errors.push(`BlogPost ${post.id}: ${err.message}`);
            }
          }
          const scheduledLists = await prisma.curatedList.findMany({
            where: {
              status: "SCHEDULED",
              scheduledAt: { lte: now }
            }
          });
          for (const list of scheduledLists) {
            try {
              await prisma.curatedList.update({
                where: { id: list.id },
                data: {
                  status: "PUBLISHED"
                }
              });
              results.curatedLists++;
            } catch (err) {
              results.errors.push(`CuratedList ${list.id}: ${err.message}`);
            }
          }
          return results;
        } catch (err) {
          logger.error("Error in publishScheduledContent", err);
          throw err;
        }
      }
      /**
       * Diagnostic: Run content quality checks
       */
      async runQualityChecks() {
        const issues = [];
        const cafes = await prisma.cafe.findMany({
          where: { status: "PUBLISHED" },
          include: { photos: true, amenities: true }
        });
        for (const cafe of cafes) {
          if (!cafe.description || cafe.description.length < 50) {
            issues.push({
              severity: "WARNING",
              entityType: "Cafe",
              entityId: cafe.id,
              entityName: cafe.name,
              message: "Short or missing description"
            });
          }
          if (cafe.photos.length === 0) {
            issues.push({
              severity: "WARNING",
              entityType: "Cafe",
              entityId: cafe.id,
              entityName: cafe.name,
              message: "No photos uploaded"
            });
          } else if (!cafe.photos.some((p) => p.isCover)) {
            issues.push({
              severity: "WARNING",
              entityType: "Cafe",
              entityId: cafe.id,
              entityName: cafe.name,
              message: "No cover photo set"
            });
          }
        }
        const posts = await prisma.blogPost.findMany({
          where: { status: "PUBLISHED" }
        });
        for (const post of posts) {
          if (!post.metaDescription) {
            issues.push({
              severity: "WARNING",
              entityType: "BlogPost",
              entityId: post.id,
              entityName: post.title,
              message: "Missing SEO meta description"
            });
          }
          if (!post.excerpt) {
            issues.push({
              severity: "INFO",
              entityType: "BlogPost",
              entityId: post.id,
              entityName: post.title,
              message: "Missing excerpt"
            });
          }
        }
        const orphans = await prisma.mediaAsset.findMany({
          where: {
            cafePhotos: { none: {} },
            blogPosts: { none: {} },
            curatedLists: { none: {} }
          }
        });
        for (const orphan of orphans) {
          issues.push({
            severity: "INFO",
            entityType: "MediaAsset",
            entityId: orphan.id,
            entityName: orphan.filename,
            message: "Orphaned media asset"
          });
        }
        return issues;
      }
    };
  }
});

// server/src/services/dataIntegrityService.ts
var dataIntegrityService_exports = {};
__export(dataIntegrityService_exports, {
  DataIntegrityService: () => DataIntegrityService,
  dataIntegrityService: () => dataIntegrityService
});
var import_fs7, import_path8, DataIntegrityService, dataIntegrityService;
var init_dataIntegrityService = __esm({
  "server/src/services/dataIntegrityService.ts"() {
    init_database();
    import_fs7 = __toESM(require("fs"), 1);
    import_path8 = __toESM(require("path"), 1);
    init_logger();
    init_metricsService();
    DataIntegrityService = class {
      async getIntegrityReport() {
        const report = {
          cafes: {
            total: await prisma.cafe.count(),
            inconsistentRatings: 0,
            invalidStatus: 0,
            missingRequiredFields: 0
          },
          reviews: {
            total: await prisma.cafeReview.count(),
            orphaned: 0,
            invalidRatings: 0
          },
          media: {
            total: await prisma.cafePhoto.count(),
            missingFiles: 0,
            orphanedFiles: 0
          },
          users: {
            total: await prisma.user.count(),
            invalidRoleStatus: 0,
            staleSessions: 0
          },
          notifications: {
            total: await prisma.notification.count(),
            brokenReferences: 0
          }
        };
        const cafes = await prisma.cafe.findMany({
          select: {
            id: true,
            ratingAverage: true,
            reviewCount: true,
            name: true,
            address: true,
            city: true,
            reviews: {
              where: { status: "APPROVED" },
              select: { overallRating: true }
            }
          }
        });
        for (const cafe of cafes) {
          const actualCount = cafe.reviews.length;
          const actualSum = cafe.reviews.reduce((acc, r) => acc + r.overallRating, 0);
          const actualAvg = actualCount > 0 ? actualSum / actualCount : 0;
          if (Math.abs(Number(cafe.ratingAverage) - actualAvg) > 0.01 || cafe.reviewCount !== actualCount) {
            report.cafes.inconsistentRatings++;
          }
          if (!cafe.name || !cafe.address || !cafe.city) {
            report.cafes.missingRequiredFields++;
          }
        }
        const reviewCounts = await prisma.cafeReview.findMany({
          select: {
            id: true,
            cafeId: true,
            userId: true,
            overallRating: true
          }
        });
        for (const review of reviewCounts) {
          if (review.overallRating < 1 || review.overallRating > 5) {
            report.reviews.invalidRatings++;
          }
          const cafeExists = await prisma.cafe.findUnique({ where: { id: review.cafeId } });
          const userExists = await prisma.user.findUnique({ where: { id: review.userId } });
          if (!cafeExists || !userExists) {
            report.reviews.orphaned++;
          }
        }
        const mediaModels = [
          { model: "cafePhoto", fields: ["url", "thumbnailUrl"] },
          { model: "cafeSubmissionPhoto", fields: ["url"] },
          { model: "cafeReviewPhoto", fields: ["url"] },
          { model: "user", fields: ["avatarUrl"] },
          { model: "blogPost", fields: ["coverImage"] },
          { model: "curatedList", fields: ["coverImage"] },
          { model: "testimonial", fields: ["avatarUrl"] },
          { model: "menuItem", fields: ["imageUrl"] }
        ];
        const uploadsDir = import_path8.default.join(process.cwd(), "uploads");
        for (const { model, fields } of mediaModels) {
          const records = await prisma[model].findMany();
          for (const record of records) {
            for (const field of fields) {
              const url = record[field];
              if (url && url.startsWith("/uploads/")) {
                report.media.total++;
                const filePath = import_path8.default.join(process.cwd(), url.substring(1));
                if (!import_fs7.default.existsSync(filePath)) {
                  report.media.missingFiles++;
                }
              }
            }
          }
        }
        if (import_fs7.default.existsSync(uploadsDir)) {
          const checkOrphaned = async (dir) => {
            const items = import_fs7.default.readdirSync(dir);
            for (const item of items) {
              if (item === ".gitkeep") continue;
              const fullPath = import_path8.default.join(dir, item);
              const stats = import_fs7.default.statSync(fullPath);
              if (stats.isDirectory()) {
                await checkOrphaned(fullPath);
              } else {
                let isUsed = false;
                for (const { model, fields } of mediaModels) {
                  for (const field of fields) {
                    const record = await prisma[model].findFirst({
                      where: { [field]: { contains: item } }
                    });
                    if (record) {
                      isUsed = true;
                      break;
                    }
                  }
                  if (isUsed) break;
                }
                if (!isUsed) {
                  report.media.orphanedFiles++;
                }
              }
            }
          };
          await checkOrphaned(uploadsDir);
        }
        report.users.staleSessions = await prisma.session.count({
          where: { expiresAt: { lt: /* @__PURE__ */ new Date() } }
        });
        return report;
      }
      async recalculateAllCafeRatings() {
        const cafes = await prisma.cafe.findMany({
          select: { id: true }
        });
        let fixedCount = 0;
        for (const cafe of cafes) {
          const result = await this.recalculateCafeRatings(cafe.id);
          const oldAvg = Number(result.oldAverage || 0);
          const newAvg = Number(result.newAverage || 0);
          if (Math.abs(oldAvg - newAvg) > 1e-3 || result.oldCount !== result.newCount) {
            fixedCount++;
          }
        }
        return { processedCount: cafes.length, successCount: fixedCount, failureCount: 0 };
      }
      async recalculateCafeRatings(cafeId) {
        const reviews = await prisma.cafeReview.findMany({
          where: {
            cafeId,
            status: "APPROVED"
          },
          select: {
            overallRating: true
          }
        });
        const count = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.overallRating, 0);
        const average = count > 0 ? sum / count : 0;
        const oldCafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
        await prisma.cafe.update({
          where: { id: cafeId },
          data: {
            ratingAverage: average,
            reviewCount: count
          }
        });
        metricsService.recordEvent("INFO", "data.repair", `Recalculated ratings for cafe ${cafeId}`, {
          cafeId,
          oldAverage: oldCafe?.ratingAverage,
          newAverage: average,
          oldCount: oldCafe?.reviewCount,
          newCount: count
        });
        return {
          oldAverage: oldCafe?.ratingAverage,
          newAverage: average,
          oldCount: oldCafe?.reviewCount,
          newCount: count
        };
      }
      async repairOrphanedReviews() {
        const reviews = await prisma.cafeReview.findMany();
        let count = 0;
        for (const review of reviews) {
          const cafeExists = await prisma.cafe.findUnique({ where: { id: review.cafeId } });
          const userExists = await prisma.user.findUnique({ where: { id: review.userId } });
          if (!cafeExists || !userExists) {
            await prisma.cafeReview.delete({ where: { id: review.id } });
            count++;
          }
        }
        return { processedCount: reviews.length, successCount: count, failureCount: 0 };
      }
      async cleanupMissingMedia() {
        const mediaModels = [
          { model: "cafePhoto", fields: ["url", "thumbnailUrl"] },
          { model: "cafeSubmissionPhoto", fields: ["url"] },
          { model: "cafeReviewPhoto", fields: ["url"] },
          { model: "user", fields: ["avatarUrl"] },
          { model: "blogPost", fields: ["coverImage"] },
          { model: "curatedList", fields: ["coverImage"] },
          { model: "testimonial", fields: ["avatarUrl"] },
          { model: "menuItem", fields: ["imageUrl"] }
        ];
        let totalChecked = 0;
        let removedCount = 0;
        for (const { model, fields } of mediaModels) {
          const records = await prisma[model].findMany();
          totalChecked += records.length;
          for (const record of records) {
            for (const field of fields) {
              const url = record[field];
              if (url && url.startsWith("/uploads/")) {
                const filePath = import_path8.default.join(process.cwd(), url.substring(1));
                if (!import_fs7.default.existsSync(filePath)) {
                  if (fields.length > 1) {
                    await prisma[model].update({
                      where: { id: record.id },
                      data: { [field]: null }
                    });
                  } else {
                    await prisma[model].delete({ where: { id: record.id } });
                  }
                  removedCount++;
                }
              }
            }
          }
        }
        metricsService.recordEvent("INFO", "data.repair", `Cleaned up ${removedCount} missing media records across all models`);
        return { processedCount: totalChecked, successCount: removedCount, failureCount: 0 };
      }
      async cleanupOrphanedFiles() {
        const uploadsDir = import_path8.default.join(process.cwd(), "uploads");
        let removedCount = 0;
        let totalScanned = 0;
        if (!import_fs7.default.existsSync(uploadsDir)) return { processedCount: 0, successCount: 0, failureCount: 0 };
        const mediaModels = [
          { model: "cafePhoto", fields: ["url", "thumbnailUrl"] },
          { model: "cafeSubmissionPhoto", fields: ["url"] },
          { model: "cafeReviewPhoto", fields: ["url"] },
          { model: "user", fields: ["avatarUrl"] },
          { model: "blogPost", fields: ["coverImage"] },
          { model: "curatedList", fields: ["coverImage"] },
          { model: "testimonial", fields: ["avatarUrl"] },
          { model: "menuItem", fields: ["imageUrl"] }
        ];
        const scanDirectory = async (dir) => {
          const items = import_fs7.default.readdirSync(dir);
          for (const item of items) {
            if (item === ".gitkeep") continue;
            const fullPath = import_path8.default.join(dir, item);
            const stats = import_fs7.default.statSync(fullPath);
            if (stats.isDirectory()) {
              await scanDirectory(fullPath);
              continue;
            }
            totalScanned++;
            let isUsed = false;
            for (const { model, fields } of mediaModels) {
              for (const field of fields) {
                const record = await prisma[model].findFirst({
                  where: { [field]: { contains: item } }
                });
                if (record) {
                  isUsed = true;
                  break;
                }
              }
              if (isUsed) break;
            }
            if (!isUsed) {
              try {
                import_fs7.default.unlinkSync(fullPath);
                removedCount++;
                logger.info(`Removed orphaned file: ${fullPath}`);
              } catch (err) {
                logger.error(`Failed to remove orphaned file: ${fullPath}`, err);
              }
            }
          }
        };
        try {
          await scanDirectory(uploadsDir);
          metricsService.recordEvent("INFO", "data.repair", `Cleaned up ${removedCount} orphaned files from disk`);
        } catch (err) {
          logger.error("Error during orphaned files cleanup:", err);
          return { processedCount: totalScanned, successCount: removedCount, failureCount: 1, message: err.message };
        }
        return { processedCount: totalScanned, successCount: removedCount, failureCount: 0 };
      }
    };
    dataIntegrityService = new DataIntegrityService();
  }
});

// server/src/services/cleanupService.ts
var cleanupService_exports = {};
__export(cleanupService_exports, {
  CleanupService: () => CleanupService,
  cleanupService: () => cleanupService
});
var import_fs8, import_path9, import_client19, CleanupService, cleanupService;
var init_cleanupService = __esm({
  "server/src/services/cleanupService.ts"() {
    init_database();
    init_logger();
    import_fs8 = __toESM(require("fs"), 1);
    import_path9 = __toESM(require("path"), 1);
    import_client19 = require("@prisma/client");
    CleanupService = class {
      async runAll() {
        logger.info("Starting system cleanup jobs...");
        const results = await Promise.allSettled([
          this.cleanupSessions(),
          this.cleanupNotifications(),
          this.cleanupEmailJobs(),
          this.cleanupLogs(),
          this.cleanupActivityLogs(),
          this.cleanupAnalytics(),
          this.cleanupUserCafeViews(),
          this.cleanupJobHistory(),
          this.cleanupTempFiles()
        ]);
        let totalProcessed = 0;
        let totalSuccess = 0;
        let totalFailure = 0;
        results.forEach((r) => {
          if (r.status === "fulfilled") {
            totalProcessed += r.value.processedCount;
            totalSuccess += r.value.successCount;
            totalFailure += r.value.failureCount;
          } else {
            totalFailure++;
          }
        });
        logger.info("System cleanup jobs completed.");
        return {
          processedCount: totalProcessed,
          successCount: totalSuccess,
          failureCount: totalFailure
        };
      }
      /**
       * Helper for batched deletion to prevent long locks
       */
      async batchedDelete(model, where, batchSize = 500) {
        let totalDeleted = 0;
        let deletedInBatch = batchSize;
        while (deletedInBatch === batchSize) {
          const idsToDelete = await prisma[model].findMany({
            where,
            select: { id: true },
            take: batchSize
          });
          if (idsToDelete.length === 0) break;
          const ids = idsToDelete.map((item) => item.id);
          const result = await prisma[model].deleteMany({
            where: { id: { in: ids } }
          });
          deletedInBatch = result.count;
          totalDeleted += deletedInBatch;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return totalDeleted;
      }
      async cleanupSessions() {
        try {
          const result = await prisma.session.deleteMany({
            where: {
              expiresAt: {
                lt: /* @__PURE__ */ new Date()
              }
            }
          });
          if (result.count > 0) {
            logger.info(`Cleaned up ${result.count} expired sessions.`);
          }
          return { processedCount: result.count, successCount: result.count, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup sessions", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
      async cleanupNotifications() {
        try {
          const retentionDays = parseInt(process.env.NOTIFICATION_RETENTION_DAYS || "30");
          const cutoff = /* @__PURE__ */ new Date();
          cutoff.setDate(cutoff.getDate() - retentionDays);
          const count = await this.batchedDelete("notification", {
            createdAt: { lt: cutoff },
            isRead: true
          });
          if (count > 0) {
            logger.info(`Cleaned up ${count} old notifications.`);
          }
          return { processedCount: count, successCount: count, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup notifications", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
      async cleanupEmailJobs() {
        try {
          const sevenDaysAgo = /* @__PURE__ */ new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const result = await prisma.emailJob.deleteMany({
            where: {
              createdAt: {
                lt: sevenDaysAgo
              },
              status: {
                in: [import_client19.EmailJobStatus.SENT, import_client19.EmailJobStatus.CANCELLED]
              }
            }
          });
          logger.info(`Cleaned up ${result.count} old email jobs.`);
          return { processedCount: result.count, successCount: result.count, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup email jobs", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
      async cleanupLogs() {
        const logDir = import_path9.default.resolve(process.cwd(), "logs");
        const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || "14");
        if (!import_fs8.default.existsSync(logDir)) return { processedCount: 0, successCount: 0, failureCount: 0 };
        try {
          const files = import_fs8.default.readdirSync(logDir);
          const now = Date.now();
          const maxAge = retentionDays * 24 * 60 * 60 * 1e3;
          let removedCount = 0;
          for (const file of files) {
            if (!file.endsWith(".log")) continue;
            const filePath = import_path9.default.join(logDir, file);
            const stats = import_fs8.default.statSync(filePath);
            const age = now - stats.mtime.getTime();
            if (age > maxAge) {
              import_fs8.default.unlinkSync(filePath);
              removedCount++;
            }
          }
          if (removedCount > 0) {
            logger.info(`Cleaned up ${removedCount} old log files.`);
          }
          return { processedCount: removedCount, successCount: removedCount, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup log files", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
      async cleanupActivityLogs() {
        try {
          const retentionDays = parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS || "90");
          const cutoff = /* @__PURE__ */ new Date();
          cutoff.setDate(cutoff.getDate() - retentionDays);
          const count = await this.batchedDelete("activityLog", {
            createdAt: { lt: cutoff }
          });
          if (count > 0) {
            logger.info(`Cleaned up ${count} old activity logs.`);
          }
          return { processedCount: count, successCount: count, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup activity logs", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
      async cleanupAnalytics() {
        try {
          const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS || "180");
          const cutoff = /* @__PURE__ */ new Date();
          cutoff.setDate(cutoff.getDate() - retentionDays);
          const count = await this.batchedDelete("cafeAnalyticsEvent", {
            createdAt: { lt: cutoff }
          });
          if (count > 0) {
            logger.info(`Cleaned up ${count} old analytics events.`);
          }
          return { processedCount: count, successCount: count, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup analytics", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
      async cleanupUserCafeViews() {
        try {
          const retentionDays = parseInt(process.env.USER_VIEW_RETENTION_DAYS || "180", 10);
          const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1e3);
          const result = await prisma.userCafeView.deleteMany({ where: { viewedAt: { lt: cutoff } } });
          if (result.count > 0) logger.info(`Cleaned up ${result.count} old user cafe views.`);
          return { processedCount: result.count, successCount: result.count, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup user cafe views", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
      async cleanupJobHistory() {
        try {
          const retentionDays = parseInt(process.env.JOB_HISTORY_RETENTION_DAYS || "30");
          const cutoff = /* @__PURE__ */ new Date();
          cutoff.setDate(cutoff.getDate() - retentionDays);
          const result = await prisma.maintenanceJobRun.deleteMany({
            where: {
              startedAt: { lt: cutoff },
              status: { not: "RUNNING" }
            }
          });
          if (result.count > 0) {
            logger.info(`Cleaned up ${result.count} old maintenance job runs.`);
          }
          return { processedCount: result.count, successCount: result.count, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup job history", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
      async cleanupTempFiles() {
        const tempDir = import_path9.default.resolve(process.cwd(), "temp");
        if (!import_fs8.default.existsSync(tempDir)) return { processedCount: 0, successCount: 0, failureCount: 0 };
        try {
          const files = import_fs8.default.readdirSync(tempDir);
          const now = Date.now();
          const maxAge = 24 * 60 * 60 * 1e3;
          let removedCount = 0;
          for (const file of files) {
            const filePath = import_path9.default.join(tempDir, file);
            const stats = import_fs8.default.statSync(filePath);
            const age = now - stats.mtime.getTime();
            if (age > maxAge) {
              if (stats.isDirectory()) {
                import_fs8.default.rmSync(filePath, { recursive: true, force: true });
              } else {
                import_fs8.default.unlinkSync(filePath);
              }
              removedCount++;
            }
          }
          if (removedCount > 0) {
            logger.info(`Cleaned up ${removedCount} temporary files.`);
          }
          return { processedCount: removedCount, successCount: removedCount, failureCount: 0 };
        } catch (err) {
          logger.error("Failed to cleanup temp files", err);
          return { processedCount: 0, successCount: 0, failureCount: 1, message: err.message };
        }
      }
    };
    cleanupService = new CleanupService();
  }
});

// server/src/services/backupService.ts
var backupService_exports = {};
__export(backupService_exports, {
  BackupService: () => BackupService,
  backupService: () => backupService
});
var import_child_process2, import_util2, import_path10, import_fs9, execAsync2, BackupService, backupService;
var init_backupService = __esm({
  "server/src/services/backupService.ts"() {
    import_child_process2 = require("child_process");
    import_util2 = require("util");
    import_path10 = __toESM(require("path"), 1);
    import_fs9 = __toESM(require("fs"), 1);
    init_logger();
    execAsync2 = (0, import_util2.promisify)(import_child_process2.exec);
    BackupService = class {
      constructor() {
        this.backupDir = import_path10.default.resolve(process.cwd(), process.env.BACKUP_DIR || "./backups");
        this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || "14");
        if (!import_fs9.default.existsSync(this.backupDir)) {
          try {
            import_fs9.default.mkdirSync(this.backupDir, { recursive: true });
            logger.info(`Created backup directory at ${this.backupDir}`);
          } catch (err) {
            logger.error(`Failed to create backup directory: ${this.backupDir}`, err);
          }
        }
      }
      async getTarBaseCommand() {
        try {
          const { stdout } = await execAsync2("tar --help");
          if (stdout.includes("--force-local")) {
            return "tar --force-local";
          }
        } catch (err) {
        }
        return "tar";
      }
      async backupDatabase() {
        if (process.env.BACKUP_ENABLED === "false") {
          logger.info("Database backup is explicitly disabled.");
          return;
        }
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const filename = `cafefinder-db-${timestamp}.sql`;
        const filePath = import_path10.default.join(this.backupDir, filename);
        const compressedPath = `${filePath}.gz`;
        try {
          try {
            await execAsync2("pg_dump --version");
          } catch (err) {
            logger.warn("pg_dump not found in system. Falling back to Prisma-based JSON backup.");
            return await this.backupDatabaseFallback();
          }
          logger.info(`Starting database backup: ${filename}`);
          const dbUrl = process.env.PRISMA_DATABASE_URL || "";
          const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d+)?\/([^?]+)/);
          if (!urlMatch) {
            throw new Error("Could not parse PRISMA_DATABASE_URL for backup");
          }
          const [, user, pass, host, port, db] = urlMatch;
          const portArg = port ? `-p ${port}` : "";
          let hostArg = `-h ${host}`;
          if (dbUrl.includes("host=")) {
            const socketPath = dbUrl.split("host=")[1].split("&")[0];
            hostArg = `-h ${socketPath}`;
          }
          const command = `PGPASSWORD='${pass}' pg_dump ${hostArg} ${portArg} -U ${user} ${db} > ${filePath}`;
          await execAsync2(command);
          if (process.env.BACKUP_COMPRESS === "true") {
            await execAsync2(`gzip -f ${filePath}`);
            await this.verifyBackup(compressedPath);
          } else {
            await this.verifyBackup(filePath);
          }
          logger.info(`Database backup completed successfully: ${filename}`);
          await this.cleanupOldBackups();
          return filename;
        } catch (err) {
          logger.error("Database backup failed", err, { event: "backup.failed" });
          throw err;
        }
      }
      async backupDatabaseFallback() {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const filename = `cafefinder-db-json-${timestamp}.tar.gz`;
        const tempDir = import_path10.default.join(this.backupDir, `temp-backup-${timestamp}`);
        const filePath = import_path10.default.join(this.backupDir, filename);
        try {
          logger.info("Starting Prisma-based fallback database backup...");
          if (!import_fs9.default.existsSync(tempDir)) {
            import_fs9.default.mkdirSync(tempDir, { recursive: true });
          }
          const { prisma: prisma2 } = await Promise.resolve().then(() => (init_database(), database_exports));
          const models = [
            "user",
            "session",
            "cafe",
            "cafeSubmission",
            "cafeSubmissionPhoto",
            "cafeSubmissionAmenity",
            "amenity",
            "cafeAmenity",
            "cafeHours",
            "cafePhoto",
            "cafeReview",
            "cafeReviewPhoto",
            "cafeOwnerClaim",
            "cafeChangeRequest",
            "cafeFavorite",
            "blogPost",
            "curatedList",
            "curatedListCafe",
            "testimonial",
            "notification",
            "activityLog",
            "menu",
            "menuCategory",
            "menuItem",
            "menuItemTag",
            "menuItemOptionGroup",
            "menuItemOption",
            "cafeAnalyticsEvent",
            "userCafeView",
            "emailJob"
          ];
          for (const modelName of models) {
            try {
              const data = await prisma2[modelName].findMany();
              import_fs9.default.writeFileSync(
                import_path10.default.join(tempDir, `${modelName}.json`),
                JSON.stringify(data, null, 2)
              );
              logger.debug(`Exported model ${modelName} (${data.length} records)`);
            } catch (modelErr) {
              logger.warn(`Failed to export model ${modelName}:`, modelErr);
            }
          }
          const tarBase = await this.getTarBaseCommand();
          const command = `${tarBase} -czf "${filePath}" -C "${this.backupDir}" "${import_path10.default.basename(tempDir)}"`;
          await execAsync2(command);
          await this.verifyBackup(filePath);
          logger.info(`Prisma-based fallback backup completed: ${filename}`);
          import_fs9.default.rmSync(tempDir, { recursive: true, force: true });
          await this.cleanupOldBackups();
          return filename;
        } catch (err) {
          logger.error("Prisma fallback backup failed", err);
          if (import_fs9.default.existsSync(tempDir)) {
            import_fs9.default.rmSync(tempDir, { recursive: true, force: true });
          }
          throw err;
        }
      }
      async backupUploads() {
        if (process.env.UPLOAD_BACKUP_ENABLED === "false") {
          logger.info("Uploads backup is explicitly disabled.");
          return;
        }
        const uploadsDir = import_path10.default.resolve(process.cwd(), "uploads");
        if (!import_fs9.default.existsSync(uploadsDir)) {
          logger.warn("Uploads directory does not exist, skipping backup.");
          return;
        }
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const filename = `cafefinder-uploads-${timestamp}.tar.gz`;
        const filePath = import_path10.default.join(this.backupDir, filename);
        try {
          logger.info(`Starting uploads backup: ${filename}`);
          const tarBase = await this.getTarBaseCommand();
          const command = `${tarBase} -czf "${filePath}" -C "${import_path10.default.dirname(uploadsDir)}" uploads`;
          await execAsync2(command);
          await this.verifyBackup(filePath);
          logger.info(`Uploads backup completed successfully: ${filename}`);
          await this.cleanupOldBackups();
          return filename;
        } catch (err) {
          logger.error("Uploads backup failed", err, { event: "backup.failed" });
          throw err;
        }
      }
      async verifyBackup(filePath) {
        if (!import_fs9.default.existsSync(filePath)) {
          throw new Error(`Backup file not found after generation: ${filePath}`);
        }
        const stats = import_fs9.default.statSync(filePath);
        if (stats.size === 0) {
          throw new Error(`Backup file is empty: ${filePath}`);
        }
        if (filePath.endsWith(".sql")) {
          const content = import_fs9.default.readFileSync(filePath, "utf8");
          if (!content.includes("CREATE TABLE") && !content.includes("COPY")) {
            throw new Error(`Backup file does not contain expected SQL structure: ${filePath}`);
          }
        }
        if (filePath.endsWith(".gz")) {
          try {
            await execAsync2(`gzip -t ${filePath}`);
          } catch (err) {
            throw new Error(`Compressed backup file is corrupted: ${filePath}`);
          }
        }
      }
      async cleanupOldBackups() {
        const files = import_fs9.default.readdirSync(this.backupDir);
        const now = Date.now();
        const maxAge = this.retentionDays * 24 * 60 * 60 * 1e3;
        let removedCount = 0;
        for (const file of files) {
          if (!file.startsWith("cafefinder-db-") && !file.startsWith("cafefinder-uploads-")) {
            continue;
          }
          const filePath = import_path10.default.join(this.backupDir, file);
          const stats = import_fs9.default.statSync(filePath);
          const age = now - stats.mtime.getTime();
          if (age > maxAge) {
            import_fs9.default.unlinkSync(filePath);
            removedCount++;
          }
        }
        if (removedCount > 0) {
          logger.info(`Cleaned up ${removedCount} old backup files.`);
        }
      }
      async verifyBackups() {
        if (!import_fs9.default.existsSync(this.backupDir)) {
          return { processedCount: 0, successCount: 0, failureCount: 0, message: "Backup directory does not exist" };
        }
        const files = import_fs9.default.readdirSync(this.backupDir);
        let successCount = 0;
        let failureCount = 0;
        const errors = [];
        for (const file of files) {
          if (!file.startsWith("cafefinder-")) continue;
          const filePath = import_path10.default.join(this.backupDir, file);
          try {
            await this.verifyBackup(filePath);
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push(`${file}: ${err.message}`);
          }
        }
        return {
          processedCount: successCount + failureCount,
          successCount,
          failureCount,
          message: failureCount > 0 ? `Verification failed for ${failureCount} files: ${errors.join(", ")}` : `Verified ${successCount} backup files`
        };
      }
    };
    backupService = new BackupService();
  }
});

// server/src/loadEnv.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var cliNodeEnv = process.env.NODE_ENV;
import_dotenv.default.config({ override: true });
if (cliNodeEnv) {
  process.env.NODE_ENV = cliNodeEnv;
} else if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}
console.log("[Env]: Environment variables loaded (PORT=" + process.env.PORT + ", NODE_ENV=" + process.env.NODE_ENV + ")");

// server/src/index.ts
init_database();

// server/src/app.ts
var import_express19 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_morgan = __toESM(require("morgan"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_path13 = __toESM(require("path"), 1);
var import_fs11 = __toESM(require("fs"), 1);
var import_url = require("url");
var import_vite = require("vite");

// server/src/middleware/errorHandler.ts
var import_zod = require("zod");
init_logger();
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const errorCode = err.code || (status === 400 ? "VALIDATION_ERROR" : status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : status === 409 ? "CONFLICT" : status === 429 ? "RATE_LIMITED" : "INTERNAL_SERVER_ERROR");
  const logData = {
    requestId: req.id,
    userId: req.user?.id,
    route: req.originalUrl,
    method: req.method,
    event: "error.internal",
    errorCode,
    status
  };
  logger.error(err.message || "Error caught by handler", err, logData);
  if (err instanceof import_zod.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.issues,
        requestId: req.id
      }
    });
  }
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: {
        code: "CONFLICT",
        message: "A record with this unique value already exists",
        requestId: req.id
      }
    });
  }
  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "A related record is required or missing",
        requestId: req.id
      }
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Record not found",
        requestId: req.id
      }
    });
  }
  if (err.code && err.code.startsWith("P")) {
    return res.status(400).json({
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
        dbCode: err.code,
        requestId: req.id,
        details: process.env.NODE_ENV === "development" ? err.message : void 0
      }
    });
  }
  if (err.message && (err.message.includes("Can't reach database server") || err.message.includes("connection due to administrator command"))) {
    return res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database service temporarily unavailable",
        requestId: req.id
      }
    });
  }
  const message = process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message || "Internal server error";
  res.status(status).json({
    success: false,
    error: {
      code: errorCode,
      message,
      requestId: req.id
    }
  });
}

// server/src/config/security.ts
var import_express_rate_limit = require("express-rate-limit");
var globalRateLimit = (0, import_express_rate_limit.rateLimit)({
  windowMs: 15 * 60 * 1e3,
  max: 1e3,
  // Increased for a directory app but still protecting
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many requests from this IP, please try again later." }
  }
});
var authRateLimit = (0, import_express_rate_limit.rateLimit)({
  windowMs: 15 * 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { message: "Too many login attempts, please try again in 15 minutes." }
  }
});
var searchRateLimit = (0, import_express_rate_limit.rateLimit)({
  windowMs: 60 * 1e3,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Search limit exceeded, please slow down." }
  }
});
var submissionRateLimit = (0, import_express_rate_limit.rateLimit)({
  windowMs: 10 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: "Too many submissions, please wait before trying again." }
  }
});
var cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      // Required for Vite and some PWA logic
      "https://maps.googleapis.com",
      "https://*.google.com",
      "https://*.gstatic.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://*.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https://*.googleapis.com",
      "https://*.gstatic.com",
      "https://maps.gstatic.com",
      "https://maps.googleapis.com",
      "https://ais-dev-pkikrcyeshxv3ouhoon7ky-490682495387.asia-southeast1.run.app",
      // Dev domain
      "https://ais-pre-pkikrcyeshxv3ouhoon7ky-490682495387.asia-southeast1.run.app"
      // Production/Preview domain
    ],
    connectSrc: [
      "'self'",
      "https://*.googleapis.com",
      "https://*.google.com",
      "https://*.gstatic.com",
      "https://maps.googleapis.com"
    ],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

// server/src/middleware/requestLogger.ts
var import_uuid = require("uuid");
init_logger();
init_metricsService();
function normalizeRoute(path14) {
  let normalized = path14.replace(/[a-z0-9]{24,36}/g, ":id");
  normalized = normalized.split("/").map((segment) => {
    if (segment.startsWith(".")) return segment;
    if (segment.includes("-") && segment.length > 5) return ":slug";
    return segment;
  }).join("/");
  if (normalized.startsWith("/api/cafes/") && normalized.split("/").length === 4) {
    return "/api/cafes/:slug";
  }
  if (normalized.startsWith("/api/blog/") && normalized.split("/").length === 4) {
    return "/api/blog/:slug";
  }
  if (normalized.startsWith("/api/lists/") && normalized.split("/").length === 4) {
    return "/api/lists/:slug";
  }
  return normalized;
}
function requestCorrelation(req, res, next) {
  req.id = (0, import_uuid.v4)();
  req.startTime = Date.now();
  res.setHeader("X-Request-ID", req.id);
  next();
}
function requestLogger(req, res, next) {
  const isHealthCheck = req.path.startsWith("/api/health") || req.path.startsWith("/api/ready") || req.path.startsWith("/api/live");
  res.on("finish", () => {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;
    const normalizedRoute = normalizeRoute(req.path);
    metricsService.recordRequest(normalizedRoute, statusCode, duration, req.id, req.method);
    const logData = {
      requestId: req.id,
      userId: req.user?.id,
      role: req.user?.role,
      method: req.method,
      route: req.originalUrl,
      normalizedRoute,
      statusCode,
      durationMs: duration,
      event: "http.request"
    };
    const message = `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`;
    if (isHealthCheck) {
      logger.debug(message, logData);
    } else if (statusCode >= 500) {
      logger.error(message, null, logData);
    } else if (statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }
  });
  next();
}

// server/src/middleware/maintenanceMiddleware.ts
init_operationalService();
function maintenanceMiddleware(req, res, next) {
  if (req.path.startsWith("/api/health") || req.path.startsWith("/api/ready") || req.path.startsWith("/api/live")) {
    return next();
  }
  if (req.path.startsWith("/api/admin/auth") || req.path.startsWith("/api/admin/system")) {
    return next();
  }
  if (operationalService.isMaintenanceMode()) {
    return res.status(503).json({
      success: false,
      error: {
        code: "MAINTENANCE_MODE",
        message: "The system is currently undergoing maintenance. Please try again later.",
        requestId: req.id
      }
    });
  }
  next();
}

// server/src/services/redirectService.ts
init_database();
var RedirectService = class {
  /**
   * Create a redirect record
   */
  async createRedirect(oldPath, newPath, statusCode = 301) {
    if (oldPath === newPath) return null;
    const existing = await prisma.contentRedirect.findUnique({
      where: { oldPath }
    });
    if (existing) {
      return prisma.contentRedirect.update({
        where: { id: existing.id },
        data: { newPath, statusCode, isActive: true }
      });
    }
    return prisma.contentRedirect.create({
      data: {
        oldPath,
        newPath,
        statusCode
      }
    });
  }
  /**
   * Get active redirect for a path
   */
  async getRedirect(path14) {
    return prisma.contentRedirect.findUnique({
      where: {
        oldPath: path14,
        isActive: true
      }
    });
  }
  /**
   * List redirects
   */
  async listRedirects(params = {}) {
    const { page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;
    const [total, redirects] = await Promise.all([
      prisma.contentRedirect.count(),
      prisma.contentRedirect.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      })
    ]);
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      redirects
    };
  }
  /**
   * Toggle redirect status
   */
  async toggleActive(id, isActive) {
    return prisma.contentRedirect.update({
      where: { id },
      data: { isActive }
    });
  }
  /**
   * Delete redirect
   */
  async deleteRedirect(id) {
    return prisma.contentRedirect.delete({
      where: { id }
    });
  }
};

// server/src/middleware/redirectMiddleware.ts
var redirectService = new RedirectService();
async function redirectMiddleware(req, res, next) {
  if (req.method !== "GET") {
    return next();
  }
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  try {
    const redirect = await redirectService.getRedirect(req.path);
    if (redirect) {
      return res.redirect(redirect.statusCode, redirect.newPath);
    }
  } catch (error) {
    console.error("[RedirectMiddleware]: Error checking for redirect:", error);
  }
  next();
}

// server/src/app.ts
init_database();

// server/src/routes/cafe.routes.ts
var import_express = require("express");

// server/src/repositories/cafeRepository.ts
init_database();

// server/src/utils/searchUtils.ts
function normalizeSearchQuery(query) {
  if (!query) return "";
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

// server/src/repositories/cafeRepository.ts
var CafeRepository = class {
  async findAll(filters) {
    const {
      page = 1,
      limit = 12,
      search,
      city,
      priceRange,
      featured,
      trending,
      verified,
      amenities,
      sort = "latest",
      status = "PUBLISHED",
      currentUserId
    } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const normalizedSearch = search ? normalizeSearchQuery(search) : void 0;
    const where = {
      status
    };
    if (normalizedSearch) {
      where.AND = [
        ...where.AND || [],
        {
          OR: [
            { name: { contains: normalizedSearch, mode: "insensitive" } },
            { shortDescription: { contains: normalizedSearch, mode: "insensitive" } },
            { description: { contains: normalizedSearch, mode: "insensitive" } },
            { city: { contains: normalizedSearch, mode: "insensitive" } },
            { address: { contains: normalizedSearch, mode: "insensitive" } },
            {
              amenities: {
                some: {
                  amenity: {
                    name: { contains: normalizedSearch, mode: "insensitive" }
                  }
                }
              }
            }
          ]
        }
      ];
    }
    if (city) {
      where.city = { equals: city };
    }
    if (priceRange !== void 0) {
      where.priceRange = priceRange;
    }
    if (featured !== void 0) {
      where.featured = featured;
    }
    if (trending !== void 0) {
      where.trending = trending;
    }
    if (verified !== void 0) {
      where.verified = verified;
    }
    if (amenities && amenities.length > 0) {
      where.AND = [
        ...where.AND || [],
        ...amenities.map((slug) => ({
          amenities: {
            some: {
              amenity: { slug }
            }
          }
        }))
      ];
    }
    let orderBy = { createdAt: "desc" };
    if (sort === "rating") {
      orderBy = { ratingAverage: "desc" };
    } else if (sort === "name") {
      orderBy = { name: "asc" };
    } else if (sort === "popular") {
      orderBy = { reviewCount: "desc" };
    } else if (sort === "latest") {
      orderBy = { createdAt: "desc" };
    }
    const include = {
      photos: {
        where: { isCover: true },
        take: 1
      },
      amenities: {
        include: {
          amenity: true
        }
      }
    };
    if (currentUserId) {
      include.favorites = {
        where: { userId: currentUserId },
        take: 1
      };
    }
    const [data, total] = await Promise.all([
      prisma.cafe.findMany({
        where,
        include,
        skip,
        take: safeLimit,
        orderBy
      }),
      prisma.cafe.count({ where })
    ]);
    return { data, total };
  }
  async findBySlug(slug, currentUserId) {
    const include = {
      photos: {
        orderBy: { sortOrder: "asc" }
      },
      hours: {
        orderBy: { dayOfWeek: "asc" }
      },
      amenities: {
        include: {
          amenity: true
        }
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          photos: true
        }
      },
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true
        }
      }
    };
    if (currentUserId) {
      include.favorites = {
        where: { userId: currentUserId },
        take: 1
      };
    }
    const cafe = await prisma.cafe.findUnique({
      where: { slug },
      include
    });
    if (!cafe) return null;
    const relatedCafes = await prisma.cafe.findMany({
      where: {
        city: cafe.city,
        id: { not: cafe.id },
        status: "PUBLISHED"
      },
      include: {
        photos: {
          where: { isCover: true },
          take: 1
        }
      },
      take: 4
    });
    return {
      ...cafe,
      relatedCafes
    };
  }
  async findById(id) {
    return prisma.cafe.findUnique({
      where: { id },
      include: {
        photos: true,
        hours: true,
        amenities: true
      }
    });
  }
  async create(data) {
    return prisma.cafe.create({ data });
  }
  async update(id, data) {
    return prisma.cafe.update({
      where: { id },
      data
    });
  }
  async delete(id) {
    return prisma.cafe.deleteMany({
      where: { id }
    });
  }
  async existsBySlug(slug) {
    const count = await prisma.cafe.count({
      where: { slug }
    });
    return count > 0;
  }
};

// server/src/utils/slug.ts
function generateSlug(text) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}

// server/src/services/cafeService.ts
init_database();

// server/src/repositories/userCafeViewRepository.ts
init_database();
var UserCafeViewRepository = class {
  async upsert(userId, cafeId) {
    return prisma.userCafeView.upsert({
      where: {
        userId_cafeId: {
          userId,
          cafeId
        }
      },
      update: {
        viewedAt: /* @__PURE__ */ new Date()
      },
      create: {
        userId,
        cafeId,
        viewedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  async findRecentByUserId(userId, limit = 10) {
    return prisma.userCafeView.findMany({
      where: {
        userId,
        cafe: {
          status: "PUBLISHED"
        }
      },
      include: {
        cafe: {
          include: {
            photos: {
              where: { isCover: true },
              take: 1
            },
            amenities: {
              include: {
                amenity: true
              }
            }
          }
        }
      },
      orderBy: {
        viewedAt: "desc"
      },
      take: limit
    });
  }
};

// server/src/utils/sanitization.ts
var import_sanitize_html = __toESM(require("sanitize-html"), 1);
var sanitizeContent = (content) => {
  return (0, import_sanitize_html.default)(content, {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
    allowedAttributes: {
      "a": ["href", "target", "rel"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      "a": import_sanitize_html.default.simpleTransform("a", { rel: "nofollow noreferrer noopener", target: "_blank" })
    }
  });
};
var sanitizePlain = (content) => {
  return (0, import_sanitize_html.default)(content, {
    allowedTags: [],
    allowedAttributes: {}
  });
};

// server/src/services/cafeService.ts
init_editorialService();
var editorialService = new EditorialService();
var CafeService = class {
  constructor() {
    this.userCafeViewRepository = new UserCafeViewRepository();
    this.cafeRepository = new CafeRepository();
  }
  async getPublishedCafes(filters) {
    const { data, total } = await this.cafeRepository.findAll({
      ...filters,
      status: "PUBLISHED"
    });
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }
  async getCafeBySlug(slug, currentUserId) {
    const include = {
      photos: {
        orderBy: { sortOrder: "asc" }
      },
      hours: {
        orderBy: { dayOfWeek: "asc" }
      },
      amenities: {
        include: {
          amenity: true
        }
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          photos: true
        }
      },
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true
        }
      },
      curatedList: {
        where: {
          list: { status: "PUBLISHED" }
        },
        include: {
          list: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true
            }
          }
        }
      }
    };
    if (currentUserId) {
      include.favorites = {
        where: { userId: currentUserId },
        take: 1
      };
    }
    const cafe = await prisma.cafe.findUnique({
      where: { slug },
      include
    });
    if (!cafe || cafe.status !== "PUBLISHED") {
      return null;
    }
    if (currentUserId) {
      await this.userCafeViewRepository.upsert(currentUserId, cafe.id);
    }
    const relatedInclude = {
      photos: {
        where: { isCover: true },
        take: 1
      }
    };
    if (currentUserId) {
      relatedInclude.favorites = {
        where: { userId: currentUserId },
        take: 1
      };
    }
    const relatedCafes = await prisma.cafe.findMany({
      where: {
        city: cafe.city,
        id: { not: cafe.id },
        status: "PUBLISHED"
      },
      include: relatedInclude,
      take: 4
    });
    const pendingClaim = currentUserId && !cafe.ownerId ? await prisma.cafeOwnerClaim.findFirst({ where: { cafeId: cafe.id, userId: currentUserId, status: "PENDING" } }) : null;
    return {
      ...cafe,
      claimStatus: cafe.ownerId === currentUserId ? "MANAGED" : cafe.ownerId ? "OWNED" : pendingClaim ? "PENDING" : "AVAILABLE",
      relatedCafes
    };
  }
  async getCafeById(id) {
    return this.cafeRepository.findById(id);
  }
  async createCafe(data) {
    let slug = data.slug || generateSlug(data.name);
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.cafeRepository.existsBySlug(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    return this.cafeRepository.create({
      ...data,
      name: sanitizePlain(data.name),
      shortDescription: data.shortDescription ? sanitizePlain(data.shortDescription) : void 0,
      description: data.description ? sanitizePlain(data.description) : void 0,
      address: sanitizePlain(data.address),
      city: sanitizePlain(data.city),
      slug: uniqueSlug
    });
  }
  async updateCafe(id, data, authorId) {
    const sanitizedData = { ...data };
    if (typeof data.name === "string") sanitizedData.name = sanitizePlain(data.name);
    if (typeof data.shortDescription === "string") sanitizedData.shortDescription = sanitizePlain(data.shortDescription);
    if (typeof data.description === "string") sanitizedData.description = sanitizePlain(data.description);
    if (typeof data.address === "string") sanitizedData.address = sanitizePlain(data.address);
    if (typeof data.city === "string") sanitizedData.city = sanitizePlain(data.city);
    const updatedCafe = await this.cafeRepository.update(id, sanitizedData);
    await editorialService.createRevision({
      entityType: "Cafe",
      entityId: id,
      snapshot: updatedCafe,
      authorId
    });
    return updatedCafe;
  }
  async deleteCafe(id) {
    return this.cafeRepository.delete(id);
  }
};

// server/src/repositories/analyticsRepository.ts
init_database();
var AnalyticsRepository = class {
  async recordEvent(data) {
    return prisma.cafeAnalyticsEvent.create({
      data
    });
  }
  async findRecentEvent(hash, cafeId, eventType, since) {
    return prisma.cafeAnalyticsEvent.findFirst({
      where: {
        visitorHash: hash,
        cafeId,
        eventType,
        createdAt: {
          gt: since
        }
      }
    });
  }
  async getAggregateCount(cafeId, eventType, from, to) {
    return prisma.cafeAnalyticsEvent.count({
      where: {
        cafeId,
        eventType,
        createdAt: {
          gte: from,
          lte: to
        }
      }
    });
  }
  async getTimeSeries(cafeId, eventType, from, to, interval) {
    let dateFormat = "YYYY-MM-DD";
    if (interval === "week") dateFormat = "IYYY-IW";
    if (interval === "month") dateFormat = "YYYY-MM";
    const results = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR("createdAt", '${dateFormat}') as "dateStr",
        MIN("createdAt") as date,
        COUNT(*) as value
      FROM cafe_analytics_events
      WHERE "cafeId" = $1 AND "eventType" = $2::"CafeAnalyticsEventType" AND "createdAt" >= $3 AND "createdAt" <= $4
      GROUP BY "dateStr"
      ORDER BY "dateStr" ASC
    `, cafeId, eventType, from, to);
    return results.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString() : new Date(r.date).toISOString(),
      value: Number(r.value)
    }));
  }
  async getFavoriteStats(cafeId, from, to) {
    const current = await prisma.cafeFavorite.count({
      where: {
        cafeId,
        createdAt: {
          gte: from,
          lte: to
        }
      }
    });
    const total = await prisma.cafeFavorite.count({
      where: {
        cafeId
      }
    });
    return { current, total };
  }
  async getReviewStats(cafeId, from, to) {
    const reviews = await prisma.cafeReview.findMany({
      where: {
        cafeId,
        status: "APPROVED",
        createdAt: {
          gte: from,
          lte: to
        }
      },
      select: {
        overallRating: true,
        createdAt: true
      }
    });
    const distribution = await prisma.cafeReview.groupBy({
      by: ["overallRating"],
      where: {
        cafeId,
        status: "APPROVED"
      },
      _count: {
        overallRating: true
      }
    });
    const distObj = { one: 0, two: 0, three: 0, four: 0, five: 0 };
    distribution.forEach((d) => {
      if (d.overallRating === 1) distObj.one = d._count.overallRating;
      if (d.overallRating === 2) distObj.two = d._count.overallRating;
      if (d.overallRating === 3) distObj.three = d._count.overallRating;
      if (d.overallRating === 4) distObj.four = d._count.overallRating;
      if (d.overallRating === 5) distObj.five = d._count.overallRating;
    });
    return {
      count: reviews.length,
      average: reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length : 0,
      distribution: distObj,
      reviews
      // returning for manual time series grouping if needed
    };
  }
  async getHistoricalFavoritesCount(cafeId, from, to, interval) {
    let dateFormat = "YYYY-MM-DD";
    if (interval === "week") dateFormat = "IYYY-IW";
    if (interval === "month") dateFormat = "YYYY-MM";
    return prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR("createdAt", '${dateFormat}') as "dateStr",
        MIN("createdAt") as date,
        COUNT(*) as value
      FROM cafe_favorites
      WHERE "cafeId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
      GROUP BY "dateStr"
      ORDER BY "dateStr" ASC
    `, cafeId, from, to);
  }
};

// server/src/services/analyticsService.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_date_fns = require("date-fns");
var AnalyticsService = class {
  constructor() {
    this.repository = new AnalyticsRepository();
  }
  async trackEvent(data) {
    const { cafeId, userId, eventType, ipAddress, userAgent } = data;
    if (eventType === "PROFILE_VIEW" && (ipAddress || userAgent)) {
      const visitorHash = import_crypto.default.createHash("sha256").update(`${ipAddress || ""}${userAgent || ""}stage19_salt`).digest("hex");
      const since = (0, import_date_fns.subDays)(/* @__PURE__ */ new Date(), 1);
      const existing = await this.repository.findRecentEvent(visitorHash, cafeId, eventType, since);
      if (existing) {
        return null;
      }
      return this.repository.recordEvent({
        cafeId,
        userId,
        eventType,
        visitorHash
      });
    }
    return this.repository.recordEvent({
      cafeId,
      userId,
      eventType
    });
  }
  async getCafeAnalytics(cafeId, options) {
    const { from, to, interval } = options;
    const daysDiff = (0, import_date_fns.differenceInDays)(to, from) + 1;
    const prevTo = (0, import_date_fns.subDays)(from, 1);
    const prevFrom = (0, import_date_fns.subDays)(prevTo, daysDiff - 1);
    const [
      views,
      prevViews,
      favStats,
      prevFavCount,
      reviewStats,
      prevReviewStats
    ] = await Promise.all([
      this.repository.getAggregateCount(cafeId, "PROFILE_VIEW", from, to),
      this.repository.getAggregateCount(cafeId, "PROFILE_VIEW", prevFrom, prevTo),
      this.repository.getFavoriteStats(cafeId, from, to),
      this.repository.getAggregateCount(cafeId, "FAVORITE_ADDED", prevFrom, prevTo),
      // Simplification
      this.repository.getReviewStats(cafeId, from, to),
      this.repository.getReviewStats(cafeId, prevFrom, prevTo)
    ]);
    const [viewSeries, favSeries] = await Promise.all([
      this.repository.getTimeSeries(cafeId, "PROFILE_VIEW", from, to, interval),
      this.repository.getHistoricalFavoritesCount(cafeId, from, to, interval)
    ]);
    const formattedFavSeries = favSeries.map((f) => ({
      date: f.date instanceof Date ? f.date.toISOString() : new Date(f.date).toISOString(),
      value: Number(f.value)
    }));
    return {
      summary: {
        profileViews: views,
        favorites: favStats.total,
        reviews: reviewStats.count,
        averageRating: Number(reviewStats.average.toFixed(1))
      },
      comparison: {
        profileViewsPrevious: prevViews,
        favoritesPrevious: favStats.total - favStats.current,
        // Approximation of total at end of prev period
        reviewsPrevious: prevReviewStats.count,
        averageRatingPrevious: Number(prevReviewStats.average.toFixed(1))
      },
      series: {
        profileViews: viewSeries,
        favorites: formattedFavSeries
        // reviews series can be derived or specifically fetched
      },
      ratings: reviewStats.distribution
    };
  }
};

// server/src/controllers/cafeController.ts
var import_zod2 = require("zod");

// server/src/dtos/cafeDto.ts
function mapToPublicCafeSummary(cafe) {
  return {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    shortDescription: cafe.shortDescription,
    address: cafe.address,
    city: cafe.city,
    state: cafe.state,
    latitude: cafe.latitude ? parseFloat(cafe.latitude.toString()) : null,
    longitude: cafe.longitude ? parseFloat(cafe.longitude.toString()) : null,
    priceRange: cafe.priceRange,
    verified: cafe.verified,
    featured: cafe.featured,
    trending: cafe.trending,
    ratingAverage: parseFloat(cafe.ratingAverage.toString()),
    reviewCount: cafe.reviewCount,
    photos: cafe.photos ? cafe.photos.map((p) => ({
      url: p.url,
      isCover: p.isCover
    })) : [],
    isFavorite: cafe.favorites ? cafe.favorites.length > 0 : false
  };
}
function mapToPublicCafeProfile(cafe) {
  return {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    shortDescription: cafe.shortDescription,
    description: cafe.description,
    address: cafe.address,
    city: cafe.city,
    state: cafe.state,
    country: cafe.country,
    postalCode: cafe.postalCode,
    latitude: cafe.latitude ? parseFloat(cafe.latitude.toString()) : null,
    longitude: cafe.longitude ? parseFloat(cafe.longitude.toString()) : null,
    phone: cafe.phone,
    email: cafe.email,
    website: cafe.website,
    instagram: cafe.instagram,
    facebook: cafe.facebook,
    priceRange: cafe.priceRange,
    verified: cafe.verified,
    featured: cafe.featured,
    trending: cafe.trending,
    ratingAverage: parseFloat(cafe.ratingAverage.toString()),
    reviewCount: cafe.reviewCount,
    photos: cafe.photos.map((p) => ({
      id: p.id,
      url: p.url,
      isCover: p.isCover,
      caption: p.caption,
      altText: p.altText
    })),
    hours: cafe.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed
    })),
    amenities: cafe.amenities.map((a) => ({
      amenity: {
        id: a.amenity.id,
        name: a.amenity.name,
        slug: a.amenity.slug,
        icon: a.amenity.icon
      }
    })),
    reviews: cafe.reviews.map((r) => ({
      id: r.id,
      overallRating: r.overallRating,
      coffeeRating: r.coffeeRating,
      ambianceRating: r.ambianceRating,
      serviceRating: r.serviceRating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        name: r.user.name,
        avatarUrl: r.user.avatarUrl
      },
      photos: r.photos.map((ph) => ({ url: ph.url }))
    })),
    relatedCafes: cafe.relatedCafes.map((rc) => ({
      id: rc.id,
      name: rc.name,
      slug: rc.slug,
      city: rc.city,
      ratingAverage: parseFloat(rc.ratingAverage.toString()),
      reviewCount: rc.reviewCount,
      priceRange: rc.priceRange,
      photos: rc.photos
    })),
    isFavorite: cafe.favorites ? cafe.favorites.length > 0 : false,
    claimStatus: cafe.claimStatus || "AVAILABLE"
  };
}

// server/src/controllers/cafeController.ts
var emptyToUndefined = (val) => val === "" || val === null ? void 0 : val;
var getCafesQuerySchema = import_zod2.z.object({
  page: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  })),
  limit: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : 12;
    return isNaN(parsed) || parsed < 1 ? 12 : Math.min(parsed, 50);
  })),
  search: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional()),
  city: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional()),
  priceRange: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : void 0;
    return parsed === void 0 || isNaN(parsed) ? void 0 : parsed;
  })),
  featured: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional().transform((v) => v === void 0 ? void 0 : v === "true")),
  trending: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional().transform((v) => v === void 0 ? void 0 : v === "true")),
  verified: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional().transform((v) => v === void 0 ? void 0 : v === "true")),
  amenities: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.string().optional().transform((v) => v ? v.split(",") : void 0)),
  sort: import_zod2.z.preprocess(emptyToUndefined, import_zod2.z.enum(["rating", "latest", "name", "popular"]).optional())
});
var CafeController = class {
  constructor() {
    this.getAll = async (req, res, next) => {
      try {
        const validatedQuery = getCafesQuerySchema.parse(req.query);
        const result = await this.cafeService.getPublishedCafes({
          ...validatedQuery,
          currentUserId: req.user?.id
        });
        res.json({
          success: true,
          data: result.data.map(mapToPublicCafeSummary),
          pagination: result.pagination
        });
      } catch (error) {
        next(error);
      }
    };
    this.getBySlug = async (req, res, next) => {
      try {
        const { slug } = req.params;
        const cafe = await this.cafeService.getCafeBySlug(slug, req.user?.id);
        if (!cafe) {
          return res.status(404).json({
            success: false,
            error: { message: "Cafe not found" }
          });
        }
        this.analyticsService.trackEvent({
          cafeId: cafe.id,
          userId: req.user?.id,
          eventType: "PROFILE_VIEW",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent")
        }).catch((err) => console.error("Failed to track view:", err));
        res.json({
          success: true,
          data: mapToPublicCafeProfile(cafe)
        });
      } catch (error) {
        next(error);
      }
    };
    // Stubs for mutations (requires auth in later stages)
    this.create = async (req, res) => {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" }
      });
    };
    this.update = async (req, res) => {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" }
      });
    };
    this.delete = async (req, res) => {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" }
      });
    };
    this.trackInteraction = async (req, res, next) => {
      try {
        const { id, eventType } = req.params;
        const allowedEvents = [
          "DIRECTIONS_CLICK",
          "WEBSITE_CLICK",
          "PHONE_CLICK",
          "INSTAGRAM_CLICK",
          "FACEBOOK_CLICK"
        ];
        if (!allowedEvents.includes(eventType)) {
          return res.status(400).json({
            success: false,
            error: { message: "Invalid interaction type" }
          });
        }
        await this.analyticsService.trackEvent({
          cafeId: id,
          userId: req.user?.id,
          eventType,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent")
        });
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    };
    this.cafeService = new CafeService();
    this.analyticsService = new AnalyticsService();
  }
};

// server/src/repositories/favoriteRepository.ts
init_database();
var FavoriteRepository = class {
  async findFavorite(userId, cafeId) {
    return prisma.cafeFavorite.findUnique({
      where: {
        userId_cafeId: {
          userId,
          cafeId
        }
      }
    });
  }
  async addFavorite(userId, cafeId) {
    return prisma.cafeFavorite.upsert({
      where: {
        userId_cafeId: {
          userId,
          cafeId
        }
      },
      update: {},
      create: {
        userId,
        cafeId
      }
    });
  }
  async removeFavorite(userId, cafeId) {
    return prisma.cafeFavorite.deleteMany({
      where: {
        userId,
        cafeId
      }
    });
  }
  async findUserFavorites(filters) {
    const {
      userId,
      page = 1,
      limit = 12,
      search,
      city,
      priceRange,
      minRating,
      amenities,
      sort = "recently_saved"
    } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = {
      userId,
      cafe: {
        status: "PUBLISHED"
      }
    };
    if (search || city || priceRange !== void 0 || minRating !== void 0 || amenities?.length) {
      const cafeWhere = {
        status: "PUBLISHED"
      };
      if (search) {
        cafeWhere.OR = [
          { name: { contains: search } },
          { shortDescription: { contains: search } },
          { description: { contains: search } },
          { city: { contains: search } },
          { address: { contains: search } }
        ];
      }
      if (city) {
        cafeWhere.city = city;
      }
      if (priceRange !== void 0) {
        cafeWhere.priceRange = priceRange;
      }
      if (minRating !== void 0) {
        cafeWhere.ratingAverage = { gte: minRating };
      }
      if (amenities?.length) {
        cafeWhere.AND = [
          ...cafeWhere.AND || [],
          ...amenities.map((slug) => ({
            amenities: {
              some: {
                amenity: { slug }
              }
            }
          }))
        ];
      }
      where.cafe = cafeWhere;
    }
    let orderBy = { createdAt: "desc" };
    if (sort === "rating") {
      orderBy = { cafe: { ratingAverage: "desc" } };
    } else if (sort === "name_asc") {
      orderBy = { cafe: { name: "asc" } };
    } else if (sort === "name_desc") {
      orderBy = { cafe: { name: "desc" } };
    } else if (sort === "recently_saved") {
      orderBy = { createdAt: "desc" };
    }
    const include = {
      cafe: {
        include: {
          photos: {
            where: { isCover: true },
            take: 1
          },
          amenities: {
            include: {
              amenity: true
            }
          }
        }
      }
    };
    const [data, total] = await Promise.all([
      prisma.cafeFavorite.findMany({
        where,
        include,
        skip,
        take: safeLimit,
        orderBy
      }),
      prisma.cafeFavorite.count({ where })
    ]);
    return { data, total };
  }
};

// server/src/services/favoriteService.ts
init_database();
var FavoriteService = class {
  constructor() {
    this.favoriteRepository = new FavoriteRepository();
    this.cafeRepository = new CafeRepository();
    this.analyticsService = new AnalyticsService();
  }
  async toggleFavorite(userId, cafeId) {
    const cafe = await this.cafeRepository.findById(cafeId);
    if (!cafe) {
      throw { status: 404, message: "Cafe not found." };
    }
    if (cafe.status !== "PUBLISHED") {
      throw { status: 403, message: "You can only favorite published cafes." };
    }
    const existing = await this.favoriteRepository.findFavorite(userId, cafeId);
    if (existing) {
      await this.favoriteRepository.removeFavorite(userId, cafeId);
      this.analyticsService.trackEvent({
        cafeId,
        userId,
        eventType: "FAVORITE_REMOVED"
      }).catch((err) => console.error("Failed to track analytics:", err));
      await prisma.activityLog.create({
        data: {
          userId,
          action: "FAVORITE_REMOVED",
          entityType: "CAFE",
          entityId: cafeId,
          description: `Removed ${cafe.name} from favorites`
        }
      });
      return { isFavorite: false };
    } else {
      await this.favoriteRepository.addFavorite(userId, cafeId);
      this.analyticsService.trackEvent({
        cafeId,
        userId,
        eventType: "FAVORITE_ADDED"
      }).catch((err) => console.error("Failed to track analytics:", err));
      await prisma.activityLog.create({
        data: {
          userId,
          action: "FAVORITE_ADDED",
          entityType: "CAFE",
          entityId: cafeId,
          description: `Added ${cafe.name} to favorites`
        }
      });
      return { isFavorite: true };
    }
  }
  async getFavoriteStatus(userId, cafeId) {
    const favorite = await this.favoriteRepository.findFavorite(userId, cafeId);
    return { isFavorite: !!favorite };
  }
  async getUserFavorites(filters) {
    const { data, total } = await this.favoriteRepository.findUserFavorites(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }
  async addFavorite(userId, cafeId) {
    const cafe = await this.cafeRepository.findById(cafeId);
    if (!cafe || cafe.status !== "PUBLISHED") {
      throw { status: 404, message: "Cafe not found or not published." };
    }
    await this.favoriteRepository.addFavorite(userId, cafeId);
    this.analyticsService.trackEvent({
      cafeId,
      userId,
      eventType: "FAVORITE_ADDED"
    }).catch((err) => console.error("Failed to track analytics:", err));
    await prisma.activityLog.create({
      data: {
        userId,
        action: "FAVORITE_ADDED",
        entityType: "CAFE",
        entityId: cafeId,
        description: `Added ${cafe.name} to favorites`
      }
    });
    return { isFavorite: true };
  }
  async removeFavorite(userId, cafeId) {
    await this.favoriteRepository.removeFavorite(userId, cafeId);
    this.analyticsService.trackEvent({
      cafeId,
      userId,
      eventType: "FAVORITE_REMOVED"
    }).catch((err) => console.error("Failed to track analytics:", err));
    await prisma.activityLog.create({
      data: {
        userId,
        action: "FAVORITE_REMOVED",
        entityType: "CAFE",
        entityId: cafeId,
        description: `Removed favorite`
      }
    });
    return { isFavorite: false };
  }
};

// server/src/controllers/favoriteController.ts
var import_zod3 = require("zod");

// server/src/dtos/favoriteDto.ts
function mapToFavoriteDto(favorite) {
  return {
    id: favorite.id,
    createdAt: favorite.createdAt,
    cafe: mapToPublicCafeSummary(favorite.cafe)
  };
}

// server/src/controllers/favoriteController.ts
var emptyToUndefined2 = (val) => val === "" ? void 0 : val;
var getFavoritesQuerySchema = import_zod3.z.object({
  page: import_zod3.z.preprocess(emptyToUndefined2, import_zod3.z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : 1;
    return isNaN(parsed) ? 1 : parsed;
  })),
  limit: import_zod3.z.preprocess(emptyToUndefined2, import_zod3.z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : 12;
    return isNaN(parsed) ? 12 : Math.min(parsed, 50);
  })),
  search: import_zod3.z.preprocess(emptyToUndefined2, import_zod3.z.string().optional()),
  city: import_zod3.z.preprocess(emptyToUndefined2, import_zod3.z.string().optional()),
  priceRange: import_zod3.z.preprocess(emptyToUndefined2, import_zod3.z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : void 0;
    return parsed === void 0 || isNaN(parsed) ? void 0 : parsed;
  })),
  minRating: import_zod3.z.preprocess(emptyToUndefined2, import_zod3.z.string().optional().transform((v) => {
    const parsed = v ? parseFloat(v) : void 0;
    return parsed === void 0 || isNaN(parsed) ? void 0 : parsed;
  })),
  amenities: import_zod3.z.preprocess(emptyToUndefined2, import_zod3.z.string().optional().transform((v) => v ? v.split(",") : void 0)),
  sort: import_zod3.z.preprocess(emptyToUndefined2, import_zod3.z.enum(["recently_saved", "rating", "name_asc", "name_desc"]).optional())
});
var FavoriteController = class {
  constructor() {
    this.favoriteService = new FavoriteService();
    this.toggle = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const userId = req.user.id;
        const result = await this.favoriteService.toggleFavorite(userId, cafeId);
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    this.getStatus = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
          return res.json({
            success: true,
            data: { isFavorite: false }
          });
        }
        const result = await this.favoriteService.getFavoriteStatus(userId, cafeId);
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    this.getMyFavorites = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const validatedQuery = getFavoritesQuerySchema.parse(req.query);
        const result = await this.favoriteService.getUserFavorites({
          ...validatedQuery,
          userId
        });
        res.json({
          success: true,
          data: result.data.map(mapToFavoriteDto),
          pagination: result.pagination
        });
      } catch (error) {
        next(error);
      }
    };
    this.add = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const userId = req.user.id;
        const result = await this.favoriteService.addFavorite(userId, cafeId);
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
    this.remove = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const userId = req.user.id;
        const result = await this.favoriteService.removeFavorite(userId, cafeId);
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        next(error);
      }
    };
  }
};

// server/src/services/authService.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);

// server/src/repositories/userRepository.ts
init_database();
var UserRepository = class {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id }
    });
  }
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }
  async create(data) {
    return prisma.user.create({
      data
    });
  }
  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data
    });
  }
};

// server/src/repositories/sessionRepository.ts
init_database();
var SessionRepository = class {
  async create(data) {
    return prisma.session.create({
      data
    });
  }
  async findByTokenHash(tokenHash) {
    return prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async delete(id) {
    return prisma.session.delete({
      where: { id }
    });
  }
  async deleteByTokenHash(tokenHash) {
    return prisma.session.delete({
      where: { tokenHash }
    });
  }
  async deleteExpired() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: /* @__PURE__ */ new Date()
        }
      }
    });
  }
  async deleteUserSessions(userId) {
    return prisma.session.deleteMany({
      where: { userId }
    });
  }
};

// server/src/utils/auth.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var COOKIE_NAME = "cafefinder_session";
var getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  const isAistudio = true;
  const sameSite = isProd && !process.env.CLIENT_URL?.includes("asia-southeast1.run.app") ? "lax" : "none";
  return {
    httpOnly: true,
    // Enable secure cookies in production OR AI Studio environment.
    // AI Studio uses HTTPS for its preview URLs.
    secure: true,
    sameSite,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1e3
    // 7 days
  };
};
var hashToken = (token) => {
  return import_crypto2.default.createHash("sha256").update(token).digest("hex");
};
var generateToken = () => {
  return import_crypto2.default.randomBytes(32).toString("hex");
};
var extractToken = (req) => {
  if (!req) return null;
  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === "string") {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      return trimmed.substring(7).trim();
    }
    if (!trimmed.includes(" ")) {
      return trimmed;
    }
  }
  const customHeader = req.headers?.["x-auth-token"];
  if (customHeader && typeof customHeader === "string") {
    return customHeader.trim();
  }
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  if (req.query && typeof req.query.token === "string") {
    return req.query.token.trim();
  }
  return null;
};

// server/src/services/authService.ts
var import_client2 = require("@prisma/client");
var AuthService = class {
  constructor() {
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
  }
  async register(data) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw { status: 409, message: "An account with this email already exists." };
    }
    const passwordHash = await import_bcryptjs.default.hash(data.password, 12);
    const user = await this.userRepository.create({
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: import_client2.Role.USER,
      status: import_client2.UserStatus.ACTIVE
    });
    const { session, token } = await this.createSession(user.id);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      token
    };
  }
  async login(data) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user || !user.passwordHash) {
      throw { status: 401, message: "Invalid email or password." };
    }
    const isPasswordValid = await import_bcryptjs.default.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw { status: 401, message: "Invalid email or password." };
    }
    if (user.status === import_client2.UserStatus.SUSPENDED) {
      throw { status: 403, message: "Your account has been suspended. Please contact support." };
    }
    if (user.status === import_client2.UserStatus.INACTIVE) {
      throw { status: 403, message: "Your account is inactive." };
    }
    const { session, token } = await this.createSession(user.id);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      token
    };
  }
  async createSession(userId) {
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    const session = await this.sessionRepository.create({
      user: { connect: { id: userId } },
      tokenHash,
      expiresAt
    });
    return { session, token };
  }
  async validateSession(token) {
    const tokenHash = hashToken(token);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);
    if (!session) return null;
    if (session.expiresAt < /* @__PURE__ */ new Date()) {
      await this.sessionRepository.delete(session.id);
      return null;
    }
    return session.user;
  }
  async logout(token) {
    const tokenHash = hashToken(token);
    try {
      await this.sessionRepository.deleteByTokenHash(tokenHash);
    } catch (e) {
    }
  }
  async cleanupSessions() {
    await this.sessionRepository.deleteExpired();
  }
};

// server/src/middleware/authMiddleware.ts
var authService = new AuthService();
var requireAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: "Authentication required" }
    });
  }
  try {
    const user = await authService.validateSession(token);
    if (!user) {
      res.clearCookie(COOKIE_NAME, getCookieOptions());
      return res.status(401).json({
        success: false,
        error: { message: "Session expired or invalid" }
      });
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
var optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }
  try {
    const user = await authService.validateSession(token);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};
var requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required" }
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: "You do not have permission to access this resource" }
      });
    }
    next();
  };
};

// server/src/routes/cafe.routes.ts
var router = (0, import_express.Router)();
var cafeController = new CafeController();
var favoriteController = new FavoriteController();
router.get("/", optionalAuth, cafeController.getAll);
router.get("/:slug", optionalAuth, cafeController.getBySlug);
router.post("/", requireAuth, cafeController.create);
router.put("/:id", requireAuth, cafeController.update);
router.delete("/:id", requireAuth, cafeController.delete);
router.post("/:cafeId/favorite", requireAuth, favoriteController.toggle);
router.delete("/:cafeId/favorite", requireAuth, favoriteController.remove);
router.get("/:cafeId/favorite", optionalAuth, favoriteController.getStatus);
router.post("/:id/track/:eventType", optionalAuth, cafeController.trackInteraction);
var cafe_routes_default = router;

// server/src/routes/health.routes.ts
var import_express2 = require("express");
init_database();
init_operationalService();
var router2 = (0, import_express2.Router)();
router2.get("/live", (req, res) => {
  res.status(200).json({ success: true, status: "alive" });
});
router2.get("/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, status: "ready" });
  } catch (error) {
    res.status(503).json({ success: false, status: "not-ready", reason: "Database unavailable" });
  }
});
router2.get("/", async (req, res) => {
  try {
    const status = await operationalService.getStatus();
    const isMaintenance = status.application.maintenanceMode;
    const isHealthy = status.database.status === "connected";
    res.status(isHealthy ? isMaintenance ? 503 : 200 : 503).json({
      success: isHealthy && !isMaintenance,
      data: {
        status: isHealthy ? isMaintenance ? "maintenance" : "ok" : "degraded",
        database: status.database.status,
        maintenance: isMaintenance,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: status.application.version,
        uptime: status.application.uptime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: {
        status: "error",
        error: error.message || "Health check failed"
      }
    });
  }
});
var health_routes_default = router2;

// server/src/routes/auth.routes.ts
var import_express3 = require("express");

// server/src/controllers/authController.ts
var import_zod4 = require("zod");

// server/src/services/email/email.service.ts
init_database();

// server/src/services/email/smtp.provider.ts
var import_nodemailer = __toESM(require("nodemailer"), 1);
var SmtpProvider = class {
  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    this.transporter = import_nodemailer.default.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : void 0
    });
  }
  async send(options) {
    try {
      const info = await this.transporter.sendMail({
        from: options.from ? `${options.from.name} <${options.from.address}>` : void 0,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo
      });
      return {
        success: true,
        providerMessageId: info.messageId
      };
    } catch (error) {
      console.error("[SmtpProvider]: Failed to send email:", error);
      return {
        success: false,
        error: error.message || "Unknown error occurred"
      };
    }
  }
  getName() {
    return "SMTP";
  }
};

// server/src/services/email/console.provider.ts
var ConsoleProvider = class {
  async send(options) {
    console.log("--- EMAIL SENT (CONSOLE) ---");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${options.from?.name} <${options.from?.address}>`);
    console.log("--- TEXT CONTENT ---");
    console.log(options.text);
    console.log("--- HTML CONTENT (TRUNCATED) ---");
    console.log(options.html.substring(0, 200) + "...");
    console.log("----------------------------");
    return {
      success: true,
      providerMessageId: `console-${Date.now()}`
    };
  }
  getName() {
    return "CONSOLE";
  }
};

// server/src/services/email/email.service.ts
var import_client3 = require("@prisma/client");

// server/src/services/email/templates.ts
var COLORS = {
  primary: "#5A3825",
  // Coffee brown
  secondary: "#FCFAF6",
  // Cream background
  accent: "#2D5A27",
  // Green accent
  text: "#2D2926",
  // Neutral text
  muted: "#716B67",
  white: "#FFFFFF"
};
var getBaseLayout = (title, contentHtml, actionUrl, actionText) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: ${COLORS.text};
      margin: 0;
      padding: 0;
      background-color: ${COLORS.secondary};
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      color: ${COLORS.primary};
      margin: 0;
      font-size: 28px;
    }
    .content {
      background-color: ${COLORS.white};
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: ${COLORS.muted};
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${COLORS.primary};
      color: ${COLORS.white} !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin-top: 24px;
    }
    .link-fallback {
      margin-top: 24px;
      font-size: 12px;
      color: ${COLORS.muted};
      word-break: break-all;
    }
    h2 {
      color: ${COLORS.primary};
      margin-top: 0;
    }
    p {
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CafeFinder</h1>
    </div>
    <div class="content">
      ${contentHtml}
      ${actionUrl && actionText ? `
        <div style="text-align: center;">
          <a href="${actionUrl}" class="button">${actionText}</a>
        </div>
        <div class="link-fallback">
          If the button doesn't work, copy and paste this URL into your browser: <br>
          <a href="${actionUrl}">${actionUrl}</a>
        </div>
      ` : ""}
    </div>
    <div class="footer">
      <p><strong>CafeFinder</strong></p>
      <p>Discover cafes worth visiting.</p>
      <p style="margin-top: 16px; font-size: 12px;">This is an automated account notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};
var renderTemplate = (template, data) => {
  switch (template) {
    case "WELCOME" /* WELCOME */:
      return {
        subject: "Welcome to CafeFinder",
        html: getBaseLayout(
          "Welcome to CafeFinder",
          `
          <h2>Welcome, ${data.name}!</h2>
          <p>Thanks for creating your CafeFinder account. We're excited to have you in our community of coffee lovers.</p>
          <p>With your new account, you can:</p>
          <ul>
            <li>Discover the best specialty coffee shops near you</li>
            <li>Save your favorite spots for quick access</li>
            <li>Write reviews to help others find great rituals</li>
            <li>Submit new cafes you've discovered</li>
          </ul>
          <p>Start exploring today!</p>
          `,
          data.exploreUrl,
          "Explore CafeFinder"
        ),
        text: `Welcome to CafeFinder, ${data.name}!

Thanks for creating your CafeFinder account. We're excited to have you in our community of coffee lovers.

With your new account, you can discover cafes, save favorites, write reviews, and submit new cafes.

Start exploring today: ${data.exploreUrl}

CafeFinder - Discover cafes worth visiting.`
      };
    case "CAFE_SUBMISSION_APPROVED" /* CAFE_SUBMISSION_APPROVED */:
      return {
        subject: "Your cafe submission was approved",
        html: getBaseLayout(
          "Cafe Submission Approved",
          `
          <h2>Great news, ${data.name}!</h2>
          <p>Your submission for <strong>${data.cafeName}</strong> has been approved by our team.</p>
          <p>It is now live on CafeFinder and available for everyone to discover.</p>
          `,
          data.cafeUrl,
          "View Cafe Profile"
        ),
        text: `Great news, ${data.name}!

Your submission for ${data.cafeName} has been approved. It is now live on CafeFinder.

View it here: ${data.cafeUrl}

CafeFinder - Discover cafes worth visiting.`
      };
    case "CAFE_SUBMISSION_REJECTED" /* CAFE_SUBMISSION_REJECTED */:
      return {
        subject: "Update on your cafe submission",
        html: getBaseLayout(
          "Cafe Submission Update",
          `
          <h2>Hello ${data.name},</h2>
          <p>Thank you for submitting <strong>${data.cafeName}</strong> to CafeFinder.</p>
          <p>After reviewing your submission, we are unable to approve it at this time for the following reason:</p>
          <p style="padding: 16px; background-color: #f8f8f8; border-left: 4px solid #ddd;">${data.reason}</p>
          ${data.submissionUrl ? "<p>You can review your submission details and make corrections if needed.</p>" : ""}
          `,
          data.submissionUrl,
          data.submissionUrl ? "View Submission" : void 0
        ),
        text: `Hello ${data.name},

Thank you for submitting ${data.cafeName} to CafeFinder. After review, we are unable to approve it for the following reason: ${data.reason}

CafeFinder - Discover cafes worth visiting.`
      };
    case "OWNER_CLAIM_APPROVED" /* OWNER_CLAIM_APPROVED */:
      return {
        subject: "Your cafe ownership claim was approved",
        html: getBaseLayout(
          "Ownership Claim Approved",
          `
          <h2>Congratulations, ${data.name}!</h2>
          <p>Your claim for ownership of <strong>${data.cafeName}</strong> has been approved.</p>
          <p>You now have access to your Owner Dashboard where you can manage your cafe profile, respond to reviews, and view analytics.</p>
          `,
          data.dashboardUrl,
          "Go to Owner Dashboard"
        ),
        text: `Congratulations, ${data.name}!

Your claim for ownership of ${data.cafeName} has been approved. You now have access to your Owner Dashboard.

Manage your cafe here: ${data.dashboardUrl}

CafeFinder - Discover cafes worth visiting.`
      };
    case "OWNER_CLAIM_REJECTED" /* OWNER_CLAIM_REJECTED */:
      return {
        subject: "Update on your ownership claim",
        html: getBaseLayout(
          "Ownership Claim Update",
          `
          <h2>Hello ${data.name},</h2>
          <p>We have reviewed your request to claim ownership of <strong>${data.cafeName}</strong>.</p>
          <p>Unfortunately, we are unable to approve your claim at this time for the following reason:</p>
          <p style="padding: 16px; background-color: #f8f8f8; border-left: 4px solid #ddd;">${data.reason}</p>
          `,
          data.claimUrl,
          data.claimUrl ? "View Claim Status" : void 0
        ),
        text: `Hello ${data.name},

We have reviewed your request to claim ownership of ${data.cafeName}. Unfortunately, we are unable to approve it for the following reason: ${data.reason}

CafeFinder - Discover cafes worth visiting.`
      };
    case "REVIEW_APPROVED" /* REVIEW_APPROVED */:
      return {
        subject: "Your review is now published",
        html: getBaseLayout(
          "Review Published",
          `
          <h2>Hello ${data.name},</h2>
          <p>Your review for <strong>${data.cafeName}</strong> has been approved and is now visible to the community.</p>
          <p>Thank you for sharing your experience and helping others find great coffee!</p>
          `,
          data.cafeUrl,
          "View Cafe Reviews"
        ),
        text: `Hello ${data.name},

Your review for ${data.cafeName} has been approved and is now live. Thank you for sharing your experience!

View it here: ${data.cafeUrl}

CafeFinder - Discover cafes worth visiting.`
      };
    case "REVIEW_REJECTED" /* REVIEW_REJECTED */:
      return {
        subject: "Update on your review",
        html: getBaseLayout(
          "Review Update",
          `
          <h2>Hello ${data.name},</h2>
          <p>We have reviewed your recent review for <strong>${data.cafeName}</strong>.</p>
          <p>Unfortunately, your review does not meet our community guidelines and cannot be published in its current form.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
          `
        ),
        text: `Hello ${data.name},

We have reviewed your recent review for ${data.cafeName}. Unfortunately, it does not meet our community guidelines and cannot be published.

CafeFinder - Discover cafes worth visiting.`
      };
    case "CHANGE_REQUEST_APPROVED" /* CHANGE_REQUEST_APPROVED */:
      return {
        subject: "Your cafe update request was approved",
        html: getBaseLayout(
          "Update Request Approved",
          `
          <h2>Hello ${data.name},</h2>
          <p>Your requested changes to <strong>${data.cafeName}</strong> (${data.changeType}) have been approved and applied.</p>
          `,
          data.dashboardUrl,
          "View Dashboard"
        ),
        text: `Hello ${data.name},

Your requested changes to ${data.cafeName} (${data.changeType}) have been approved and applied.

View your dashboard: ${data.dashboardUrl}

CafeFinder - Discover cafes worth visiting.`
      };
    case "CHANGE_REQUEST_REJECTED" /* CHANGE_REQUEST_REJECTED */:
      return {
        subject: "Update on your cafe change request",
        html: getBaseLayout(
          "Update Request Rejection",
          `
          <h2>Hello ${data.name},</h2>
          <p>We have reviewed your request to update <strong>${data.cafeName}</strong> (${data.changeType}).</p>
          <p>Unfortunately, we are unable to apply these changes at this time.</p>
          ${data.reason ? `<p style="padding: 16px; background-color: #f8f8f8; border-left: 4px solid #ddd;">${data.reason}</p>` : ""}
          `,
          data.dashboardUrl,
          "View Dashboard"
        ),
        text: `Hello ${data.name},

We have reviewed your request to update ${data.cafeName} (${data.changeType}). Unfortunately, we are unable to apply these changes at this time.

Reason: ${data.reason || "Not specified"}

View your dashboard: ${data.dashboardUrl}

CafeFinder - Discover cafes worth visiting.`
      };
    case "CAFE_PUBLISHED" /* CAFE_PUBLISHED */:
      return {
        subject: "Your cafe is now live!",
        html: getBaseLayout(
          "Cafe Published",
          `
          <h2>Congratulations, ${data.name}!</h2>
          <p>Your cafe, <strong>${data.cafeName}</strong>, is now published and visible to all users on CafeFinder.</p>
          <p>You can now share your profile with your customers and start collecting reviews.</p>
          `,
          data.cafeUrl,
          "View Public Profile"
        ),
        text: `Congratulations, ${data.name}!

Your cafe, ${data.cafeName}, is now live on CafeFinder. Share your profile and start collecting reviews!

View profile: ${data.cafeUrl}

CafeFinder - Discover cafes worth visiting.`
      };
    case "CAFE_SUSPENDED" /* CAFE_SUSPENDED */:
      return {
        subject: "Your cafe profile has been suspended",
        html: getBaseLayout(
          "Cafe Status Update",
          `
          <h2>Hello ${data.name},</h2>
          <p>We are writing to inform you that your cafe profile for <strong>${data.cafeName}</strong> has been suspended.</p>
          <p>While suspended, your profile will not be visible to public users.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
          <p>If you believe this is an error, please contact our support team.</p>
          `
        ),
        text: `Hello ${data.name},

Your cafe profile for ${data.cafeName} has been suspended. Reason: ${data.reason || "Not specified"}. If you believe this is an error, please contact support.

CafeFinder - Discover cafes worth visiting.`
      };
    default:
      return {
        subject: "Notification from CafeFinder",
        html: getBaseLayout("Notification", `<p>You have a new notification from CafeFinder.</p>`),
        text: "You have a new notification from CafeFinder."
      };
  }
};

// server/src/services/email/email.service.ts
var EmailService = class {
  constructor() {
    this.isEnabled = process.env.EMAIL_ENABLED === "true";
    this.fromName = process.env.EMAIL_FROM_NAME || "CafeFinder";
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || "noreply@cafefinder.com";
    this.replyTo = process.env.EMAIL_REPLY_TO;
    const PORT3 = process.env.PORT || 3e3;
    this.baseUrl = process.env.EMAIL_BASE_URL || process.env.APP_URL || `http://localhost:${PORT3}`;
    const providerType = process.env.EMAIL_PROVIDER || "console";
    if (providerType === "smtp" && this.isEnabled) {
      this.provider = new SmtpProvider();
    } else {
      this.provider = new ConsoleProvider();
    }
  }
  /**
   * Main method to queue a transactional email.
   * This saves the job to the database for asynchronous processing.
   */
  async queueEmail(template, toAddress, payload, userId) {
    if (!toAddress) {
      console.warn(`[EmailService]: No recipient address provided for template ${template}`);
      return null;
    }
    const { subject } = renderTemplate(template, payload);
    try {
      const job = await prisma.emailJob.create({
        data: {
          template,
          toAddress,
          subject,
          payload,
          userId,
          status: import_client3.EmailJobStatus.PENDING,
          availableAt: /* @__PURE__ */ new Date()
        }
      });
      if (this.isEnabled) {
        this.processJob(job.id).catch((err) => {
          console.error(`[EmailService]: Background job processing failed for ${job.id}:`, err);
        });
      }
      return job;
    } catch (error) {
      console.error("[EmailService]: Failed to queue email job:", error);
      return null;
    }
  }
  /**
   * Process a single email job.
   */
  async processJob(jobId) {
    const job = await prisma.emailJob.findUnique({
      where: { id: jobId }
    });
    if (!job || job.status === import_client3.EmailJobStatus.SENT || job.status === import_client3.EmailJobStatus.CANCELLED) {
      return;
    }
    await prisma.emailJob.update({
      where: { id: jobId },
      data: { status: import_client3.EmailJobStatus.PROCESSING }
    });
    try {
      const { html, text, subject } = renderTemplate(job.template, job.payload);
      const result = await this.provider.send({
        to: job.toAddress,
        subject: job.subject || subject,
        html,
        text,
        replyTo: this.replyTo,
        from: {
          name: this.fromName,
          address: this.fromAddress
        }
      });
      if (result.success) {
        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            status: import_client3.EmailJobStatus.SENT,
            sentAt: /* @__PURE__ */ new Date(),
            providerMessageId: result.providerMessageId,
            attempts: job.attempts + 1
          }
        });
      } else {
        const nextAttempt = /* @__PURE__ */ new Date();
        const delayMinutes = Math.pow(2, job.attempts + 1);
        nextAttempt.setMinutes(nextAttempt.getMinutes() + delayMinutes);
        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            status: job.attempts >= 5 ? import_client3.EmailJobStatus.FAILED : import_client3.EmailJobStatus.PENDING,
            attempts: job.attempts + 1,
            lastError: result.error,
            availableAt: nextAttempt
          }
        });
      }
    } catch (error) {
      console.error(`[EmailService]: Unexpected error processing job ${jobId}:`, error);
      await prisma.emailJob.update({
        where: { id: jobId },
        data: {
          status: import_client3.EmailJobStatus.FAILED,
          lastError: error.message || "Unexpected error",
          attempts: job.attempts + 1
        }
      });
    }
  }
  /**
   * Helper methods for specific workflows
   */
  async sendWelcomeEmail(user) {
    return this.queueEmail("WELCOME" /* WELCOME */, user.email, {
      name: user.name,
      exploreUrl: `${this.baseUrl}/cafes`
    }, user.id);
  }
  async sendCafeSubmissionApprovedEmail(user, cafe) {
    return this.queueEmail("CAFE_SUBMISSION_APPROVED" /* CAFE_SUBMISSION_APPROVED */, user.email, {
      name: user.name,
      cafeName: cafe.name,
      cafeUrl: `${this.baseUrl}/cafes/${cafe.slug}`
    }, user.id);
  }
  async sendCafeSubmissionRejectedEmail(user, cafeName, reason) {
    return this.queueEmail("CAFE_SUBMISSION_REJECTED" /* CAFE_SUBMISSION_REJECTED */, user.email, {
      name: user.name,
      cafeName,
      reason
    }, user.id);
  }
  async sendOwnerClaimApprovedEmail(user, cafeName) {
    return this.queueEmail("OWNER_CLAIM_APPROVED" /* OWNER_CLAIM_APPROVED */, user.email, {
      name: user.name,
      cafeName,
      dashboardUrl: `${this.baseUrl}/owner`
    }, user.id);
  }
  async sendOwnerClaimRejectedEmail(user, cafeName, reason) {
    return this.queueEmail("OWNER_CLAIM_REJECTED" /* OWNER_CLAIM_REJECTED */, user.email, {
      name: user.name,
      cafeName,
      reason
    }, user.id);
  }
  async sendReviewApprovedEmail(user, cafe) {
    return this.queueEmail("REVIEW_APPROVED" /* REVIEW_APPROVED */, user.email, {
      name: user.name,
      cafeName: cafe.name,
      cafeUrl: `${this.baseUrl}/cafes/${cafe.slug}`
    }, user.id);
  }
  async sendReviewRejectedEmail(user, cafeName, reason) {
    return this.queueEmail("REVIEW_REJECTED" /* REVIEW_REJECTED */, user.email, {
      name: user.name,
      cafeName,
      reason
    }, user.id);
  }
  async sendChangeRequestApprovedEmail(user, cafeName, changeType) {
    return this.queueEmail("CHANGE_REQUEST_APPROVED" /* CHANGE_REQUEST_APPROVED */, user.email, {
      name: user.name,
      cafeName,
      changeType,
      dashboardUrl: `${this.baseUrl}/owner`
    }, user.id);
  }
  async sendChangeRequestRejectedEmail(user, cafeName, changeType, reason) {
    return this.queueEmail("CHANGE_REQUEST_REJECTED" /* CHANGE_REQUEST_REJECTED */, user.email, {
      name: user.name,
      cafeName,
      changeType,
      reason,
      dashboardUrl: `${this.baseUrl}/owner`
    }, user.id);
  }
};
var emailService = new EmailService();

// server/src/controllers/authController.ts
var authService2 = new AuthService();
var registerSchema = import_zod4.z.object({
  name: import_zod4.z.string().min(1, "Name is required").max(100),
  email: import_zod4.z.string().email("Invalid email address"),
  password: import_zod4.z.string().min(8, "Password must be at least 8 characters").max(128)
});
var loginSchema = import_zod4.z.object({
  email: import_zod4.z.string().email("Invalid email address"),
  password: import_zod4.z.string().min(1, "Password is required")
});
var AuthController = class {
  async register(req, res, next) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { user, token } = await authService2.register(validatedData);
      res.cookie(COOKIE_NAME, token, getCookieOptions());
      emailService.sendWelcomeEmail({
        id: user.id,
        name: user.name,
        email: user.email
      }).catch((err) => console.error("[AuthController]: Failed to send welcome email:", err));
      res.status(201).json({
        success: true,
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }
  async login(req, res, next) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, token } = await authService2.login(validatedData);
      res.cookie(COOKIE_NAME, token, getCookieOptions());
      res.json({
        success: true,
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }
  async logout(req, res, next) {
    try {
      const token = extractToken(req);
      if (token) {
        await authService2.logout(token);
      }
      res.clearCookie(COOKIE_NAME, getCookieOptions());
      res.json({
        success: true,
        data: { message: "Logged out successfully" }
      });
    } catch (error) {
      next(error);
    }
  }
  async me(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: "Not authenticated" }
        });
      }
      const token = extractToken(req);
      res.json({
        success: true,
        data: { user: req.user, token: token || void 0 }
      });
    } catch (error) {
      next(error);
    }
  }
};

// server/src/routes/auth.routes.ts
var router3 = (0, import_express3.Router)();
var authController = new AuthController();
router3.post("/register", authRateLimit, authController.register);
router3.post("/login", authRateLimit, authController.login);
router3.post("/logout", authController.logout);
router3.get("/me", requireAuth, authController.me);
router3.get("/test-auth", requireAuth, (req, res) => {
  res.json({ success: true, message: "You are authenticated", user: req.user });
});
var auth_routes_default = router3;

// server/src/routes/list.routes.ts
var import_express4 = require("express");

// server/src/repositories/listRepository.ts
init_database();
var import_client4 = require("@prisma/client");
var CuratedListRepository = class {
  async findAll(filters = {}) {
    const { status, featured, search, limit = 12, offset = 0 } = filters;
    const where = {};
    if (status) where.status = status;
    if (featured !== void 0) where.featured = featured;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }
    const [lists, total] = await Promise.all([
      prisma.curatedList.findMany({
        where,
        include: {
          _count: {
            select: { cafes: true }
          }
        },
        take: limit,
        skip: offset,
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" }
        ]
      }),
      prisma.curatedList.count({ where })
    ]);
    return { lists, total };
  }
  async findBySlug(slug, publicOnly = true) {
    const where = { slug };
    if (publicOnly) where.status = import_client4.PostStatus.PUBLISHED;
    return prisma.curatedList.findUnique({
      where: { slug },
      include: {
        cafes: {
          where: publicOnly ? {
            cafe: { status: import_client4.CafeStatus.PUBLISHED }
          } : void 0,
          include: {
            cafe: {
              include: {
                photos: {
                  where: { isCover: true },
                  take: 1
                },
                amenities: {
                  include: { amenity: true }
                }
              }
            }
          },
          orderBy: { sortOrder: "asc" }
        }
      }
    });
  }
  async findById(id) {
    return prisma.curatedList.findUnique({
      where: { id },
      include: {
        cafes: {
          include: {
            cafe: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          },
          orderBy: { sortOrder: "asc" }
        }
      }
    });
  }
  async create(data) {
    return prisma.curatedList.create({
      data
    });
  }
  async update(id, data) {
    return prisma.curatedList.update({
      where: { id },
      data
    });
  }
  async delete(id) {
    return prisma.curatedList.deleteMany({
      where: { id }
    });
  }
  async addCafe(listId, cafeId, sortOrder = 0, editorialNote) {
    return prisma.curatedListCafe.create({
      data: {
        listId,
        cafeId,
        sortOrder,
        editorialNote
      }
    });
  }
  async removeCafe(listId, cafeId) {
    return prisma.curatedListCafe.deleteMany({
      where: {
        listId,
        cafeId
      }
    });
  }
  async updateCafeOrder(listId, cafeId, sortOrder, editorialNote) {
    return prisma.curatedListCafe.update({
      where: {
        listId_cafeId: {
          listId,
          cafeId
        }
      },
      data: {
        sortOrder,
        editorialNote
      }
    });
  }
};

// server/src/services/listService.ts
var import_client5 = require("@prisma/client");
init_editorialService();
var editorialService2 = new EditorialService();
var redirectService2 = new RedirectService();
var CuratedListService = class {
  constructor() {
    this.listRepository = new CuratedListRepository();
  }
  async getPublishedLists(filters = {}) {
    return this.listRepository.findAll({
      ...filters,
      status: import_client5.PostStatus.PUBLISHED
    });
  }
  async getListBySlug(slug, includeDrafts = false) {
    const list = await this.listRepository.findBySlug(slug, true);
    if (!list) return null;
    if (!includeDrafts && list.status !== import_client5.PostStatus.PUBLISHED) return null;
    return list;
  }
  // Admin Methods
  async getAdminLists(filters) {
    return this.listRepository.findAll(filters);
  }
  async getListById(id) {
    return this.listRepository.findById(id);
  }
  async createList(data) {
    const slug = generateSlug(data.title);
    let finalSlug = slug;
    let count = 1;
    while (await this.listRepository.findBySlug(finalSlug, false)) {
      finalSlug = `${slug}-${++count}`;
    }
    return this.listRepository.create({
      title: data.title,
      slug: finalSlug,
      description: data.description,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      featured: data.featured || false,
      status: data.status || import_client5.PostStatus.DRAFT,
      sortOrder: data.sortOrder || 0
    });
  }
  async updateList(id, data, authorId) {
    const list = await this.listRepository.findById(id);
    if (!list) throw new Error("List not found");
    const updateData = {
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      featured: data.featured,
      sortOrder: data.sortOrder,
      status: data.status,
      scheduledAt: data.scheduledAt,
      updatedAt: /* @__PURE__ */ new Date(),
      coverImageAsset: data.coverImageId ? { connect: { id: data.coverImageId } } : void 0
    };
    if (data.title && list.status === import_client5.PostStatus.DRAFT) {
      updateData.slug = generateSlug(data.title);
    } else if (data.slug && data.slug !== list.slug) {
      if (list.status === import_client5.PostStatus.PUBLISHED) {
        await redirectService2.createRedirect(`/lists/${list.slug}`, `/lists/${data.slug}`);
      }
      updateData.slug = data.slug;
    }
    const updatedList = await this.listRepository.update(id, updateData);
    await editorialService2.createRevision({
      entityType: "CuratedList",
      entityId: id,
      snapshot: updatedList,
      authorId
    });
    return updatedList;
  }
  async updateStatus(id, status) {
    return this.listRepository.update(id, { status });
  }
  async deleteList(id) {
    return this.listRepository.delete(id);
  }
  async addCafeToList(listId, cafeId, sortOrder = 0, editorialNote) {
    return this.listRepository.addCafe(listId, cafeId, sortOrder, editorialNote);
  }
  async removeCafeFromList(listId, cafeId) {
    return this.listRepository.removeCafe(listId, cafeId);
  }
  async updateCafeAssociation(listId, cafeId, sortOrder, editorialNote) {
    return this.listRepository.updateCafeOrder(listId, cafeId, sortOrder, editorialNote);
  }
};

// server/src/controllers/listController.ts
var import_zod5 = require("zod");
var import_client6 = require("@prisma/client");
var emptyToUndefined3 = (val) => val === "" || val === null ? void 0 : val;
var getListsQuerySchema = import_zod5.z.object({
  featured: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.string().optional().transform((v) => v === void 0 ? void 0 : v === "true")),
  limit: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.string().optional().transform((v) => v ? parseInt(v) : 12)),
  page: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.string().optional().transform((v) => v ? parseInt(v) : 1)),
  search: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.string().optional()),
  status: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.nativeEnum(import_client6.PostStatus).optional())
});
var curatedListSchema = import_zod5.z.object({
  title: import_zod5.z.string().min(2).max(200),
  description: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.string().max(1e3).optional()),
  coverImage: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.string().optional()),
  coverImageAlt: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.string().optional()),
  featured: import_zod5.z.boolean().optional(),
  sortOrder: import_zod5.z.number().int().optional(),
  status: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.nativeEnum(import_client6.PostStatus).optional())
});
var listCafeSchema = import_zod5.z.object({
  cafeId: import_zod5.z.string(),
  sortOrder: import_zod5.z.number().int().optional(),
  editorialNote: import_zod5.z.preprocess(emptyToUndefined3, import_zod5.z.string().max(1e3).optional())
});
var CuratedListController = class {
  constructor() {
    this.getAll = async (req, res, next) => {
      try {
        const validatedQuery = getListsQuerySchema.parse(req.query);
        const limit = validatedQuery.limit || 12;
        const offset = ((validatedQuery.page || 1) - 1) * limit;
        const { lists, total } = await this.listService.getPublishedLists({
          ...validatedQuery,
          limit,
          offset
        });
        res.json({
          success: true,
          data: {
            lists,
            pagination: {
              total,
              page: validatedQuery.page || 1,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          }
        });
      } catch (error) {
        next(error);
      }
    };
    this.getBySlug = async (req, res, next) => {
      try {
        const { slug } = req.params;
        const list = await this.listService.getListBySlug(slug);
        if (!list) {
          return res.status(404).json({
            success: false,
            error: { message: "List not found or not published" }
          });
        }
        res.json({
          success: true,
          data: list
        });
      } catch (error) {
        next(error);
      }
    };
    // Admin Methods
    this.getAdminLists = async (req, res, next) => {
      try {
        const validatedQuery = getListsQuerySchema.parse(req.query);
        const limit = validatedQuery.limit || 20;
        const offset = ((validatedQuery.page || 1) - 1) * limit;
        const { lists, total } = await this.listService.getAdminLists({
          ...validatedQuery,
          limit,
          offset
        });
        res.json({
          success: true,
          data: {
            lists,
            pagination: {
              total,
              page: validatedQuery.page || 1,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          }
        });
      } catch (error) {
        next(error);
      }
    };
    this.getById = async (req, res, next) => {
      try {
        const { id } = req.params;
        const list = await this.listService.getListById(id);
        if (!list) {
          return res.status(404).json({
            success: false,
            error: { message: "List not found" }
          });
        }
        res.json({
          success: true,
          data: list
        });
      } catch (error) {
        next(error);
      }
    };
    this.create = async (req, res, next) => {
      try {
        const validatedData = curatedListSchema.parse(req.body);
        const list = await this.listService.createList(validatedData);
        res.status(201).json({
          success: true,
          data: list
        });
      } catch (error) {
        next(error);
      }
    };
    this.update = async (req, res, next) => {
      try {
        const { id } = req.params;
        const validatedData = curatedListSchema.partial().parse(req.body);
        const list = await this.listService.updateList(id, validatedData, req.user.id);
        res.json({
          success: true,
          data: list
        });
      } catch (error) {
        next(error);
      }
    };
    this.updateStatus = async (req, res, next) => {
      try {
        const { id } = req.params;
        const { status } = import_zod5.z.object({ status: import_zod5.z.nativeEnum(import_client6.PostStatus) }).parse(req.body);
        const list = await this.listService.updateStatus(id, status);
        res.json({
          success: true,
          data: list
        });
      } catch (error) {
        next(error);
      }
    };
    this.delete = async (req, res, next) => {
      try {
        const { id } = req.params;
        await this.listService.deleteList(id);
        res.json({
          success: true,
          message: "List deleted successfully"
        });
      } catch (error) {
        next(error);
      }
    };
    // List Cafe Associations
    this.addCafe = async (req, res, next) => {
      try {
        const { id: listId } = req.params;
        const validatedData = listCafeSchema.parse(req.body);
        const association = await this.listService.addCafeToList(
          listId,
          validatedData.cafeId,
          validatedData.sortOrder,
          validatedData.editorialNote
        );
        res.status(201).json({
          success: true,
          data: association
        });
      } catch (error) {
        next(error);
      }
    };
    this.removeCafe = async (req, res, next) => {
      try {
        const { id: listId, cafeId } = req.params;
        await this.listService.removeCafeFromList(listId, cafeId);
        res.json({
          success: true,
          message: "Cafe removed from list"
        });
      } catch (error) {
        next(error);
      }
    };
    this.updateCafe = async (req, res, next) => {
      try {
        const { id: listId, cafeId } = req.params;
        const { sortOrder, editorialNote } = listCafeSchema.partial().parse(req.body);
        const association = await this.listService.updateCafeAssociation(
          listId,
          cafeId,
          sortOrder || 0,
          editorialNote
        );
        res.json({
          success: true,
          data: association
        });
      } catch (error) {
        next(error);
      }
    };
    this.listService = new CuratedListService();
  }
};

// server/src/routes/list.routes.ts
var router4 = (0, import_express4.Router)();
var listController = new CuratedListController();
router4.get("/", listController.getAll);
router4.get("/:slug", listController.getBySlug);
var list_routes_default = router4;

// server/src/routes/testimonial.routes.ts
var import_express5 = require("express");

// server/src/repositories/testimonialRepository.ts
init_database();
var import_client7 = require("@prisma/client");
var TestimonialRepository = class {
  async findActive(limit = 10) {
    const safeLimit = Math.max(limit, 1);
    return prisma.testimonial.findMany({
      where: { status: import_client7.TestimonialStatus.PUBLISHED },
      take: safeLimit,
      orderBy: { createdAt: "desc" }
    });
  }
  async findAll() {
    return prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" }
    });
  }
  async findById(id) {
    return prisma.testimonial.findUnique({
      where: { id }
    });
  }
  async create(data) {
    return prisma.testimonial.create({
      data: {
        ...data,
        status: data.status || import_client7.TestimonialStatus.DRAFT
      }
    });
  }
  async update(id, data) {
    return prisma.testimonial.update({
      where: { id },
      data
    });
  }
  async delete(id) {
    return prisma.testimonial.delete({
      where: { id }
    });
  }
};

// server/src/services/testimonialService.ts
var TestimonialService = class {
  constructor() {
    this.testimonialRepository = new TestimonialRepository();
  }
  async getActiveTestimonials(limit) {
    return this.testimonialRepository.findActive(limit);
  }
  async getAllTestimonials() {
    return this.testimonialRepository.findAll();
  }
  async getTestimonialById(id) {
    return this.testimonialRepository.findById(id);
  }
  async createTestimonial(data) {
    return this.testimonialRepository.create(data);
  }
  async updateTestimonial(id, data) {
    return this.testimonialRepository.update(id, data);
  }
  async deleteTestimonial(id) {
    return this.testimonialRepository.delete(id);
  }
};

// server/src/controllers/testimonialController.ts
var import_zod6 = require("zod");
var import_client8 = require("@prisma/client");
var emptyToUndefined4 = (val) => val === "" ? void 0 : val;
var getTestimonialsQuerySchema = import_zod6.z.object({
  limit: import_zod6.z.preprocess(emptyToUndefined4, import_zod6.z.string().optional().transform((v) => v ? parseInt(v) : void 0))
});
var testimonialSchema = import_zod6.z.object({
  name: import_zod6.z.string().min(1, "Name is required").max(100),
  role: import_zod6.z.preprocess(emptyToUndefined4, import_zod6.z.string().max(100).optional().nullable()),
  avatarUrl: import_zod6.z.preprocess(emptyToUndefined4, import_zod6.z.string().optional().nullable()),
  content: import_zod6.z.string().min(1, "Content is required"),
  rating: import_zod6.z.preprocess((val) => val !== void 0 && val !== null ? parseInt(String(val), 10) : 5, import_zod6.z.number().int().min(1).max(5)),
  status: import_zod6.z.preprocess(emptyToUndefined4, import_zod6.z.nativeEnum(import_client8.TestimonialStatus).optional().default(import_client8.TestimonialStatus.PUBLISHED))
});
var TestimonialController = class {
  constructor() {
    this.getAll = async (req, res, next) => {
      try {
        const validatedQuery = getTestimonialsQuerySchema.parse(req.query);
        const data = await this.testimonialService.getActiveTestimonials(validatedQuery.limit);
        res.json({
          success: true,
          data
        });
      } catch (error) {
        next(error);
      }
    };
    this.list = async (req, res, next) => {
      try {
        const data = await this.testimonialService.getAllTestimonials();
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    };
    this.getById = async (req, res, next) => {
      try {
        const data = await this.testimonialService.getTestimonialById(req.params.id);
        if (!data) return res.status(404).json({ success: false, message: "Testimonial not found" });
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    };
    this.create = async (req, res, next) => {
      try {
        const validated = testimonialSchema.parse(req.body);
        const data = await this.testimonialService.createTestimonial(validated);
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    };
    this.update = async (req, res, next) => {
      try {
        const validated = testimonialSchema.partial().parse(req.body);
        const data = await this.testimonialService.updateTestimonial(req.params.id, validated);
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    };
    this.delete = async (req, res, next) => {
      try {
        await this.testimonialService.deleteTestimonial(req.params.id);
        res.json({ success: true, message: "Testimonial deleted" });
      } catch (error) {
        next(error);
      }
    };
    this.testimonialService = new TestimonialService();
  }
};

// server/src/routes/testimonial.routes.ts
var router5 = (0, import_express5.Router)();
var testimonialController = new TestimonialController();
router5.get("/", testimonialController.getAll);
var testimonial_routes_default = router5;

// server/src/routes/blog.routes.ts
var import_express6 = require("express");

// server/src/repositories/blogRepository.ts
init_database();
var BlogPostRepository = class {
  async findAll(filters = {}) {
    const { status, category, search, limit = 12, offset = 0, excludeId } = filters;
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (excludeId) where.id = { not: excludeId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } }
      ];
    }
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        },
        take: limit,
        skip: offset,
        orderBy: { publishedAt: "desc" }
      }),
      prisma.blogPost.count({ where })
    ]);
    return { posts, total };
  }
  async findBySlug(slug) {
    return prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async findById(id) {
    return prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async create(data) {
    return prisma.blogPost.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async update(id, data) {
    return prisma.blogPost.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async delete(id) {
    return prisma.blogPost.deleteMany({
      where: { id }
    });
  }
};

// server/src/services/blogService.ts
var import_client9 = require("@prisma/client");
init_editorialService();
var editorialService3 = new EditorialService();
var redirectService3 = new RedirectService();
var BlogPostService = class {
  constructor() {
    this.blogRepository = new BlogPostRepository();
  }
  calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }
  sanitizePostContent(content) {
    return sanitizeContent(content);
  }
  async getPublishedPosts(filters = {}) {
    const { posts, total } = await this.blogRepository.findAll({
      ...filters,
      status: import_client9.PostStatus.PUBLISHED
    });
    return {
      posts: posts.map((post) => ({
        ...post,
        readingTime: this.calculateReadingTime(post.content)
      })),
      total
    };
  }
  async getPostBySlug(slug, isAdmin = false) {
    const post = await this.blogRepository.findBySlug(slug);
    if (!post) return null;
    if (!isAdmin && post.status !== import_client9.PostStatus.PUBLISHED) return null;
    return {
      ...post,
      readingTime: this.calculateReadingTime(post.content)
    };
  }
  async getRelatedPosts(slug, category, limit = 3) {
    const currentPost = await this.blogRepository.findBySlug(slug);
    if (!currentPost) return [];
    const { posts } = await this.blogRepository.findAll({
      status: import_client9.PostStatus.PUBLISHED,
      category: category || currentPost.category || void 0,
      limit,
      excludeId: currentPost.id
    });
    return posts.map((post) => ({
      ...post,
      readingTime: this.calculateReadingTime(post.content)
    }));
  }
  // Admin Methods
  async getAdminPosts(filters) {
    return this.blogRepository.findAll(filters);
  }
  async getPostById(id) {
    return this.blogRepository.findById(id);
  }
  async createPost(data, authorId) {
    const slug = generateSlug(data.title);
    let finalSlug = slug;
    let count = 1;
    while (await this.blogRepository.findBySlug(finalSlug)) {
      finalSlug = `${slug}-${++count}`;
    }
    const sanitizedContent = this.sanitizePostContent(data.content);
    const status = data.status || import_client9.PostStatus.DRAFT;
    const publishedAt = status === import_client9.PostStatus.PUBLISHED ? /* @__PURE__ */ new Date() : null;
    const scheduledAt = status === import_client9.PostStatus.SCHEDULED && data.scheduledAt ? new Date(data.scheduledAt) : data.scheduledAt ? new Date(data.scheduledAt) : null;
    const post = await this.blogRepository.create({
      title: data.title,
      slug: finalSlug,
      excerpt: data.excerpt,
      content: sanitizedContent,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      category: data.category,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      author: { connect: { id: authorId } },
      status,
      publishedAt,
      scheduledAt
    });
    await editorialService3.createRevision({
      entityType: "BlogPost",
      entityId: post.id,
      snapshot: post,
      authorId
    });
    return post;
  }
  async updatePost(id, data, authorId) {
    const post = await this.blogRepository.findById(id);
    if (!post) throw new Error("Post not found");
    const status = data.status !== void 0 ? data.status : void 0;
    let scheduledAt = void 0;
    if (data.scheduledAt !== void 0) {
      scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }
    const updateData = {
      title: data.title,
      excerpt: data.excerpt,
      content: data.content ? this.sanitizePostContent(data.content) : void 0,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      category: data.category,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      status: status !== void 0 ? status : void 0,
      scheduledAt: scheduledAt !== void 0 ? scheduledAt : void 0,
      updatedAt: /* @__PURE__ */ new Date(),
      coverImageAsset: data.coverImageId ? { connect: { id: data.coverImageId } } : void 0
    };
    if (status === import_client9.PostStatus.PUBLISHED && !post.publishedAt) {
      updateData.publishedAt = /* @__PURE__ */ new Date();
    }
    if (data.title && post.status === import_client9.PostStatus.DRAFT) {
      updateData.slug = generateSlug(data.title);
    } else if (data.slug && data.slug !== post.slug) {
      if (post.status === import_client9.PostStatus.PUBLISHED) {
        await redirectService3.createRedirect(`/blog/${post.slug}`, `/blog/${data.slug}`);
      }
      updateData.slug = data.slug;
    }
    const updatedPost = await this.blogRepository.update(id, updateData);
    await editorialService3.createRevision({
      entityType: "BlogPost",
      entityId: id,
      snapshot: updatedPost,
      authorId
    });
    return updatedPost;
  }
  async updateStatus(id, status, authorId) {
    const post = await this.blogRepository.findById(id);
    if (!post) throw new Error("Post not found");
    const data = { status };
    if (status === import_client9.PostStatus.PUBLISHED && !post.publishedAt) {
      data.publishedAt = /* @__PURE__ */ new Date();
    }
    const updated = await this.blogRepository.update(id, data);
    await editorialService3.createRevision({
      entityType: "BlogPost",
      entityId: id,
      snapshot: updated,
      authorId
    });
    return updated;
  }
  async deletePost(id) {
    return this.blogRepository.delete(id);
  }
};

// server/src/controllers/blogController.ts
var import_zod7 = require("zod");
var import_client10 = require("@prisma/client");
var emptyToUndefined5 = (val) => val === "" || val === null ? void 0 : val;
var parseDateOrNull = (val) => {
  if (val === void 0) return void 0;
  if (val === "" || val === null) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};
var getBlogQuerySchema = import_zod7.z.object({
  limit: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().optional().transform((v) => v ? parseInt(v) : 12)),
  page: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().optional().transform((v) => v ? parseInt(v) : 1)),
  search: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().optional()),
  category: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().optional()),
  status: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.nativeEnum(import_client10.PostStatus).optional())
});
var blogPostSchema = import_zod7.z.object({
  title: import_zod7.z.string().min(2, "Title must be at least 2 characters").max(200),
  excerpt: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().max(500).optional()),
  content: import_zod7.z.string().min(10, "Content must be at least 10 characters"),
  coverImage: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().optional()),
  coverImageAlt: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().optional()),
  category: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().max(100).optional()),
  metaTitle: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().max(70).optional()),
  metaDescription: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().max(160).optional()),
  canonicalUrl: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.string().optional()),
  status: import_zod7.z.preprocess(emptyToUndefined5, import_zod7.z.nativeEnum(import_client10.PostStatus).optional()),
  scheduledAt: import_zod7.z.preprocess(parseDateOrNull, import_zod7.z.date().nullable().optional())
});
var BlogPostController = class {
  constructor() {
    this.getAll = async (req, res, next) => {
      try {
        const validatedQuery = getBlogQuerySchema.parse(req.query);
        const limit = validatedQuery.limit || 12;
        const offset = ((validatedQuery.page || 1) - 1) * limit;
        const { posts, total } = await this.blogService.getPublishedPosts({
          limit,
          offset,
          search: validatedQuery.search,
          category: validatedQuery.category
        });
        res.json({
          success: true,
          data: {
            posts,
            pagination: {
              total,
              page: validatedQuery.page || 1,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          }
        });
      } catch (error) {
        next(error);
      }
    };
    this.getBySlug = async (req, res, next) => {
      try {
        const { slug } = req.params;
        const isAdmin = req.user?.role === "ADMIN";
        const post = await this.blogService.getPostBySlug(slug, isAdmin);
        if (!post) {
          return res.status(404).json({
            success: false,
            error: { message: "Blog post not found or not published" }
          });
        }
        const relatedPosts = await this.blogService.getRelatedPosts(slug, post.category || void 0);
        res.json({
          success: true,
          data: {
            post,
            relatedPosts
          }
        });
      } catch (error) {
        next(error);
      }
    };
    // Admin Methods
    this.getAdminPosts = async (req, res, next) => {
      try {
        const validatedQuery = getBlogQuerySchema.parse(req.query);
        const limit = validatedQuery.limit || 20;
        const offset = ((validatedQuery.page || 1) - 1) * limit;
        const { posts, total } = await this.blogService.getAdminPosts({
          ...validatedQuery,
          limit,
          offset
        });
        res.json({
          success: true,
          data: {
            posts,
            pagination: {
              total,
              page: validatedQuery.page || 1,
              limit,
              totalPages: Math.ceil(total / limit)
            }
          }
        });
      } catch (error) {
        next(error);
      }
    };
    this.getById = async (req, res, next) => {
      try {
        const { id } = req.params;
        const post = await this.blogService.getPostById(id);
        if (!post) {
          return res.status(404).json({
            success: false,
            error: { message: "Blog post not found" }
          });
        }
        res.json({
          success: true,
          data: post
        });
      } catch (error) {
        next(error);
      }
    };
    this.create = async (req, res, next) => {
      try {
        const validatedData = blogPostSchema.parse(req.body);
        const post = await this.blogService.createPost(validatedData, req.user.id);
        res.status(201).json({
          success: true,
          data: post
        });
      } catch (error) {
        next(error);
      }
    };
    this.update = async (req, res, next) => {
      try {
        const { id } = req.params;
        const validatedData = blogPostSchema.partial().parse(req.body);
        const post = await this.blogService.updatePost(id, validatedData, req.user.id);
        res.json({
          success: true,
          data: post
        });
      } catch (error) {
        next(error);
      }
    };
    this.updateStatus = async (req, res, next) => {
      try {
        const { id } = req.params;
        const { status } = import_zod7.z.object({ status: import_zod7.z.nativeEnum(import_client10.PostStatus) }).parse(req.body);
        const post = await this.blogService.updateStatus(id, status, req.user?.id);
        res.json({
          success: true,
          data: post
        });
      } catch (error) {
        next(error);
      }
    };
    this.delete = async (req, res, next) => {
      try {
        const { id } = req.params;
        await this.blogService.deletePost(id);
        res.json({
          success: true,
          message: "Blog post deleted successfully"
        });
      } catch (error) {
        next(error);
      }
    };
    this.blogService = new BlogPostService();
  }
};

// server/src/routes/blog.routes.ts
var router6 = (0, import_express6.Router)();
var blogController = new BlogPostController();
router6.get("/", blogController.getAll);
router6.get("/:slug", blogController.getBySlug);
var blog_routes_default = router6;

// server/src/routes/review.routes.ts
var import_express7 = require("express");

// server/src/repositories/reviewRepository.ts
init_database();
var ReviewRepository = class {
  async findAll(filters) {
    const { cafeId, userId, status, page = 1, limit = 10 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = {};
    if (cafeId) where.cafeId = cafeId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      prisma.cafeReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          photos: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit
      }),
      prisma.cafeReview.count({ where })
    ]);
    return { data, total };
  }
  async findById(id) {
    return prisma.cafeReview.findUnique({
      where: { id },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async findByUserAndCafe(userId, cafeId) {
    return prisma.cafeReview.findUnique({
      where: {
        cafeId_userId: {
          cafeId,
          userId
        }
      },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async create(data) {
    return prisma.cafeReview.create({
      data,
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async update(id, data) {
    return prisma.cafeReview.update({
      where: { id },
      data,
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async delete(id) {
    return prisma.cafeReview.deleteMany({
      where: { id }
    });
  }
  async getAggregates(cafeId) {
    const reviews = await prisma.cafeReview.findMany({
      where: {
        cafeId,
        status: "APPROVED"
      },
      select: {
        overallRating: true,
        coffeeRating: true,
        ambianceRating: true,
        serviceRating: true
      }
    });
    if (reviews.length === 0) {
      return {
        ratingAverage: 0,
        reviewCount: 0,
        coffeeAverage: 0,
        ambianceAverage: 0,
        serviceAverage: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      };
    }
    const count = reviews.length;
    const sums = reviews.reduce(
      (acc, r) => {
        acc.overall += r.overallRating;
        acc.coffee += r.coffeeRating || 0;
        acc.ambiance += r.ambianceRating || 0;
        acc.service += r.serviceRating || 0;
        acc.dist[r.overallRating] = (acc.dist[r.overallRating] || 0) + 1;
        return acc;
      },
      {
        overall: 0,
        coffee: 0,
        ambiance: 0,
        service: 0,
        dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    );
    return {
      ratingAverage: parseFloat((sums.overall / count).toFixed(1)),
      reviewCount: count,
      coffeeAverage: parseFloat((sums.coffee / count).toFixed(1)),
      ambianceAverage: parseFloat((sums.ambiance / count).toFixed(1)),
      serviceAverage: parseFloat((sums.service / count).toFixed(1)),
      distribution: sums.dist
    };
  }
  async addPhoto(reviewId, data) {
    return prisma.cafeReviewPhoto.create({
      data: {
        reviewId,
        ...data
      }
    });
  }
  async deletePhoto(photoId) {
    return prisma.cafeReviewPhoto.deleteMany({
      where: { id: photoId }
    });
  }
  async getPhotoById(photoId) {
    return prisma.cafeReviewPhoto.findUnique({
      where: { id: photoId }
    });
  }
};

// server/src/services/reviewService.ts
var import_client11 = require("@prisma/client");
init_database();
var ReviewService = class {
  constructor() {
    this.reviewRepository = new ReviewRepository();
    this.cafeRepository = new CafeRepository();
  }
  async getCafeReviews(cafeId, filters) {
    return this.reviewRepository.findAll({
      ...filters,
      cafeId,
      status: import_client11.ReviewStatus.APPROVED
    });
  }
  async getReviewById(id) {
    return this.reviewRepository.findById(id);
  }
  async getUserReviewForCafe(userId, cafeId) {
    return this.reviewRepository.findByUserAndCafe(userId, cafeId);
  }
  async createReview(userId, cafeId, data) {
    const existing = await this.reviewRepository.findByUserAndCafe(userId, cafeId);
    if (existing) {
      throw new Error("You have already reviewed this cafe");
    }
    const cafe = await this.cafeRepository.findById(cafeId);
    if (!cafe || cafe.status !== import_client11.CafeStatus.PUBLISHED) {
      throw new Error("Cafe not found or not published");
    }
    const review = await this.reviewRepository.create({
      user: { connect: { id: userId } },
      cafe: { connect: { id: cafeId } },
      coffeeRating: data.coffeeRating,
      ambianceRating: data.ambianceRating,
      serviceRating: data.serviceRating,
      overallRating: data.overallRating,
      comment: sanitizePlain(data.comment),
      status: import_client11.ReviewStatus.PENDING
      // Reviews are pending by default
    });
    return review;
  }
  async updateReview(userId, reviewId, data) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }
    if (review.userId !== userId) {
      throw new Error("Not authorized to update this review");
    }
    const updatedReview = await this.reviewRepository.update(reviewId, {
      coffeeRating: data.coffeeRating,
      ambianceRating: data.ambianceRating,
      serviceRating: data.serviceRating,
      overallRating: data.overallRating,
      comment: sanitizePlain(data.comment),
      status: import_client11.ReviewStatus.PENDING
      // Set back to pending after edit
    });
    if (review.status === import_client11.ReviewStatus.APPROVED) {
      await this.recalculateCafeRatings(review.cafeId);
    }
    return updatedReview;
  }
  async deleteReview(userId, reviewId, isAdmin = false) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }
    if (review.userId !== userId && !isAdmin) {
      throw new Error("Not authorized to delete this review");
    }
    await this.reviewRepository.delete(reviewId);
    if (review.status === import_client11.ReviewStatus.APPROVED) {
      await this.recalculateCafeRatings(review.cafeId);
    }
    return true;
  }
  async updateReviewStatus(reviewId, status) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }
    const updated = await this.reviewRepository.update(reviewId, { status });
    await this.recalculateCafeRatings(review.cafeId);
    const user = await prisma.user.findUnique({ where: { id: review.userId } });
    const cafe = await prisma.cafe.findUnique({ where: { id: review.cafeId } });
    if (user && cafe) {
      if (status === import_client11.ReviewStatus.APPROVED) {
        emailService.sendReviewApprovedEmail(
          { id: user.id, name: user.name, email: user.email },
          { name: cafe.name, slug: cafe.slug }
        ).catch((err) => console.error("[ReviewService]: Failed to send review approved email:", err));
      } else if (status === import_client11.ReviewStatus.REJECTED) {
        emailService.sendReviewRejectedEmail(
          { id: user.id, name: user.name, email: user.email },
          cafe.name
        ).catch((err) => console.error("[ReviewService]: Failed to send review rejected email:", err));
      } else if (status === import_client11.ReviewStatus.HIDDEN) {
        emailService.queueEmail("REVIEW_HIDDEN", user.email, {
          name: user.name,
          cafeName: cafe.name
        }, user.id).catch((err) => console.error("[ReviewService]: Failed to send review hidden email:", err));
      }
    }
    return updated;
  }
  async recalculateCafeRatings(cafeId) {
    const aggregates = await this.reviewRepository.getAggregates(cafeId);
    await this.cafeRepository.update(cafeId, {
      ratingAverage: aggregates.ratingAverage,
      reviewCount: aggregates.reviewCount
    });
    return aggregates;
  }
  async getCafeRatingStats(cafeId) {
    return this.reviewRepository.getAggregates(cafeId);
  }
  async addReviewPhoto(userId, reviewId, url, caption) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error("Review not found");
    }
    if (review.userId !== userId) {
      throw new Error("Not authorized to add photos to this review");
    }
    const photoCount = review.photos.length;
    if (photoCount >= 5) {
      throw new Error("Maximum of 5 photos per review");
    }
    return this.reviewRepository.addPhoto(reviewId, { url, caption });
  }
  async deleteReviewPhoto(userId, photoId, isAdmin = false) {
    const photo = await this.reviewRepository.getPhotoById(photoId);
    if (!photo) {
      throw new Error("Photo not found");
    }
    const review = await this.reviewRepository.findById(photo.reviewId);
    if (!review) {
      await this.reviewRepository.deletePhoto(photoId);
      return true;
    }
    if (review.userId !== userId && !isAdmin) {
      throw new Error("Not authorized to delete this photo");
    }
    await this.reviewRepository.deletePhoto(photoId);
    return true;
  }
};

// server/src/controllers/reviewController.ts
var import_zod8 = require("zod");

// server/src/dtos/reviewDto.ts
var mapToReviewDto = (review) => {
  return {
    id: review.id,
    reviewer: {
      id: review.user.id,
      name: review.user.name,
      avatarUrl: review.user.avatarUrl
    },
    coffeeRating: review.coffeeRating || 0,
    ambianceRating: review.ambianceRating || 0,
    serviceRating: review.serviceRating || 0,
    overallRating: review.overallRating,
    comment: review.comment,
    status: review.status,
    photos: review.photos.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption
    })),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt
  };
};

// server/src/controllers/reviewController.ts
var reviewSchema = import_zod8.z.object({
  coffeeRating: import_zod8.z.number().int().min(1).max(5),
  ambianceRating: import_zod8.z.number().int().min(1).max(5),
  serviceRating: import_zod8.z.number().int().min(1).max(5),
  overallRating: import_zod8.z.number().int().min(1).max(5),
  comment: import_zod8.z.string().trim().min(5).max(2e3)
});
var updateReviewStatusSchema = import_zod8.z.object({
  status: import_zod8.z.enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"])
});
var ReviewController = class {
  constructor() {
    this.getCafeReviews = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const parsedPage = req.query.page ? parseInt(req.query.page) : 1;
        const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        const parsedLimit = req.query.limit ? parseInt(req.query.limit) : 10;
        const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 100);
        const result = await this.reviewService.getCafeReviews(cafeId, { page, limit });
        res.json({
          success: true,
          data: result.data.map(mapToReviewDto),
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        });
      } catch (error) {
        next(error);
      }
    };
    this.getCafeRatingStats = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const stats = await this.reviewService.getCafeRatingStats(cafeId);
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        next(error);
      }
    };
    this.getUserReviewForCafe = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
          return res.json({ success: true, data: null });
        }
        const review = await this.reviewService.getUserReviewForCafe(userId, cafeId);
        res.json({
          success: true,
          data: review ? mapToReviewDto(review) : null
        });
      } catch (error) {
        next(error);
      }
    };
    this.getMyReviews = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const parsedPage = req.query.page ? parseInt(req.query.page) : 1;
        const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
        const parsedLimit = req.query.limit ? parseInt(req.query.limit) : 10;
        const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 50);
        const sort = req.query.sort || "newest";
        const filters = {
          userId,
          page,
          limit
        };
        if (sort === "oldest") filters.orderBy = { createdAt: "asc" };
        if (sort === "highest-rated") filters.orderBy = { overallRating: "desc" };
        if (sort === "lowest-rated") filters.orderBy = { overallRating: "asc" };
        const result = await this.reviewService.getCafeReviews(void 0, filters);
        res.json({
          success: true,
          data: result.data.map(mapToReviewDto),
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit)
          }
        });
      } catch (error) {
        next(error);
      }
    };
    this.create = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const userId = req.user.id;
        const validatedData = reviewSchema.parse(req.body);
        const review = await this.reviewService.createReview(userId, cafeId, validatedData);
        res.status(201).json({
          success: true,
          data: mapToReviewDto(review)
        });
      } catch (error) {
        if (error instanceof import_zod8.z.ZodError) {
          return res.status(400).json({ success: false, error: { message: "Validation failed", details: error.issues } });
        }
        next(error);
      }
    };
    this.update = async (req, res, next) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;
        const validatedData = reviewSchema.parse(req.body);
        const review = await this.reviewService.updateReview(userId, id, validatedData);
        res.json({
          success: true,
          data: mapToReviewDto(review)
        });
      } catch (error) {
        if (error instanceof import_zod8.z.ZodError) {
          return res.status(400).json({ success: false, error: { message: "Validation failed", details: error.issues } });
        }
        next(error);
      }
    };
    this.delete = async (req, res, next) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === "ADMIN";
        await this.reviewService.deleteReview(userId, id, isAdmin);
        res.json({
          success: true,
          message: "Review deleted successfully"
        });
      } catch (error) {
        next(error);
      }
    };
    this.updateStatus = async (req, res, next) => {
      try {
        const { id } = req.params;
        const { status } = updateReviewStatusSchema.parse(req.body);
        const review = await this.reviewService.updateReviewStatus(id, status);
        res.json({
          success: true,
          data: mapToReviewDto(review)
        });
      } catch (error) {
        if (error instanceof import_zod8.z.ZodError) {
          return res.status(400).json({ success: false, error: { message: "Validation failed", details: error.issues } });
        }
        next(error);
      }
    };
    this.uploadPhoto = async (req, res, next) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;
        if (!req.file) {
          return res.status(400).json({ success: false, error: { message: "No file uploaded" } });
        }
        const photoUrl = `/uploads/reviews/${req.file.filename}`;
        const photo = await this.reviewService.addReviewPhoto(userId, id, photoUrl);
        res.json({
          success: true,
          data: photo
        });
      } catch (error) {
        next(error);
      }
    };
    this.deletePhoto = async (req, res, next) => {
      try {
        const { id, photoId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === "ADMIN";
        await this.reviewService.deleteReviewPhoto(userId, photoId, isAdmin);
        res.json({
          success: true,
          message: "Photo deleted successfully"
        });
      } catch (error) {
        next(error);
      }
    };
    this.reviewService = new ReviewService();
  }
};

// server/src/middleware/uploadMiddleware.ts
var import_multer = __toESM(require("multer"), 1);
var import_path7 = __toESM(require("path"), 1);

// server/src/config/upload.ts
var import_path6 = __toESM(require("path"), 1);
var import_fs6 = __toESM(require("fs"), 1);
var UPLOAD_DIR = import_path6.default.join(process.cwd(), "uploads");
var REVIEW_UPLOAD_DIR = import_path6.default.join(UPLOAD_DIR, "reviews");
var SUBMISSION_UPLOAD_DIR = import_path6.default.join(UPLOAD_DIR, "submissions");
var OWNER_UPLOAD_DIR = import_path6.default.join(UPLOAD_DIR, "cafes");
var AVATAR_UPLOAD_DIR = import_path6.default.join(UPLOAD_DIR, "avatars");
if (!import_fs6.default.existsSync(UPLOAD_DIR)) {
  import_fs6.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!import_fs6.default.existsSync(REVIEW_UPLOAD_DIR)) {
  import_fs6.default.mkdirSync(REVIEW_UPLOAD_DIR, { recursive: true });
}
if (!import_fs6.default.existsSync(SUBMISSION_UPLOAD_DIR)) {
  import_fs6.default.mkdirSync(SUBMISSION_UPLOAD_DIR, { recursive: true });
}
if (!import_fs6.default.existsSync(OWNER_UPLOAD_DIR)) {
  import_fs6.default.mkdirSync(OWNER_UPLOAD_DIR, { recursive: true });
}
if (!import_fs6.default.existsSync(AVATAR_UPLOAD_DIR)) {
  import_fs6.default.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// server/src/middleware/uploadMiddleware.ts
var import_crypto3 = __toESM(require("crypto"), 1);
var reviewStorage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, REVIEW_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = import_crypto3.default.randomBytes(8).toString("hex");
    const ext = import_path7.default.extname(file.originalname);
    cb(null, `review-${uniqueSuffix}${ext}`);
  }
});
var submissionStorage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SUBMISSION_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = import_crypto3.default.randomBytes(8).toString("hex");
    const ext = import_path7.default.extname(file.originalname);
    cb(null, `submission-${uniqueSuffix}${ext}`);
  }
});
var ownerStorage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => cb(null, OWNER_UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `cafe-${import_crypto3.default.randomBytes(8).toString("hex")}${import_path7.default.extname(file.originalname).toLowerCase()}`)
});
var avatarStorage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const userId = req.user?.id || "unknown";
    cb(null, `avatar-${userId}-${import_crypto3.default.randomBytes(4).toString("hex")}${import_path7.default.extname(file.originalname).toLowerCase()}`);
  }
});
var fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."), false);
  }
};
var uploadReviewPhoto = (0, import_multer.default)({
  storage: reviewStorage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});
var uploadSubmissionPhoto = (0, import_multer.default)({
  storage: submissionStorage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});
var uploadOwnerPhoto = (0, import_multer.default)({
  storage: ownerStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});
var uploadAvatar = (0, import_multer.default)({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  // 2MB for avatars
  fileFilter
});

// server/src/routes/review.routes.ts
var router7 = (0, import_express7.Router)();
var reviewController = new ReviewController();
router7.get("/cafe/:cafeId", reviewController.getCafeReviews);
router7.get("/cafe/:cafeId/stats", reviewController.getCafeRatingStats);
router7.get("/cafe/:cafeId/my-review", optionalAuth, reviewController.getUserReviewForCafe);
router7.get("/me", requireAuth, reviewController.getMyReviews);
router7.post("/cafe/:cafeId", requireAuth, submissionRateLimit, reviewController.create);
router7.patch("/:id", requireAuth, reviewController.update);
router7.delete("/:id", requireAuth, reviewController.delete);
router7.post("/:id/photos", requireAuth, uploadReviewPhoto.single("photo"), reviewController.uploadPhoto);
router7.delete("/:id/photos/:photoId", requireAuth, reviewController.deletePhoto);
router7.patch("/:id/status", requireAuth, requireRole("ADMIN"), reviewController.updateStatus);
var review_routes_default = router7;

// server/src/routes/user.routes.ts
var import_express8 = require("express");

// server/src/services/dashboardService.ts
init_database();
var import_client13 = require("@prisma/client");

// server/src/services/recommendationService.ts
init_database();
var import_client12 = require("@prisma/client");
var MAX_LIMIT = 24;
var MAX_CANDIDATES = 100;
var HISTORY_LIMIT = 30;
var VIEW_RETENTION_DAYS = 180;
var CACHE_TTL_MS = 6e4;
var genericCache = /* @__PURE__ */ new Map();
var totalRequests = 0;
var personalizedRequests = 0;
var anonymousRequests = 0;
var fallbackRequests = 0;
var cacheHits = 0;
var totalDurationMs = 0;
var clampLimit = (limit) => Math.min(Math.max(Number.isFinite(limit) ? Number(limit) : 6, 1), MAX_LIMIT);
var unique = (items) => [...new Set(items)];
var RecommendationService = class {
  async getRecommendations(options = {}) {
    const startedAt = Date.now();
    totalRequests += 1;
    const limit = clampLimit(options.limit);
    if (options.userId) personalizedRequests += 1;
    else anonymousRequests += 1;
    const cacheKey = options.userId ? null : JSON.stringify({
      context: options.context || "home",
      limit,
      city: options.city || "",
      amenity: options.amenity || "",
      cafeId: options.cafeId || "",
      excludeCafeId: options.excludeCafeId || ""
    });
    if (cacheKey) {
      const cached = genericCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        cacheHits += 1;
        this.recordDuration(startedAt);
        return cached.items;
      }
      if (cached) genericCache.delete(cacheKey);
    }
    try {
      const items = await this.generate(options, limit);
      if (cacheKey) genericCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, items });
      this.recordDuration(startedAt);
      return items;
    } catch (error) {
      console.error("Recommendation generation failed", error);
      fallbackRequests += 1;
      const items = await this.getFallback([], limit);
      this.recordDuration(startedAt);
      return items;
    }
  }
  async getCafeSummaries(userId, limit = 6) {
    const items = await this.getRecommendations({ userId, limit, context: "dashboard" });
    return items.map((item) => item.cafe);
  }
  getDiagnostics() {
    return {
      totalRequests,
      personalizedRequests,
      anonymousRequests,
      fallbackRequests,
      cacheHits,
      averageDurationMs: totalRequests ? Math.round(totalDurationMs / totalRequests) : 0,
      status: "operational",
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  clearGenericCache() {
    genericCache.clear();
  }
  async generate(options, limit) {
    const excludedIds = unique([options.excludeCafeId, options.cafeId].filter(Boolean));
    const [preference, favorites, reviews, views, targetCafe] = await Promise.all([
      options.userId ? prisma.userRecommendationPreference.findUnique({ where: { userId: options.userId } }) : null,
      options.userId ? prisma.cafeFavorite.findMany({
        where: { userId: options.userId },
        select: { cafeId: true, cafe: { select: { city: true, amenities: { select: { amenityId: true } } } } },
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT
      }) : [],
      options.userId ? prisma.cafeReview.findMany({
        where: { userId: options.userId, overallRating: { gte: 3 }, cafe: { status: import_client12.CafeStatus.PUBLISHED } },
        select: { cafeId: true, cafe: { select: { city: true, amenities: { select: { amenityId: true } } } } },
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT
      }) : [],
      options.userId ? prisma.userCafeView.findMany({
        where: { userId: options.userId, viewedAt: { gte: new Date(Date.now() - VIEW_RETENTION_DAYS * 24 * 60 * 60 * 1e3) } },
        select: { cafeId: true, cafe: { select: { city: true } } },
        orderBy: { viewedAt: "desc" },
        take: HISTORY_LIMIT
      }) : [],
      options.cafeId ? prisma.cafe.findFirst({
        where: { id: options.cafeId, status: import_client12.CafeStatus.PUBLISHED },
        select: { city: true, priceRange: true, amenities: { select: { amenityId: true } }, curatedList: { select: { listId: true, list: { select: { status: true } } } } }
      }) : null
    ]);
    const favoriteIds = favorites.map((item) => item.cafeId);
    const favoriteAmenityIds = unique(favorites.flatMap((item) => item.cafe.amenities.map((amenity) => amenity.amenityId)));
    const favoriteCities = unique(favorites.map((item) => item.cafe.city));
    const reviewedIds = reviews.map((item) => item.cafeId);
    const viewedCities = unique(views.map((item) => item.cafe.city));
    const preferenceAmenities = preference?.preferredAmenities || [];
    const where = { status: import_client12.CafeStatus.PUBLISHED, id: { notIn: unique([...excludedIds, ...favoriteIds]) } };
    if (options.city) where.city = options.city;
    if (options.amenity) where.amenities = { some: { amenity: { OR: [{ id: options.amenity }, { slug: options.amenity }] } } };
    const candidates = await prisma.cafe.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        address: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        priceRange: true,
        verified: true,
        featured: true,
        trending: true,
        ratingAverage: true,
        reviewCount: true,
        photos: { where: { isCover: true }, select: { url: true, isCover: true }, take: 1 },
        amenities: { select: { amenityId: true, amenity: { select: { name: true } } } },
        curatedList: { select: { listId: true, list: { select: { title: true, status: true } } } }
      },
      orderBy: [{ featured: "desc" }, { trending: "desc" }, { ratingAverage: "desc" }, { reviewCount: "desc" }, { id: "asc" }],
      take: MAX_CANDIDATES
    });
    if (!candidates.length) {
      fallbackRequests += 1;
      return this.getFallback(excludedIds, limit);
    }
    const targetAmenityIds = new Set(targetCafe?.amenities.map((item) => item.amenityId) || []);
    const targetListIds = new Set(targetCafe?.curatedList.filter((item) => item.list.status === "PUBLISHED").map((item) => item.listId) || []);
    const scored = candidates.map((candidate) => {
      let score = Number(candidate.ratingAverage) * 1.5 + Math.min(candidate.reviewCount, 100) / 100;
      let reason = candidate.trending ? { type: "TRENDING" } : candidate.featured ? { type: "FEATURED" } : { type: "HIGH_RATING", data: { rating: Number(candidate.ratingAverage) } };
      const amenityIds = candidate.amenities.map((item) => item.amenityId);
      const sharedTarget = amenityIds.filter((id) => targetAmenityIds.has(id));
      const sharedFavorite = amenityIds.filter((id) => favoriteAmenityIds.includes(id));
      const sharedPreference = candidate.amenities.filter((item) => preferenceAmenities.includes(item.amenityId) || preferenceAmenities.includes(item.amenity.name));
      const sharedList = candidate.curatedList.find((item) => targetListIds.has(item.listId) && item.list.status === "PUBLISHED");
      if (targetCafe?.city === candidate.city) {
        score += 6;
        reason = { type: "CITY_MATCH", data: { city: candidate.city } };
      }
      if (targetCafe?.priceRange && targetCafe.priceRange === candidate.priceRange) {
        score += 3;
        reason = { type: "PRICE_MATCH", data: { priceRange: candidate.priceRange || 0 } };
      }
      if (sharedTarget.length) {
        score += sharedTarget.length * 4;
        reason = { type: "AMENITY_MATCH", data: { amenity: candidate.amenities.find((item) => targetAmenityIds.has(item.amenityId))?.amenity.name || "" } };
      }
      if (sharedList) {
        score += 5;
        reason = { type: "CURATED_LIST", data: { title: sharedList.list.title } };
      }
      if (preference?.preferredCity?.toLowerCase() === candidate.city.toLowerCase()) {
        score += 8;
        reason = { type: "PREFERENCE_MATCH", data: { city: candidate.city } };
      }
      if (preference?.preferredPriceRange && preference.preferredPriceRange === candidate.priceRange) {
        score += 4;
        reason = { type: "PRICE_MATCH", data: { priceRange: candidate.priceRange || 0 } };
      }
      if (sharedPreference.length) {
        score += sharedPreference.length * 5;
        reason = { type: "PREFERENCE_MATCH", data: { amenity: sharedPreference[0].amenity.name } };
      }
      if (!targetCafe && sharedFavorite.length) {
        score += sharedFavorite.length * 4;
        reason = { type: "FAVORITE_SIMILARITY", data: { amenity: candidate.amenities.find((item) => favoriteAmenityIds.includes(item.amenityId))?.amenity.name || "" } };
      }
      if (!targetCafe && favoriteCities.includes(candidate.city)) {
        score += 4;
        reason = { type: "CITY_MATCH", data: { city: candidate.city } };
      }
      if (!targetCafe && viewedCities.includes(candidate.city)) {
        score += 2;
        reason = { type: "VIEW_SIMILARITY", data: { city: candidate.city } };
      }
      if (!targetCafe && reviewedIds.length > 0 && reviewedIds.includes(candidate.id)) score -= 100;
      return { candidate, score, reason };
    }).sort((a, b) => b.score - a.score || Number(b.candidate.ratingAverage) - Number(a.candidate.ratingAverage) || b.candidate.reviewCount - a.candidate.reviewCount || a.candidate.id.localeCompare(b.candidate.id));
    const selected = [];
    const diversity = /* @__PURE__ */ new Map();
    for (const item of scored) {
      if (selected.length >= limit) break;
      const key = `${item.candidate.city}:${item.candidate.priceRange || 0}`;
      const count = diversity.get(key) || 0;
      if (count >= 3 && scored.length > limit) continue;
      diversity.set(key, count + 1);
      selected.push({ cafe: mapToPublicCafeSummary(item.candidate), reason: item.reason });
    }
    if (selected.length < limit) return [...selected, ...await this.getFallback([...excludedIds, ...selected.map((item) => item.cafe.id)], limit - selected.length)];
    return selected;
  }
  async getFallback(excludeIds, limit) {
    if (limit <= 0) return [];
    const cafes = await prisma.cafe.findMany({
      where: { status: import_client12.CafeStatus.PUBLISHED, id: { notIn: excludeIds } },
      select: { id: true, name: true, slug: true, shortDescription: true, address: true, city: true, state: true, latitude: true, longitude: true, priceRange: true, verified: true, featured: true, trending: true, ratingAverage: true, reviewCount: true, photos: { where: { isCover: true }, select: { url: true, isCover: true }, take: 1 } },
      orderBy: [{ featured: "desc" }, { trending: "desc" }, { ratingAverage: "desc" }, { reviewCount: "desc" }, { id: "asc" }],
      take: limit
    });
    return cafes.map((cafe) => ({ cafe: mapToPublicCafeSummary(cafe), reason: cafe.featured ? { type: "FEATURED" } : cafe.trending ? { type: "TRENDING" } : { type: "HIGH_RATING", data: { rating: Number(cafe.ratingAverage) } } }));
  }
  recordDuration(startedAt) {
    totalDurationMs += Date.now() - startedAt;
  }
};
var recommendationService = new RecommendationService();

// server/src/services/dashboardService.ts
var DashboardService = class {
  constructor() {
    this.recommendationService = new RecommendationService();
    this.userCafeViewRepository = new UserCafeViewRepository();
  }
  async getDashboardData(userId) {
    const [
      user,
      favoriteCount,
      reviewCount,
      submissionCount,
      unreadNotificationCount,
      recentFavorites,
      recentReviews,
      recentSubmissions,
      recentViews,
      recommendations
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true
        }
      }),
      prisma.cafeFavorite.count({ where: { userId } }),
      prisma.cafeReview.count({ where: { userId } }),
      prisma.cafeSubmission.count({ where: { submittedById: userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.cafeFavorite.findMany({
        where: {
          userId,
          cafe: { status: import_client13.CafeStatus.PUBLISHED }
        },
        include: {
          cafe: {
            include: {
              photos: { where: { isCover: true }, take: 1 },
              amenities: { include: { amenity: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 6
      }),
      prisma.cafeReview.findMany({
        where: { userId },
        include: {
          cafe: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.cafeSubmission.findMany({
        where: { submittedById: userId },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      this.userCafeViewRepository.findRecentByUserId(userId, 6),
      this.recommendationService.getCafeSummaries(userId, 6)
    ]);
    return {
      user,
      stats: {
        favoriteCount,
        reviewCount,
        submissionCount,
        unreadNotificationCount
      },
      recentFavorites: recentFavorites.map((f) => mapToPublicCafeSummary(f.cafe)),
      recentReviews,
      recentSubmissions,
      recentViews: recentViews.map((v) => mapToPublicCafeSummary(v.cafe)),
      recommendations
    };
  }
};

// server/src/controllers/dashboardController.ts
var DashboardController = class {
  constructor() {
    this.service = new DashboardService();
    this.getDashboardData = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const data = await this.service.getDashboardData(userId);
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    };
  }
};

// server/src/services/userService.ts
var UserService = class {
  constructor() {
    this.userRepository = new UserRepository();
  }
  async updateProfile(userId, data) {
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw { status: 409, message: "Email already in use." };
      }
    }
    const user = await this.userRepository.update(userId, data);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl
    };
  }
  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw { status: 404, message: "User not found." };
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl
    };
  }
  async updateStatus(userId, status) {
    return this.userRepository.update(userId, { status });
  }
};

// server/src/controllers/userController.ts
var import_zod9 = require("zod");

// server/src/services/userDataExportService.ts
init_database();
init_metricsService();
var UserDataExportService = class {
  async exportUserData(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        favorites: {
          include: {
            cafe: {
              select: { name: true, city: true }
            }
          }
        },
        reviews: {
          include: {
            cafe: {
              select: { name: true }
            }
          }
        },
        cafeSubmissions: true,
        claims: true,
        notifications: true,
        activityLogs: {
          take: 100,
          // Limit activity log export
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!user) {
      throw new Error("User not found");
    }
    const exportData = {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      },
      favorites: user.favorites.map((f) => ({
        cafeName: f.cafe.name,
        city: f.cafe.city,
        createdAt: f.createdAt
      })),
      reviews: user.reviews.map((r) => ({
        cafeName: r.cafe.name,
        rating: r.overallRating,
        comment: r.comment,
        status: r.status,
        createdAt: r.createdAt
      })),
      submissions: user.cafeSubmissions.map((s) => ({
        name: s.name,
        address: s.address,
        city: s.city,
        status: s.status,
        createdAt: s.createdAt
      })),
      claims: user.claims.map((c) => ({
        businessName: c.businessName,
        status: c.status,
        submittedAt: c.submittedAt
      })),
      notifications: user.notifications.map((n) => ({
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt
      })),
      recentActivity: user.activityLogs.map((l) => ({
        action: l.action,
        description: l.description,
        createdAt: l.createdAt
      }))
    };
    metricsService.recordEvent("INFO", "user.data_export", `User ${userId} exported their data`, { userId });
    return exportData;
  }
};
var userDataExportService = new UserDataExportService();

// server/src/controllers/userController.ts
var userService = new UserService();
var updateProfileSchema = import_zod9.z.object({
  name: import_zod9.z.string().min(1, "Name is required").max(100).optional(),
  email: import_zod9.z.string().email("Invalid email address").optional(),
  avatarUrl: import_zod9.z.string().url("Invalid avatar URL").optional().or(import_zod9.z.literal(""))
});
var UserController = class {
  async updateProfile(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: "Not authenticated" }
        });
      }
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await userService.updateProfile(req.user.id, validatedData);
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
  async uploadAvatar(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: "Not authenticated" }
        });
      }
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: "No file uploaded" }
        });
      }
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await userService.updateProfile(req.user.id, { avatarUrl });
      res.json({
        success: true,
        data: { user, avatarUrl }
      });
    } catch (error) {
      next(error);
    }
  }
  async exportUserData(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { message: "Not authenticated" } });
      }
      const data = await userDataExportService.exportUserData(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
  async deactivateAccount(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { message: "Not authenticated" } });
      }
      await userService.updateStatus(req.user.id, "INACTIVE");
      res.json({ success: true, message: "Account deactivated" });
    } catch (error) {
      next(error);
    }
  }
};

// server/src/services/userPreferenceService.ts
init_database();
var MAX_ITEMS = 20;
var boundedStrings = (value) => Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, MAX_ITEMS))] : [];
var UserPreferenceService = class {
  async get(userId) {
    return prisma.userRecommendationPreference.findUnique({ where: { userId } });
  }
  async update(userId, input) {
    const price = input.preferredPriceRange == null ? null : Number(input.preferredPriceRange);
    if (price !== null && (!Number.isInteger(price) || price < 1 || price > 5)) {
      throw new Error("preferredPriceRange must be an integer between 1 and 5");
    }
    return prisma.userRecommendationPreference.upsert({
      where: { userId },
      create: {
        userId,
        preferredCity: typeof input.preferredCity === "string" ? input.preferredCity.trim().slice(0, 120) || null : null,
        preferredPriceRange: price,
        preferredAmenities: boundedStrings(input.preferredAmenities),
        preferredCoffeeTypes: boundedStrings(input.preferredCoffeeTypes),
        preferredVibes: boundedStrings(input.preferredVibes)
      },
      update: {
        preferredCity: input.preferredCity === void 0 ? void 0 : typeof input.preferredCity === "string" ? input.preferredCity.trim().slice(0, 120) || null : null,
        preferredPriceRange: input.preferredPriceRange === void 0 ? void 0 : price,
        preferredAmenities: input.preferredAmenities === void 0 ? void 0 : boundedStrings(input.preferredAmenities),
        preferredCoffeeTypes: input.preferredCoffeeTypes === void 0 ? void 0 : boundedStrings(input.preferredCoffeeTypes),
        preferredVibes: input.preferredVibes === void 0 ? void 0 : boundedStrings(input.preferredVibes)
      }
    });
  }
  async reset(userId) {
    return prisma.userRecommendationPreference.deleteMany({ where: { userId } });
  }
};
var userPreferenceService = new UserPreferenceService();

// server/src/controllers/userPreferenceController.ts
var UserPreferenceController = class {
  constructor() {
    this.getPreferences = async (req, res, next) => {
      try {
        const preference = await userPreferenceService.get(req.user.id);
        res.json({ success: true, data: preference });
      } catch (error) {
        next(error);
      }
    };
    this.updatePreferences = async (req, res, next) => {
      try {
        const preference = await userPreferenceService.update(req.user.id, req.body || {});
        res.json({ success: true, data: preference });
      } catch (error) {
        next(error);
      }
    };
    this.resetPreferences = async (req, res, next) => {
      try {
        await userPreferenceService.reset(req.user.id);
        res.json({ success: true, data: null });
      } catch (error) {
        next(error);
      }
    };
  }
};

// server/src/routes/user.routes.ts
var router8 = (0, import_express8.Router)();
var favoriteController2 = new FavoriteController();
var dashboardController = new DashboardController();
var userController = new UserController();
var userPreferenceController = new UserPreferenceController();
router8.get("/me/favorites", requireAuth, favoriteController2.getMyFavorites);
router8.get("/me/dashboard", requireAuth, dashboardController.getDashboardData);
router8.get("/me/preferences", requireAuth, userPreferenceController.getPreferences);
router8.put("/me/preferences", requireAuth, userPreferenceController.updatePreferences);
router8.delete("/me/preferences", requireAuth, userPreferenceController.resetPreferences);
router8.patch("/profile", requireAuth, userController.updateProfile);
router8.post("/profile/avatar", requireAuth, uploadAvatar.single("avatar"), userController.uploadAvatar);
router8.get("/me/export", requireAuth, userController.exportUserData);
router8.post("/me/deactivate", requireAuth, userController.deactivateAccount);
var user_routes_default = router8;

// server/src/routes/claim.routes.ts
var import_express9 = require("express");

// server/src/controllers/claimController.ts
var import_zod10 = require("zod");

// server/src/services/claimService.ts
var import_client14 = require("@prisma/client");
init_database();

// server/src/repositories/claimRepository.ts
init_database();
var claimInclude = {
  cafe: { include: { photos: { where: { isCover: true }, take: 1 } } },
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } }
};
var ClaimRepository = class {
  async findById(id) {
    return prisma.cafeOwnerClaim.findUnique({ where: { id }, include: claimInclude });
  }
  async findByIdForUser(id, userId) {
    return prisma.cafeOwnerClaim.findFirst({ where: { id, userId }, include: claimInclude });
  }
  async findByUserId(userId) {
    return prisma.cafeOwnerClaim.findMany({ where: { userId }, include: claimInclude, orderBy: { submittedAt: "desc" } });
  }
  async findAll(filters) {
    const { status, search, page, limit } = filters;
    const where = {
      ...status && { status },
      ...search && { OR: [
        { cafe: { name: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { businessName: { contains: search } }
      ] }
    };
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const [data, total] = await Promise.all([
      prisma.cafeOwnerClaim.findMany({ where, include: claimInclude, orderBy: { submittedAt: "desc" }, skip, take: safeLimit }),
      prisma.cafeOwnerClaim.count({ where })
    ]);
    return { data, total };
  }
};

// server/src/repositories/activityLogRepository.ts
init_database();
var ActivityLogRepository = class {
  async findAll(filters = {}) {
    const {
      userId,
      action,
      entityType,
      entityId,
      from,
      to,
      search,
      page = 1,
      limit = 20
    } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = {
      ...userId && { userId },
      ...action && { action: { contains: action } },
      ...entityType && { entityType },
      ...entityId && { entityId },
      ...(from || to) && {
        createdAt: {
          ...from && { gte: from },
          ...to && { lte: to }
        }
      },
      ...search && {
        OR: [
          { action: { contains: search } },
          { description: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } }
        ]
      }
    };
    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit
      }),
      prisma.activityLog.count({ where })
    ]);
    return { data, total };
  }
  async create(data) {
    return prisma.activityLog.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }
  async findById(id) {
    return prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });
  }
};

// server/src/services/activityLogService.ts
var ActivityLogService = class {
  constructor() {
    this.activityLogRepository = new ActivityLogRepository();
  }
  async getLogs(filters) {
    const { data, total } = await this.activityLogRepository.findAll(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }
  async logAction(data) {
    return this.activityLogRepository.create(data);
  }
};

// server/src/services/claimService.ts
var claimInclude2 = {
  cafe: { include: { photos: { where: { isCover: true }, take: 1 } } },
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } }
};
var fail = (message, status) => Object.assign(new Error(message), { status });
var ClaimService = class {
  constructor() {
    this.repository = new ClaimRepository();
    this.activityLogs = new ActivityLogService();
  }
  async submitClaim(userId, data) {
    const result = await prisma.$transaction(async (tx) => {
      const cafe = await tx.cafe.findUnique({ where: { id: data.cafeId } });
      if (!cafe) throw fail("Cafe not found", 404);
      if (cafe.status !== import_client14.CafeStatus.PUBLISHED) throw fail("Only published cafes can be claimed", 409);
      if (cafe.ownerId === userId) throw fail("This cafe is already claimed by your account.", 409);
      if (cafe.ownerId) throw fail("This cafe already has an owner. Please contact CafeFinder support if you believe this is incorrect.", 409);
      const existing = await tx.cafeOwnerClaim.findFirst({ where: { userId, cafeId: data.cafeId, status: import_client14.ClaimStatus.PENDING } });
      if (existing) throw fail("You already have a pending claim for this cafe.", 409);
      return tx.cafeOwnerClaim.create({
        data: { cafe: { connect: { id: data.cafeId } }, user: { connect: { id: userId } }, businessName: data.businessName, contactName: data.contactName, contactEmail: data.contactEmail, contactPhone: data.contactPhone, website: data.website, message: data.message, verificationInformation: data.verificationInformation },
        include: claimInclude2
      });
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_CLAIM_CREATED", entityType: "CafeOwnerClaim", entityId: result.id, description: `Submitted ownership claim for ${result.cafe.name}` });
    return this.mapToDto(result);
  }
  async getUserClaims(userId) {
    return (await this.repository.findByUserId(userId)).map((c) => this.mapToDto(c));
  }
  async getClaim(id, userId, isAdmin = false) {
    const claim = isAdmin ? await this.repository.findById(id) : await this.repository.findByIdForUser(id, userId);
    if (!claim) throw fail("Claim not found", 404);
    return this.mapToDto(claim);
  }
  async updateClaim(id, userId, data) {
    const claim = await this.repository.findByIdForUser(id, userId);
    if (!claim) throw fail("Claim not found", 404);
    if (claim.status !== import_client14.ClaimStatus.PENDING) throw fail("Only pending claims can be edited", 409);
    const updated = await prisma.cafeOwnerClaim.update({ where: { id }, data, include: claimInclude2 });
    await this.activityLogs.logAction({ userId, action: "OWNER_CLAIM_UPDATED", entityType: "CafeOwnerClaim", entityId: id, description: `Updated ownership claim for ${claim.cafe.name}` });
    return this.mapToDto(updated);
  }
  async cancelClaim(id, userId) {
    const claim = await this.repository.findByIdForUser(id, userId);
    if (!claim) throw fail("Claim not found", 404);
    if (claim.status !== import_client14.ClaimStatus.PENDING) throw fail("Only pending claims can be cancelled", 409);
    const updated = await prisma.cafeOwnerClaim.update({ where: { id }, data: { status: import_client14.ClaimStatus.CANCELLED }, include: claimInclude2 });
    await this.activityLogs.logAction({ userId, action: "OWNER_CLAIM_CANCELLED", entityType: "CafeOwnerClaim", entityId: id, description: `Cancelled ownership claim for ${claim.cafe.name}` });
    return this.mapToDto(updated);
  }
  async getAdminClaims(filters) {
    const result = await this.repository.findAll(filters);
    return { data: result.data.map((c) => this.mapToDto(c)), pagination: { page: filters.page, limit: filters.limit, total: result.total, totalPages: Math.ceil(result.total / filters.limit) } };
  }
  async approveClaim(id, adminId) {
    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.cafeOwnerClaim.findUnique({ where: { id }, include: { cafe: true, user: true } });
      if (!claim) throw fail("Claim not found", 404);
      if (claim.status !== import_client14.ClaimStatus.PENDING) throw fail("This claim has already been processed", 409);
      if (claim.cafe.status !== import_client14.CafeStatus.PUBLISHED) throw fail("Cafe is no longer eligible for ownership", 409);
      if (claim.cafe.ownerId) throw fail("Cafe already has an owner", 409);
      if (claim.user.status !== import_client14.UserStatus.ACTIVE) throw fail("Claimant account is not active", 409);
      const competing = await tx.cafeOwnerClaim.findFirst({ where: { cafeId: claim.cafeId, status: import_client14.ClaimStatus.APPROVED, id: { not: id } } });
      if (competing) throw fail("Another approved claim already owns this cafe", 409);
      const now = /* @__PURE__ */ new Date();
      await tx.cafe.update({ where: { id: claim.cafeId, ownerId: null }, data: { ownerId: claim.userId } });
      const updated = await tx.cafeOwnerClaim.update({ where: { id, status: import_client14.ClaimStatus.PENDING }, data: { status: import_client14.ClaimStatus.APPROVED, reviewedById: adminId, reviewedAt: now }, include: claimInclude2 });
      if (claim.user.role === import_client14.Role.USER) await tx.user.update({ where: { id: claim.userId }, data: { role: import_client14.Role.OWNER } });
      await tx.activityLog.create({ data: { userId: adminId, action: "ADMIN_APPROVED_OWNER_CLAIM", entityType: "CafeOwnerClaim", entityId: id, description: `Approved claim ${id} for cafe ${claim.cafeId} and claimant ${claim.userId}` } });
      await tx.notification.create({ data: { userId: claim.userId, title: "Owner claim approved", message: `Your claim for ${claim.cafe.name} has been approved.`, type: "OWNER_CLAIM_APPROVED" } });
      emailService.sendOwnerClaimApprovedEmail(
        { id: claim.user.id, name: claim.user.name, email: claim.user.email },
        claim.cafe.name
      ).catch((err) => console.error("[ClaimService]: Failed to send claim approval email:", err));
      return updated;
    });
    return this.mapToDto(result);
  }
  async rejectClaim(id, adminId, reason) {
    const claim = await this.repository.findById(id);
    if (!claim) throw fail("Claim not found", 404);
    if (claim.status !== import_client14.ClaimStatus.PENDING) throw fail("This claim has already been processed", 409);
    const updated = await prisma.$transaction(async (tx) => {
      const value = await tx.cafeOwnerClaim.update({ where: { id, status: import_client14.ClaimStatus.PENDING }, data: { status: import_client14.ClaimStatus.REJECTED, rejectionReason: reason, reviewedById: adminId, reviewedAt: /* @__PURE__ */ new Date() }, include: claimInclude2 });
      await tx.activityLog.create({ data: { userId: adminId, action: "ADMIN_REJECTED_OWNER_CLAIM", entityType: "CafeOwnerClaim", entityId: id, description: `Rejected claim ${id} for cafe ${claim.cafeId}` } });
      await tx.notification.create({ data: { userId: claim.userId, title: "Owner claim rejected", message: `Your claim for ${claim.cafe.name} was rejected: ${reason}`, type: "OWNER_CLAIM_REJECTED" } });
      const user = await tx.user.findUnique({ where: { id: claim.userId } });
      if (user) {
        emailService.sendOwnerClaimRejectedEmail(
          { id: user.id, name: user.name, email: user.email },
          claim.cafe.name,
          reason
        ).catch((err) => console.error("[ClaimService]: Failed to send claim rejection email:", err));
      }
      return value;
    });
    return this.mapToDto(updated);
  }
  async reopenClaim(id, adminId) {
    const claim = await this.repository.findById(id);
    if (!claim) throw fail("Claim not found", 404);
    if (claim.status !== import_client14.ClaimStatus.REJECTED && claim.status !== import_client14.ClaimStatus.CANCELLED) throw fail("Only rejected or cancelled claims can be reopened", 409);
    const updated = await prisma.cafeOwnerClaim.update({ where: { id }, data: { status: import_client14.ClaimStatus.PENDING, rejectionReason: null, reviewedById: null, reviewedAt: null }, include: claimInclude2 });
    await this.activityLogs.logAction({ userId: adminId, action: "ADMIN_REOPENED_OWNER_CLAIM", entityType: "CafeOwnerClaim", entityId: id, description: `Reopened ownership claim ${id}` });
    return this.mapToDto(updated);
  }
  mapToDto(claim) {
    return { id: claim.id, cafeId: claim.cafeId, cafe: { id: claim.cafe.id, slug: claim.cafe.slug, name: claim.cafe.name, city: claim.cafe.city, address: claim.cafe.address, coverImage: claim.cafe.photos?.[0]?.url || null }, userId: claim.userId, user: claim.user, businessName: claim.businessName, contactName: claim.contactName, contactEmail: claim.contactEmail, contactPhone: claim.contactPhone, website: claim.website, message: claim.message, verificationInformation: claim.verificationInformation, verificationNotes: claim.verificationNotes, rejectionReason: claim.rejectionReason, status: claim.status, submittedAt: claim.submittedAt, reviewedAt: claim.reviewedAt, reviewedById: claim.reviewedById };
  }
};

// server/src/controllers/claimController.ts
var import_client15 = require("@prisma/client");
var claimFields = {
  cafeId: import_zod10.z.string().cuid().optional(),
  contactName: import_zod10.z.string().trim().max(150).optional(),
  contactEmail: import_zod10.z.string().trim().email().max(255).optional().or(import_zod10.z.literal("")),
  contactPhone: import_zod10.z.string().trim().max(40).optional(),
  businessName: import_zod10.z.string().trim().min(1).max(150),
  website: import_zod10.z.string().trim().url().max(500).optional().or(import_zod10.z.literal("")),
  message: import_zod10.z.string().trim().max(2e3).optional(),
  verificationInformation: import_zod10.z.string().trim().max(2e3).optional()
};
var claimSchema = import_zod10.z.object(claimFields).refine((data) => !data.message || !/[<>]/.test(data.message), { message: "Message must be plain text", path: ["message"] });
var updateClaimSchema = import_zod10.z.object(claimFields).omit({ cafeId: true }).refine((data) => !data.message || !/[<>]/.test(data.message), { message: "Message must be plain text", path: ["message"] });
var rejectionSchema = import_zod10.z.object({ reason: import_zod10.z.string().trim().min(5).max(1e3) });
var sendError = (res, error) => res.status(error.status || (error.name === "ZodError" ? 422 : 400)).json({ success: false, error: { message: error.message, details: error.issues } });
var ClaimController = class {
  constructor() {
    this.claimService = new ClaimService();
    this.submitClaim = async (req, res) => {
      try {
        const data = claimSchema.parse({ ...req.body, cafeId: req.params.cafeId || req.body.cafeId });
        const claim = await this.claimService.submitClaim(req.user.id, { ...data, cafeId: data.cafeId });
        res.status(201).json({ success: true, data: claim });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.getMyClaims = async (req, res) => {
      try {
        res.json({ success: true, data: await this.claimService.getUserClaims(req.user.id) });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.getClaim = async (req, res) => {
      try {
        res.json({ success: true, data: await this.claimService.getClaim(req.params.id, req.user.id, req.user.role === "ADMIN") });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.updateClaim = async (req, res) => {
      try {
        res.json({ success: true, data: await this.claimService.updateClaim(req.params.id, req.user.id, updateClaimSchema.parse(req.body)) });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.cancelClaim = async (req, res) => {
      try {
        res.json({ success: true, data: await this.claimService.cancelClaim(req.params.id, req.user.id) });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.getAdminClaims = async (req, res) => {
      try {
        const rawStatus = req.query.status;
        const status = rawStatus && Object.values(import_client15.ClaimStatus).includes(rawStatus) ? rawStatus : void 0;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
        const result = await this.claimService.getAdminClaims({ status, search: req.query.search, page, limit });
        res.json({ success: true, ...result });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.getAdminClaim = async (req, res) => {
      try {
        res.json({ success: true, data: await this.claimService.getClaim(req.params.id, req.user.id, true) });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.approveClaim = async (req, res) => {
      try {
        res.json({ success: true, data: await this.claimService.approveClaim(req.params.id, req.user.id) });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.rejectClaim = async (req, res) => {
      try {
        res.json({ success: true, data: await this.claimService.rejectClaim(req.params.id, req.user.id, rejectionSchema.parse(req.body).reason) });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.reopenClaim = async (req, res) => {
      try {
        res.json({ success: true, data: await this.claimService.reopenClaim(req.params.id, req.user.id) });
      } catch (error) {
        sendError(res, error);
      }
    };
    this.legacyReviewClaim = async (req, res) => {
      if (req.body.status === import_client15.ClaimStatus.APPROVED) return this.approveClaim(req, res);
      if (req.body.status === import_client15.ClaimStatus.REJECTED) return this.rejectClaim(req, res);
      return res.status(422).json({ success: false, error: { message: "Use APPROVED or REJECTED" } });
    };
  }
};

// server/src/routes/claim.routes.ts
var router9 = (0, import_express9.Router)();
var controller = new ClaimController();
router9.post("/cafes/:cafeId/claim", requireAuth, controller.submitClaim);
router9.post("/claims", requireAuth, controller.submitClaim);
router9.get("/cafe-owner-claims/me", requireAuth, controller.getMyClaims);
router9.get("/cafe-owner-claims/:id", requireAuth, controller.getClaim);
router9.patch("/cafe-owner-claims/:id", requireAuth, controller.updateClaim);
router9.post("/cafe-owner-claims/:id/cancel", requireAuth, controller.cancelClaim);
router9.get("/claims/me", requireAuth, controller.getMyClaims);
router9.get("/claims/pending", requireAuth, requireRole("ADMIN"), controller.getAdminClaims);
router9.patch("/claims/:claimId/review", requireAuth, requireRole("ADMIN"), controller.legacyReviewClaim);
var claim_routes_default = router9;

// server/src/routes/submission.routes.ts
var import_express10 = require("express");

// server/src/repositories/submissionRepository.ts
init_database();
var import_client16 = require("@prisma/client");
var SubmissionRepository = class {
  async create(data) {
    return prisma.cafeSubmission.create({
      data,
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
  }
  async findById(id) {
    return prisma.cafeSubmission.findUnique({
      where: { id },
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
  }
  async findByUserId(userId) {
    return prisma.cafeSubmission.findMany({
      where: { submittedById: userId },
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
  async update(id, data) {
    return prisma.cafeSubmission.update({
      where: { id },
      data,
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
  }
  async delete(id) {
    return prisma.cafeSubmission.delete({
      where: { id }
    });
  }
  async findDuplicate(name, city, address) {
    const normalizedName = name.toLowerCase().trim();
    const normalizedAddress = address.toLowerCase().trim();
    const normalizedCity = city.toLowerCase().trim();
    const existingCafe = await prisma.cafe.findFirst({
      where: {
        name: { contains: normalizedName },
        city: { contains: normalizedCity },
        address: { contains: normalizedAddress }
      }
    });
    if (existingCafe) return { type: "CAFE", data: existingCafe };
    const existingSubmission = await prisma.cafeSubmission.findFirst({
      where: {
        name: { contains: normalizedName },
        city: { contains: normalizedCity },
        address: { contains: normalizedAddress },
        status: import_client16.CafeSubmissionStatus.PENDING
      }
    });
    if (existingSubmission) return { type: "SUBMISSION", data: existingSubmission };
    return null;
  }
  async findUserPendingSubmission(userId, name, city, address) {
    const normalizedName = name.toLowerCase().trim();
    const normalizedAddress = address.toLowerCase().trim();
    const normalizedCity = city.toLowerCase().trim();
    return prisma.cafeSubmission.findFirst({
      where: {
        submittedById: userId,
        name: { equals: normalizedName },
        city: { equals: normalizedCity },
        address: { equals: normalizedAddress },
        status: import_client16.CafeSubmissionStatus.PENDING
      }
    });
  }
};

// server/src/services/submissionService.ts
var import_client17 = require("@prisma/client");
init_database();
var SubmissionService = class {
  constructor() {
    this.repository = new SubmissionRepository();
  }
  async createSubmission(userId, data) {
    const existing = await this.repository.findUserPendingSubmission(userId, data.name, data.city, data.address);
    if (existing) {
      throw new Error("You already have a pending submission for this cafe");
    }
    if (data.amenityIds && data.amenityIds.length > 0) {
      const amenities = await prisma.amenity.findMany({
        where: { id: { in: data.amenityIds }, active: true }
      });
      if (amenities.length !== data.amenityIds.length) {
        throw new Error("Some selected amenities are invalid or inactive");
      }
    }
    const submissionData = {
      name: sanitizePlain(data.name),
      shortDescription: data.shortDescription ? sanitizePlain(data.shortDescription) : null,
      description: data.description ? sanitizePlain(data.description) : null,
      address: sanitizePlain(data.address),
      city: sanitizePlain(data.city),
      state: data.state ? sanitizePlain(data.state) : null,
      country: data.country ? sanitizePlain(data.country) : null,
      postalCode: data.postalCode ? sanitizePlain(data.postalCode) : null,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone ? sanitizePlain(data.phone) : null,
      email: data.email ? sanitizePlain(data.email) : null,
      website: data.website ? sanitizePlain(data.website) : null,
      instagram: data.instagram ? sanitizePlain(data.instagram) : null,
      facebook: data.facebook ? sanitizePlain(data.facebook) : null,
      priceRange: data.priceRange,
      status: import_client17.CafeSubmissionStatus.PENDING,
      submittedBy: { connect: { id: userId } }
    };
    if (data.amenityIds) {
      submissionData.amenities = {
        create: data.amenityIds.map((id) => ({
          amenity: { connect: { id } }
        }))
      };
    }
    const submission = await this.repository.create(submissionData);
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CAFE_SUBMISSION_CREATED",
        entityType: "CafeSubmission",
        entityId: submission.id,
        description: `Submitted cafe: ${data.name}`
      }
    });
    return this.mapToDto(submission);
  }
  async getMySubmissions(userId) {
    const submissions = await this.repository.findByUserId(userId);
    return submissions.map((s) => this.mapToDto(s));
  }
  async getSubmissionById(id, userId) {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error("Submission not found");
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (submission.submittedById !== userId && user?.role !== "ADMIN") {
      throw new Error("Unauthorized access to submission");
    }
    return this.mapToDto(submission);
  }
  async updateSubmission(id, userId, data) {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error("Submission not found");
    }
    if (submission.submittedById !== userId) {
      throw new Error("Unauthorized access to submission");
    }
    if (submission.status !== import_client17.CafeSubmissionStatus.PENDING) {
      throw new Error("Only pending submissions can be edited");
    }
    const updateData = {
      name: data.name ? sanitizePlain(data.name) : void 0,
      shortDescription: data.shortDescription ? sanitizePlain(data.shortDescription) : null,
      description: data.description ? sanitizePlain(data.description) : null,
      address: data.address ? sanitizePlain(data.address) : void 0,
      city: data.city ? sanitizePlain(data.city) : void 0,
      state: data.state ? sanitizePlain(data.state) : null,
      country: data.country ? sanitizePlain(data.country) : null,
      postalCode: data.postalCode ? sanitizePlain(data.postalCode) : null,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone ? sanitizePlain(data.phone) : null,
      email: data.email ? sanitizePlain(data.email) : null,
      website: data.website ? sanitizePlain(data.website) : null,
      instagram: data.instagram ? sanitizePlain(data.instagram) : null,
      facebook: data.facebook ? sanitizePlain(data.facebook) : null,
      priceRange: data.priceRange
    };
    if (data.amenityIds) {
      const amenities = await prisma.amenity.findMany({
        where: { id: { in: data.amenityIds }, active: true }
      });
      if (amenities.length !== data.amenityIds.length) {
        throw new Error("Some selected amenities are invalid or inactive");
      }
      updateData.amenities = {
        deleteMany: {},
        create: data.amenityIds.map((amenityId) => ({
          amenity: { connect: { id: amenityId } }
        }))
      };
    }
    const updated = await this.repository.update(id, updateData);
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CAFE_SUBMISSION_UPDATED",
        entityType: "CafeSubmission",
        entityId: updated.id,
        description: `Updated cafe submission: ${updated.name}`
      }
    });
    return this.mapToDto(updated);
  }
  async cancelSubmission(id, userId) {
    const submission = await this.repository.findById(id);
    if (!submission) {
      throw new Error("Submission not found");
    }
    if (submission.submittedById !== userId) {
      throw new Error("Unauthorized access to submission");
    }
    if (submission.status !== import_client17.CafeSubmissionStatus.PENDING) {
      throw new Error("Only pending submissions can be cancelled");
    }
    const updated = await this.repository.update(id, {
      status: import_client17.CafeSubmissionStatus.CANCELLED
    });
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CAFE_SUBMISSION_CANCELLED",
        entityType: "CafeSubmission",
        entityId: updated.id,
        description: `Cancelled cafe submission: ${updated.name}`
      }
    });
    return this.mapToDto(updated);
  }
  async checkDuplicates(data) {
    return this.repository.findDuplicate(data.name, data.city, data.address);
  }
  async addSubmissionPhoto(userId, submissionId, url) {
    const submission = await this.repository.findById(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }
    if (submission.submittedById !== userId) {
      throw new Error("Unauthorized access to submission");
    }
    if (submission.status !== import_client17.CafeSubmissionStatus.PENDING) {
      throw new Error("Can only add photos to pending submissions");
    }
    if (submission.photos.length >= 5) {
      throw new Error("Maximum 5 photos allowed per submission");
    }
    return prisma.cafeSubmissionPhoto.create({
      data: {
        submissionId,
        url
      }
    });
  }
  async deleteSubmissionPhoto(userId, photoId, isAdmin) {
    const photo = await prisma.cafeSubmissionPhoto.findUnique({
      where: { id: photoId },
      include: { submission: true }
    });
    if (!photo) {
      throw new Error("Photo not found");
    }
    if (photo.submission.submittedById !== userId && !isAdmin) {
      throw new Error("Unauthorized");
    }
    if (photo.submission.status !== import_client17.CafeSubmissionStatus.PENDING && !isAdmin) {
      throw new Error("Can only delete photos from pending submissions");
    }
    return prisma.cafeSubmissionPhoto.delete({
      where: { id: photoId }
    });
  }
  mapToDto(submission) {
    return {
      id: submission.id,
      submittedById: submission.submittedById,
      cafeId: submission.cafeId,
      name: submission.name,
      shortDescription: submission.shortDescription,
      description: submission.description,
      address: submission.address,
      city: submission.city,
      state: submission.state,
      country: submission.country,
      postalCode: submission.postalCode,
      latitude: submission.latitude ? Number(submission.latitude) : null,
      longitude: submission.longitude ? Number(submission.longitude) : null,
      phone: submission.phone,
      email: submission.email,
      website: submission.website,
      instagram: submission.instagram,
      facebook: submission.facebook,
      priceRange: submission.priceRange,
      status: submission.status,
      rejectionReason: submission.rejectionReason,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      photos: submission.photos.map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.caption
      })),
      amenities: submission.amenities.map((a) => ({
        id: a.amenity.id,
        name: a.amenity.name
      }))
    };
  }
};

// server/src/controllers/submissionController.ts
var SubmissionController = class {
  constructor() {
    this.createSubmission = async (req, res) => {
      try {
        const userId = req.user.id;
        const submission = await this.submissionService.createSubmission(userId, req.body);
        res.status(201).json({
          success: true,
          data: submission
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: { message: error.message }
        });
      }
    };
    this.getMySubmissions = async (req, res) => {
      try {
        const userId = req.user.id;
        const submissions = await this.submissionService.getMySubmissions(userId);
        res.json({
          success: true,
          data: submissions
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: { message: error.message }
        });
      }
    };
    this.getSubmission = async (req, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;
        const submission = await this.submissionService.getSubmissionById(id, userId);
        res.json({
          success: true,
          data: submission
        });
      } catch (error) {
        res.status(error.message === "Submission not found" ? 404 : 403).json({
          success: false,
          error: { message: error.message }
        });
      }
    };
    this.updateSubmission = async (req, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;
        const submission = await this.submissionService.updateSubmission(id, userId, req.body);
        res.json({
          success: true,
          data: submission
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: { message: error.message }
        });
      }
    };
    this.cancelSubmission = async (req, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;
        const submission = await this.submissionService.cancelSubmission(id, userId);
        res.json({
          success: true,
          data: submission
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: { message: error.message }
        });
      }
    };
    this.checkDuplicates = async (req, res) => {
      try {
        const result = await this.submissionService.checkDuplicates(req.body);
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: { message: error.message }
        });
      }
    };
    this.uploadPhoto = async (req, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;
        if (!req.file) {
          return res.status(400).json({ success: false, error: { message: "No file uploaded" } });
        }
        const photoUrl = `/uploads/submissions/${req.file.filename}`;
        const photo = await this.submissionService.addSubmissionPhoto(userId, id, photoUrl);
        res.json({
          success: true,
          data: photo
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: { message: error.message }
        });
      }
    };
    this.deletePhoto = async (req, res) => {
      try {
        const { photoId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === "ADMIN";
        await this.submissionService.deleteSubmissionPhoto(userId, photoId, isAdmin);
        res.json({
          success: true,
          message: "Photo deleted successfully"
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: { message: error.message }
        });
      }
    };
    this.submissionService = new SubmissionService();
  }
};

// server/src/routes/submission.routes.ts
var router10 = (0, import_express10.Router)();
var submissionController = new SubmissionController();
router10.use(requireAuth);
router10.post("/", submissionRateLimit, submissionController.createSubmission);
router10.get("/me", submissionController.getMySubmissions);
router10.post("/check-duplicates", submissionController.checkDuplicates);
router10.get("/:id", submissionController.getSubmission);
router10.patch("/:id", submissionController.updateSubmission);
router10.delete("/:id", submissionController.cancelSubmission);
router10.post("/:id/photos", uploadSubmissionPhoto.single("photo"), submissionController.uploadPhoto);
router10.delete("/:id/photos/:photoId", submissionController.deletePhoto);
var submission_routes_default = router10;

// server/src/routes/amenity.routes.ts
var import_express11 = require("express");

// server/src/repositories/amenityRepository.ts
init_database();
var AmenityRepository = class {
  async findAll() {
    return prisma.amenity.findMany({
      where: { active: true },
      orderBy: { name: "asc" }
    });
  }
  async findById(id) {
    return prisma.amenity.findUnique({
      where: { id }
    });
  }
  async findBySlug(slug) {
    return prisma.amenity.findUnique({
      where: { slug }
    });
  }
};

// server/src/services/amenityService.ts
var AmenityService = class {
  constructor() {
    this.amenityRepository = new AmenityRepository();
  }
  async getAllAmenities() {
    return this.amenityRepository.findAll();
  }
};

// server/src/controllers/amenityController.ts
var AmenityController = class {
  constructor() {
    this.getAll = async (_req, res, next) => {
      try {
        const amenities = await this.amenityService.getAllAmenities();
        res.json({
          success: true,
          data: amenities
        });
      } catch (error) {
        next(error);
      }
    };
    this.amenityService = new AmenityService();
  }
};

// server/src/routes/amenity.routes.ts
var router11 = (0, import_express11.Router)();
var amenityController = new AmenityController();
router11.get("/", amenityController.getAll);
var amenity_routes_default = router11;

// server/src/routes/adminRoutes.ts
var import_express12 = require("express");

// server/src/services/adminService.ts
init_database();
var import_client18 = require("@prisma/client");
var AdminService = class {
  constructor() {
    this.cafeRepository = new CafeRepository();
    this.submissionRepository = new SubmissionRepository();
    this.reviewRepository = new ReviewRepository();
    this.userRepository = new UserRepository();
    this.reviewService = new ReviewService();
    this.activityLogService = new ActivityLogService();
  }
  async getDashboardStats() {
    const [
      pendingCafeSubmissions,
      pendingReviews,
      publishedCafes,
      rejectedSubmissions,
      totalUsers
    ] = await Promise.all([
      prisma.cafeSubmission.count({ where: { status: import_client18.CafeSubmissionStatus.PENDING } }),
      prisma.cafeReview.count({ where: { status: import_client18.ReviewStatus.PENDING } }),
      prisma.cafe.count({ where: { status: import_client18.CafeStatus.PUBLISHED } }),
      prisma.cafeSubmission.count({ where: { status: import_client18.CafeSubmissionStatus.REJECTED } }),
      prisma.user.count()
    ]);
    return {
      pendingCafeSubmissions,
      pendingReviews,
      publishedCafes,
      rejectedSubmissions,
      totalUsers
    };
  }
  // --- Cafe Submissions ---
  async getSubmissions(filters) {
    const { status, search, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = {
      ...status && status !== "ALL" && { status },
      ...search && {
        OR: [
          { name: { contains: search } },
          { city: { contains: search } },
          { submittedBy: { name: { contains: search } } },
          { submittedBy: { email: { contains: search } } }
        ]
      }
    };
    const [data, total] = await Promise.all([
      prisma.cafeSubmission.findMany({
        where,
        include: {
          submittedBy: {
            select: { id: true, name: true, email: true }
          },
          photos: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit
      }),
      prisma.cafeSubmission.count({ where })
    ]);
    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }
  async getSubmissionById(id) {
    return prisma.cafeSubmission.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        photos: true,
        amenities: {
          include: { amenity: true }
        }
      }
    });
  }
  async approveSubmission(submissionId, adminId) {
    return prisma.$transaction(async (tx) => {
      const submission = await tx.cafeSubmission.findUnique({
        where: { id: submissionId },
        include: {
          amenities: true,
          photos: true
        }
      });
      if (!submission) throw new Error("Submission not found");
      if (submission.status !== import_client18.CafeSubmissionStatus.PENDING) throw new Error("Submission is not in PENDING status");
      const requiredFields = [
        ["name", submission.name],
        ["short description", submission.shortDescription],
        ["address", submission.address],
        ["city", submission.city],
        ["country", submission.country]
      ];
      const missingField = requiredFields.find(([, value]) => !value?.trim());
      if (missingField) {
        throw new Error(`Submission is missing required field: ${missingField[0]}`);
      }
      const existingCafe = await tx.cafe.findFirst({
        where: {
          name: { equals: submission.name },
          address: { equals: submission.address },
          city: { equals: submission.city },
          status: "PUBLISHED"
        }
      });
      if (existingCafe) {
        throw new Error("Possible duplicate cafe found in public listings");
      }
      let slug = generateSlug(submission.name);
      let uniqueSlug = slug;
      let counter = 1;
      while (await tx.cafe.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      const cafe = await tx.cafe.create({
        data: {
          name: sanitizePlain(submission.name),
          slug: uniqueSlug,
          shortDescription: sanitizePlain(submission.shortDescription.trim()),
          description: sanitizePlain(submission.description.trim()),
          address: sanitizePlain(submission.address),
          city: sanitizePlain(submission.city),
          state: submission.state ? sanitizePlain(submission.state.trim()) : "",
          country: sanitizePlain(submission.country),
          postalCode: submission.postalCode ? sanitizePlain(submission.postalCode.trim()) : "",
          latitude: submission.latitude === null ? null : Number(submission.latitude),
          longitude: submission.longitude === null ? null : Number(submission.longitude),
          phone: submission.phone ? sanitizePlain(submission.phone.trim()) : null,
          email: submission.email ? sanitizePlain(submission.email.trim()) : null,
          website: submission.website ? sanitizePlain(submission.website.trim()) : null,
          instagram: submission.instagram ? sanitizePlain(submission.instagram.trim()) : null,
          facebook: submission.facebook ? sanitizePlain(submission.facebook.trim()) : null,
          priceRange: submission.priceRange,
          status: import_client18.CafeStatus.PUBLISHED,
          verified: false,
          featured: false,
          trending: false,
          ownerId: null,
          // Initial approval has no owner yet unless claimed later
          amenities: {
            create: submission.amenities.map((a) => ({
              amenityId: a.amenityId
            }))
          },
          photos: {
            create: submission.photos.map((p, index) => ({
              url: p.url,
              caption: p.caption,
              sortOrder: p.sortOrder || index,
              isCover: index === 0
              // First photo as cover by default
            }))
          }
        }
      });
      await tx.cafeSubmission.update({
        where: { id: submissionId },
        data: {
          status: import_client18.CafeSubmissionStatus.APPROVED,
          cafeId: cafe.id
        }
      });
      await tx.activityLog.create({
        data: {
          userId: adminId,
          action: "ADMIN_APPROVED_CAFE_SUBMISSION",
          entityType: "CafeSubmission",
          entityId: submissionId,
          description: `Approved cafe submission: ${submission.name}`
        }
      });
      const submitter = await tx.user.findUnique({ where: { id: submission.submittedById } });
      if (submitter) {
        emailService.sendCafeSubmissionApprovedEmail(
          { id: submitter.id, name: submitter.name, email: submitter.email },
          { name: cafe.name, slug: cafe.slug }
        ).catch((err) => console.error("[AdminService]: Failed to send submission approval email:", err));
      }
      return cafe;
    });
  }
  async rejectSubmission(submissionId, adminId, reason) {
    if (!reason || reason.length < 5) {
      throw new Error("Rejection reason must be at least 5 characters long");
    }
    const submission = await prisma.cafeSubmission.findUnique({
      where: { id: submissionId }
    });
    if (!submission) throw new Error("Submission not found");
    if (submission.status !== import_client18.CafeSubmissionStatus.PENDING) throw new Error("Only pending submissions can be rejected");
    const updated = await prisma.cafeSubmission.update({
      where: { id: submissionId },
      data: {
        status: import_client18.CafeSubmissionStatus.REJECTED,
        rejectionReason: reason
      }
    });
    await this.activityLogService.logAction({
      userId: adminId,
      action: "ADMIN_REJECTED_CAFE_SUBMISSION",
      entityType: "CafeSubmission",
      entityId: submissionId,
      description: `Rejected submission: ${submission.name}. Reason: ${reason}`
    });
    const submitter = await prisma.user.findUnique({ where: { id: submission.submittedById } });
    if (submitter) {
      emailService.sendCafeSubmissionRejectedEmail(
        { id: submitter.id, name: submitter.name, email: submitter.email },
        submission.name,
        reason
      ).catch((err) => console.error("[AdminService]: Failed to send submission rejection email:", err));
    }
    return updated;
  }
  async reopenSubmission(submissionId, adminId) {
    const submission = await prisma.cafeSubmission.findUnique({
      where: { id: submissionId }
    });
    if (!submission) throw new Error("Submission not found");
    const updated = await prisma.cafeSubmission.update({
      where: { id: submissionId },
      data: {
        status: import_client18.CafeSubmissionStatus.PENDING,
        rejectionReason: null
      }
    });
    await this.activityLogService.logAction({
      userId: adminId,
      action: "ADMIN_REOPENED_CAFE_SUBMISSION",
      entityType: "CafeSubmission",
      entityId: submissionId,
      description: `Reopened submission: ${submission.name}`
    });
    return updated;
  }
  // --- Reviews ---
  async getReviews(filters) {
    const { status, search, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = {
      ...status && status !== "ALL" && { status },
      ...search && {
        OR: [
          { comment: { contains: search } },
          { cafe: { name: { contains: search } } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } }
        ]
      }
    };
    const [data, total] = await Promise.all([
      prisma.cafeReview.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          cafe: { select: { id: true, name: true } },
          photos: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit
      }),
      prisma.cafeReview.count({ where })
    ]);
    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }
  async getReviewById(id) {
    return prisma.cafeReview.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        cafe: { select: { id: true, name: true, slug: true } },
        photos: true
      }
    });
  }
  async moderateReview(reviewId, adminId, status) {
    const review = await this.reviewService.updateReviewStatus(reviewId, status);
    await this.activityLogService.logAction({
      userId: adminId,
      action: `ADMIN_${status}_REVIEW`,
      entityType: "CafeReview",
      entityId: reviewId,
      description: `Set review status to ${status}`
    });
    return review;
  }
  async deleteReviewPhoto(reviewId, photoId, adminId) {
    await this.reviewService.deleteReviewPhoto(adminId, photoId, true);
    await this.activityLogService.logAction({
      userId: adminId,
      action: "ADMIN_DELETED_REVIEW_PHOTO",
      entityType: "CafeReviewPhoto",
      entityId: photoId,
      description: `Deleted photo from review ${reviewId}`
    });
    return true;
  }
  // --- Cafes ---
  async getCafes(filters) {
    const { status, verified, featured, trending, city, search, sortBy, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = {
      ...status && { status },
      ...verified !== void 0 && { verified: verified === "true" },
      ...featured !== void 0 && { featured: featured === "true" },
      ...trending !== void 0 && { trending: trending === "true" },
      ...city && { city: { equals: city } },
      ...search && {
        OR: [
          { name: { contains: search } },
          { city: { contains: search } },
          { address: { contains: search } }
        ]
      }
    };
    let orderBy = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    if (sortBy === "rating") orderBy = { ratingAverage: "desc" };
    if (sortBy === "name") orderBy = { name: "asc" };
    const [data, total] = await Promise.all([
      prisma.cafe.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
        include: {
          _count: { select: { reviews: true } },
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.cafe.count({ where })
    ]);
    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }
  async updateCafeStatus(cafeId, adminId, status) {
    const cafe = await this.cafeRepository.update(cafeId, { status });
    await this.activityLogService.logAction({
      userId: adminId,
      action: "ADMIN_UPDATED_CAFE_STATUS",
      entityType: "Cafe",
      entityId: cafeId,
      description: `Updated cafe status to ${status}`
    });
    if (cafe.ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: cafe.ownerId } });
      if (owner) {
        if (status === import_client18.CafeStatus.PUBLISHED) {
          emailService.queueEmail("CAFE_PUBLISHED", owner.email, {
            name: owner.name,
            cafeName: cafe.name,
            cafeUrl: `${process.env.APP_URL || `http://localhost:${process.env.PORT || 3e3}`}/cafes/${cafe.slug}`
          }, owner.id).catch((err) => console.error("[AdminService]: Failed to send cafe published email:", err));
        } else if (status === import_client18.CafeStatus.SUSPENDED) {
          emailService.queueEmail("CAFE_SUSPENDED", owner.email, {
            name: owner.name,
            cafeName: cafe.name,
            reason: "Profile was suspended by an administrator."
          }, owner.id).catch((err) => console.error("[AdminService]: Failed to send cafe suspended email:", err));
        }
      }
    }
    return cafe;
  }
  async toggleCafeFlag(cafeId, adminId, flag, value) {
    const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) throw new Error("Cafe not found");
    if (flag === "featured" || flag === "trending") {
      if (value && cafe.status !== "PUBLISHED") {
        throw new Error(`Only published cafes can be marked as ${flag}`);
      }
    }
    const updated = await this.cafeRepository.update(cafeId, { [flag]: value });
    await this.activityLogService.logAction({
      userId: adminId,
      action: `ADMIN_${value ? "SET" : "UNSET"}_CAFE_${flag.toUpperCase()}`,
      entityType: "Cafe",
      entityId: cafeId,
      description: `${value ? "Enabled" : "Disabled"} ${flag} for cafe: ${cafe.name}`
    });
    return updated;
  }
  async updateCafeOwner(cafeId, adminId, ownerId) {
    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      include: { owner: true }
    });
    if (!cafe) throw new Error("Cafe not found");
    const updated = await prisma.cafe.update({
      where: { id: cafeId },
      data: {
        ownerId
        // If assigning an owner, we should probably ensure they have the OWNER role
        // or at least make them aware they now own this cafe.
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });
    if (ownerId) {
      const newOwner = await prisma.user.findUnique({ where: { id: ownerId } });
      if (newOwner && newOwner.role === import_client18.Role.USER) {
        await prisma.user.update({
          where: { id: ownerId },
          data: { role: import_client18.Role.OWNER }
        });
      }
    }
    await this.activityLogService.logAction({
      userId: adminId,
      action: "ADMIN_UPDATED_CAFE_OWNER",
      entityType: "Cafe",
      entityId: cafeId,
      description: `Updated cafe owner for ${cafe.name}. Old owner: ${cafe.owner?.email || "None"}, New owner: ${updated.owner?.email || "None"}`
    });
    return updated;
  }
  // --- Users ---
  async getUsers(filters) {
    const { role, status, search, page = 1, limit = 20 } = filters;
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = {
      ...role && { role },
      ...status && { status },
      ...search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      }
    };
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit
      }),
      prisma.user.count({ where })
    ]);
    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }
  async updateUserStatus(userId, adminId, status) {
    if (userId === adminId) {
      throw new Error("You cannot change your own status");
    }
    const user = await this.userRepository.update(userId, { status });
    await this.activityLogService.logAction({
      userId: adminId,
      action: "ADMIN_UPDATED_USER_STATUS",
      entityType: "User",
      entityId: userId,
      description: `Updated user status to ${status} for ${user.email}`
    });
    return user;
  }
};

// server/src/controllers/adminController.ts
init_dataIntegrityService();

// server/src/services/cafeDuplicateService.ts
init_database();
var CafeDuplicateService = class {
  /**
   * Normalizes a string for comparison (lowercase, alphanumeric only)
   */
  normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  /**
   * Checks for potential duplicates for a new cafe or submission
   */
  async findDuplicates(data) {
    const normalizedName = this.normalize(data.name);
    const matches = [];
    const cafes = await prisma.cafe.findMany({
      where: {
        city: { equals: data.city, mode: "insensitive" }
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        website: true,
        phone: true
      }
    });
    for (const cafe of cafes) {
      const cafeName = this.normalize(cafe.name);
      if (cafeName === normalizedName) {
        matches.push({
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          city: cafe.city,
          reason: "Exact name and city match",
          confidence: "high"
        });
        continue;
      }
      if (cafeName.includes(normalizedName) || normalizedName.includes(cafeName)) {
        if (this.normalize(cafe.address) === this.normalize(data.address)) {
          matches.push({
            id: cafe.id,
            name: cafe.name,
            address: cafe.address,
            city: cafe.city,
            reason: "Similar name and same address",
            confidence: "high"
          });
          continue;
        }
      }
      if (data.website && cafe.website && this.normalize(data.website) === this.normalize(cafe.website)) {
        matches.push({
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          city: cafe.city,
          reason: "Website match",
          confidence: "medium"
        });
        continue;
      }
      if (data.phone && cafe.phone && this.normalize(data.phone) === this.normalize(cafe.phone)) {
        matches.push({
          id: cafe.id,
          name: cafe.name,
          address: cafe.address,
          city: cafe.city,
          reason: "Phone match",
          confidence: "medium"
        });
        continue;
      }
    }
    return matches;
  }
  /**
   * Checks if a user has already submitted a very similar cafe that is still pending
   */
  async hasPendingDuplicate(userId, name, city) {
    const normalizedName = this.normalize(name);
    const pendingSubmissions = await prisma.cafeSubmission.findMany({
      where: {
        submittedById: userId,
        status: "PENDING",
        city: { equals: city, mode: "insensitive" }
      }
    });
    return pendingSubmissions.some((s) => this.normalize(s.name) === normalizedName);
  }
  /**
   * Scans all cafes to find potential duplicate pairs
   */
  async findAllDuplicates() {
    const cafes = await prisma.cafe.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        website: true
      }
    });
    const duplicates = [];
    const seen = /* @__PURE__ */ new Set();
    for (let i = 0; i < cafes.length; i++) {
      for (let j = i + 1; j < cafes.length; j++) {
        const cafeA = cafes[i];
        const cafeB = cafes[j];
        const normNameA = this.normalize(cafeA.name);
        const normNameB = this.normalize(cafeB.name);
        const normAddrA = this.normalize(cafeA.address);
        const normAddrB = this.normalize(cafeB.address);
        if (normNameA === normNameB && cafeA.city.toLowerCase() === cafeB.city.toLowerCase()) {
          duplicates.push({ cafeA, cafeB, reason: "Identical Name and City" });
        } else if (normAddrA === normAddrB && cafeA.city.toLowerCase() === cafeB.city.toLowerCase() && normAddrA.length > 5) {
          duplicates.push({ cafeA, cafeB, reason: "Identical Address and City" });
        }
      }
    }
    return duplicates;
  }
};
var cafeDuplicateService = new CafeDuplicateService();

// server/src/controllers/adminController.ts
init_deploymentService();
init_cleanupService();

// server/src/services/alertService.ts
init_database();
init_logger();
var import_client20 = require("@prisma/client");
var AlertService = class {
  /**
   * Create or update an operational alert with deduplication.
   */
  async recordAlert(params) {
    try {
      const existing = await prisma.operationalAlert.findUnique({
        where: { key: params.key }
      });
      if (existing) {
        return await prisma.operationalAlert.update({
          where: { key: params.key },
          data: {
            message: params.message,
            severity: params.severity,
            status: existing.status === import_client20.AlertStatus.RESOLVED ? import_client20.AlertStatus.OPEN : existing.status,
            count: { increment: 1 },
            details: params.details || existing.details,
            resolvedAt: null,
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
      }
      return await prisma.operationalAlert.create({
        data: {
          key: params.key,
          severity: params.severity,
          message: params.message,
          source: params.source,
          details: params.details || {},
          status: import_client20.AlertStatus.OPEN
        }
      });
    } catch (err) {
      logger.error(`[AlertService]: Failed to record alert for key ${params.key}`, err);
    }
  }
  async acknowledgeAlert(id, adminId) {
    return prisma.operationalAlert.update({
      where: { id },
      data: {
        status: import_client20.AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: /* @__PURE__ */ new Date(),
        acknowledgedById: adminId
      }
    });
  }
  async resolveAlert(id) {
    return prisma.operationalAlert.update({
      where: { id },
      data: {
        status: import_client20.AlertStatus.RESOLVED,
        resolvedAt: /* @__PURE__ */ new Date()
      }
    });
  }
  async getAlerts(filters) {
    return prisma.operationalAlert.findMany({
      where: {
        ...filters?.status && { status: filters.status },
        ...filters?.severity && { severity: filters.severity }
      },
      orderBy: { createdAt: "desc" }
    });
  }
};
var alertService = new AlertService();

// server/src/controllers/adminController.ts
init_operationalService();
var AdminController = class {
  constructor() {
    this.getAlerts = async (req, res) => {
      try {
        const status = req.query.status;
        const severity = req.query.severity;
        const alerts = await alertService.getAlerts({ status, severity });
        res.json({ success: true, data: alerts });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.acknowledgeAlert = async (req, res) => {
      try {
        const { id } = req.params;
        const alert = await alertService.acknowledgeAlert(id, req.user.id);
        await this.activityLogService.logAction({
          userId: req.user.id,
          action: "ADMIN_ACKNOWLEDGE_ALERT",
          entityType: "OperationalAlert",
          entityId: id,
          description: `Acknowledged alert: ${alert.key}`
        });
        res.json({ success: true, data: alert });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.resolveAlert = async (req, res) => {
      try {
        const { id } = req.params;
        const alert = await alertService.resolveAlert(id);
        await this.activityLogService.logAction({
          userId: req.user.id,
          action: "ADMIN_RESOLVE_ALERT",
          entityType: "OperationalAlert",
          entityId: id,
          description: `Resolved alert: ${alert.key}`
        });
        res.json({ success: true, data: alert });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getDiagnostics = async (req, res) => {
      try {
        const status = await operationalService.getStatus();
        const diagnostics = {
          application: status.application.status,
          database: status.database.status,
          storage: status.storage.availableDiskSpace !== "unknown" ? "healthy" : "warning",
          email: status.email.failedJobs > 10 ? "warning" : "healthy",
          backups: status.backups.status.toLowerCase(),
          jobs: status.jobs.failedCount > 0 ? "warning" : "healthy",
          recommendations: recommendationService.getDiagnostics(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        res.json({ success: true, data: diagnostics });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getSecurityOverview = async (req, res) => {
      try {
        const overview = {
          httpsEnabled: process.env.SSL_ENABLED === "true",
          secureCookies: process.env.NODE_ENV === "production",
          corsConfigured: true,
          rateLimitingEnabled: true,
          productionDebugDisabled: process.env.NODE_ENV === "production",
          databasePubliclyExposed: false,
          environment: process.env.NODE_ENV || "development",
          nodeVersion: process.version
        };
        res.json({ success: true, data: overview });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getDashboardStats = async (req, res) => {
      try {
        const stats = await this.adminService.getDashboardStats();
        res.json({ success: true, data: stats });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    // --- Cafe Submissions ---
    this.getSubmissions = async (req, res) => {
      try {
        const filters = {
          status: req.query.status,
          search: req.query.search,
          page: Math.max(parseInt(req.query.page) || 1, 1),
          limit: Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50)
        };
        const result = await this.adminService.getSubmissions(filters);
        res.json({ success: true, ...result });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getSubmissionById = async (req, res) => {
      try {
        const submission = await this.adminService.getSubmissionById(req.params.id);
        if (!submission) {
          return res.status(404).json({ success: false, error: { message: "Submission not found" } });
        }
        res.json({ success: true, data: submission });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.approveSubmission = async (req, res) => {
      try {
        const result = await this.adminService.approveSubmission(req.params.id, req.user.id);
        res.json({ success: true, data: result });
      } catch (error) {
        const statusCode = error.message.includes("duplicate") ? 409 : 400;
        res.status(statusCode).json({ success: false, error: { message: error.message } });
      }
    };
    this.rejectSubmission = async (req, res) => {
      try {
        const { reason } = req.body;
        const result = await this.adminService.rejectSubmission(req.params.id, req.user.id, reason);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    this.reopenSubmission = async (req, res) => {
      try {
        const result = await this.adminService.reopenSubmission(req.params.id, req.user.id);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    // --- Reviews ---
    this.getReviews = async (req, res) => {
      try {
        const filters = {
          status: req.query.status,
          search: req.query.search,
          page: Math.max(parseInt(req.query.page) || 1, 1),
          limit: Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50)
        };
        const result = await this.adminService.getReviews(filters);
        res.json({ success: true, ...result });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getReviewById = async (req, res) => {
      try {
        const review = await this.adminService.getReviewById(req.params.id);
        if (!review) {
          return res.status(404).json({ success: false, error: { message: "Review not found" } });
        }
        res.json({ success: true, data: review });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.approveReview = async (req, res) => {
      try {
        const result = await this.adminService.moderateReview(req.params.id, req.user.id, "APPROVED");
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    this.rejectReview = async (req, res) => {
      try {
        const result = await this.adminService.moderateReview(req.params.id, req.user.id, "REJECTED");
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    this.hideReview = async (req, res) => {
      try {
        const result = await this.adminService.moderateReview(req.params.id, req.user.id, "HIDDEN");
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    this.restoreReview = async (req, res) => {
      try {
        const result = await this.adminService.moderateReview(req.params.id, req.user.id, "APPROVED");
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    this.deleteReviewPhoto = async (req, res) => {
      try {
        const { reviewId, photoId } = req.params;
        await this.adminService.deleteReviewPhoto(reviewId, photoId, req.user.id);
        res.json({ success: true, message: "Photo deleted" });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    // --- Cafes ---
    this.getCafes = async (req, res) => {
      try {
        const filters = {
          status: req.query.status,
          verified: req.query.verified,
          featured: req.query.featured,
          trending: req.query.trending,
          city: req.query.city,
          search: req.query.search,
          sortBy: req.query.sortBy,
          page: Math.max(parseInt(req.query.page) || 1, 1),
          limit: Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50)
        };
        const result = await this.adminService.getCafes(filters);
        res.json({ success: true, ...result });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getCafeById = async (req, res) => {
      try {
        const cafe = await this.cafeService.getCafeBySlug(req.params.id, req.user.id);
        if (!cafe) {
          const cafeById = await this.adminService.getCafes({ search: req.params.id });
          if (cafeById.data.length === 0) {
            return res.status(404).json({ success: false, error: { message: "Cafe not found" } });
          }
          return res.json({ success: true, data: cafeById.data[0] });
        }
        res.json({ success: true, data: cafe });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.updateCafeStatus = async (req, res) => {
      try {
        const { status } = req.body;
        const result = await this.adminService.updateCafeStatus(req.params.id, req.user.id, status);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    this.toggleCafeFlag = async (req, res) => {
      try {
        const { flag, value } = req.body;
        const result = await this.adminService.toggleCafeFlag(req.params.id, req.user.id, flag, value);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    this.updateCafeOwner = async (req, res) => {
      try {
        const { ownerId } = req.body;
        const result = await this.adminService.updateCafeOwner(req.params.id, req.user.id, ownerId);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    // --- Users ---
    this.getUsers = async (req, res) => {
      try {
        const filters = {
          role: req.query.role,
          status: req.query.status,
          search: req.query.search,
          page: Math.max(parseInt(req.query.page) || 1, 1),
          limit: Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50)
        };
        const result = await this.adminService.getUsers(filters);
        res.json({ success: true, ...result });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.updateUserStatus = async (req, res) => {
      try {
        const { status } = req.body;
        const result = await this.adminService.updateUserStatus(req.params.id, req.user.id, status);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: { message: error.message } });
      }
    };
    // --- Activity Logs ---
    this.getActivityLogs = async (req, res) => {
      try {
        const filters = {
          userId: req.query.userId,
          action: req.query.action,
          entityType: req.query.entityType,
          entityId: req.query.entityId,
          search: req.query.search,
          page: Math.max(parseInt(req.query.page) || 1, 1),
          limit: Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50)
        };
        const result = await this.activityLogService.getLogs(filters);
        res.json({ success: true, ...result });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getSystemStatus = async (req, res) => {
      try {
        const { operationalService: operationalService2 } = await Promise.resolve().then(() => (init_operationalService(), operationalService_exports));
        const status = await operationalService2.getStatus();
        res.json({ success: true, data: status });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.toggleMaintenanceMode = async (req, res) => {
      try {
        const { enabled } = req.body;
        const { operationalService: operationalService2 } = await Promise.resolve().then(() => (init_operationalService(), operationalService_exports));
        operationalService2.setMaintenanceMode(!!enabled);
        res.json({ success: true, maintenanceMode: !!enabled });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.resetMetrics = async (req, res) => {
      try {
        const { metricsService: metricsService2 } = await Promise.resolve().then(() => (init_metricsService(), metricsService_exports));
        metricsService2.resetMetrics();
        res.json({ success: true, message: "Metrics reset" });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.runBackup = async (req, res) => {
      try {
        const { backupService: backupService2 } = await Promise.resolve().then(() => (init_backupService(), backupService_exports));
        backupService2.backupDatabase().catch((err) => console.error("Background DB backup failed:", err));
        backupService2.backupUploads().catch((err) => console.error("Background Uploads backup failed:", err));
        res.json({ success: true, message: "Backup processes started in background" });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.runCleanup = async (req, res) => {
      try {
        cleanupService.runAll().catch((err) => console.error("Background cleanup failed:", err));
        res.json({ success: true, message: "Cleanup process started in background" });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getDeployments = async (req, res) => {
      try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const result = await deploymentService.getDeployments({ page, limit });
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getReleaseMetadata = async (req, res) => {
      try {
        const metadata = deploymentService.getReleaseMetadata();
        res.json({ success: true, data: metadata });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    // --- Data Integrity & Maintenance ---
    this.getDataIntegrityReport = async (req, res) => {
      try {
        const report = await dataIntegrityService.getIntegrityReport();
        res.json({ success: true, data: report });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.recalculateCafeRatings = async (req, res) => {
      try {
        const { id } = req.params;
        if (id === "all") {
          const count = await dataIntegrityService.recalculateAllCafeRatings();
          return res.json({ success: true, data: { fixedCount: count } });
        }
        const result = await dataIntegrityService.recalculateCafeRatings(id);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.cleanupMedia = async (req, res) => {
      try {
        const { type } = req.query;
        let count = 0;
        if (type === "missing") {
          const result = await dataIntegrityService.cleanupMissingMedia();
          count = result.processedCount;
        } else if (type === "orphaned") {
          const result = await dataIntegrityService.cleanupOrphanedFiles();
          count = result.processedCount;
        } else {
          return res.status(400).json({ success: false, error: { message: "Invalid cleanup type" } });
        }
        res.json({ success: true, data: { removedCount: count } });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.repairOrphanedReviews = async (req, res) => {
      try {
        const count = await dataIntegrityService.repairOrphanedReviews();
        res.json({ success: true, data: { repairedCount: count } });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.findDuplicateCafes = async (req, res) => {
      try {
        const { name, city, address } = req.query;
        if (!name && !city && !address) {
          const duplicates = await cafeDuplicateService.findAllDuplicates();
          return res.json({ success: true, data: duplicates });
        }
        if (!name || !city || !address) {
          return res.status(400).json({ success: false, error: { message: "Missing required query parameters for specific search" } });
        }
        const matches = await cafeDuplicateService.findDuplicates({ name, city, address });
        res.json({ success: true, data: matches });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    // --- Maintenance Jobs ---
    this.getMaintenanceJobs = async (req, res) => {
      try {
        const { jobRunnerService: jobRunnerService2 } = await Promise.resolve().then(() => (init_jobRunnerService(), jobRunnerService_exports));
        const jobs = await jobRunnerService2.getJobsStatus();
        res.json({ success: true, data: jobs });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.getJobRuns = async (req, res) => {
      try {
        const { jobRunnerService: jobRunnerService2 } = await Promise.resolve().then(() => (init_jobRunnerService(), jobRunnerService_exports));
        const limit = parseInt(req.query.limit) || 20;
        const runs = await jobRunnerService2.getRecentRuns(limit);
        res.json({ success: true, data: runs });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.runJob = async (req, res) => {
      try {
        const { jobName } = req.params;
        const { jobRunnerService: jobRunnerService2 } = await Promise.resolve().then(() => (init_jobRunnerService(), jobRunnerService_exports));
        const { backupService: backupService2 } = await Promise.resolve().then(() => (init_backupService(), backupService_exports));
        const { dataIntegrityService: dataIntegrityService2 } = await Promise.resolve().then(() => (init_dataIntegrityService(), dataIntegrityService_exports));
        const { cleanupService: cleanupService2 } = await Promise.resolve().then(() => (init_cleanupService(), cleanupService_exports));
        let executionId;
        switch (jobName) {
          case "backup-database":
            executionId = await jobRunnerService2.runJob("backup-database", async () => {
              await backupService2.backupDatabase();
              return { processedCount: 1, successCount: 1, failureCount: 0 };
            });
            break;
          case "backup-uploads":
            executionId = await jobRunnerService2.runJob("backup-uploads", async () => {
              await backupService2.backupUploads();
              return { processedCount: 1, successCount: 1, failureCount: 0 };
            });
            break;
          case "verify-backups":
            executionId = await jobRunnerService2.runJob("verify-backups", () => backupService2.verifyBackups());
            break;
          case "system-cleanup":
            executionId = await jobRunnerService2.runJob("system-cleanup", () => cleanupService2.runAll());
            break;
          case "data-integrity-scan":
            executionId = await jobRunnerService2.runJob("data-integrity-scan", async () => {
              const report = await dataIntegrityService2.getIntegrityReport();
              return { processedCount: 1, successCount: 1, failureCount: 0, message: "Scan complete" };
            });
            break;
          case "recalculate-ratings":
            executionId = await jobRunnerService2.runJob("recalculate-ratings", () => dataIntegrityService2.recalculateAllCafeRatings());
            break;
          case "cleanup-missing-media":
            executionId = await jobRunnerService2.runJob("cleanup-missing-media", () => dataIntegrityService2.cleanupMissingMedia());
            break;
          case "cleanup-orphaned-media":
            executionId = await jobRunnerService2.runJob("cleanup-orphaned-media", () => dataIntegrityService2.cleanupOrphanedFiles());
            break;
          case "repair-orphaned-reviews":
            executionId = await jobRunnerService2.runJob("repair-orphaned-reviews", () => dataIntegrityService2.repairOrphanedReviews());
            break;
          case "release-cleanup":
            executionId = await jobRunnerService2.runJob("release-cleanup", async () => {
              const { deploymentService: deploymentService2 } = await Promise.resolve().then(() => (init_deploymentService(), deploymentService_exports));
              const count = await deploymentService2.cleanupOldReleases();
              return { processedCount: count, successCount: count, failureCount: 0, message: `Cleaned up ${count} old releases` };
            });
            break;
          case "certificate-monitoring":
            executionId = await jobRunnerService2.runJob("certificate-monitoring", async () => {
              const hasSSL = process.env.SSL_ENABLED === "true";
              return { processedCount: 1, successCount: 1, failureCount: 0, message: hasSSL ? "SSL Active" : "SSL Not Configured" };
            });
            break;
          default:
            return res.status(400).json({ success: false, error: { message: `Invalid job name: ${jobName}` } });
        }
        res.json({ success: true, data: { executionId } });
      } catch (error) {
        res.status(500).json({ success: false, error: { message: error.message } });
      }
    };
    this.adminService = new AdminService();
    this.activityLogService = new ActivityLogService();
    this.cafeService = new CafeService();
  }
};

// server/src/controllers/changeRequestController.ts
var import_zod11 = require("zod");

// server/src/services/changeRequestService.ts
var import_client21 = require("@prisma/client");
init_database();
var fail2 = (message, status = 400) => Object.assign(new Error(message), { status });
var ChangeRequestService = class {
  constructor() {
    this.activityLogs = new ActivityLogService();
  }
  async list(filters) {
    const { status, type, search, page, limit } = filters;
    const where = { ...status && { status }, ...type && { type }, ...search && { OR: [{ cafe: { name: { contains: search } } }, { requestedBy: { name: { contains: search } } }, { requestedBy: { email: { contains: search } } }] } };
    const [requests, total] = await Promise.all([
      prisma.cafeChangeRequest.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { cafe: { select: { id: true, name: true, slug: true } }, requestedBy: { select: { id: true, name: true, email: true } } } }),
      prisma.cafeChangeRequest.count({ where })
    ]);
    return { data: requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async create(data) {
    const cafe = await prisma.cafe.findUnique({ where: { id: data.cafeId } });
    if (!cafe) throw fail2("Cafe not found", 404);
    if (cafe.ownerId !== data.userId) throw fail2("Unauthorized: Only the owner can request changes for this cafe", 403);
    const existing = await prisma.cafeChangeRequest.findFirst({
      where: {
        cafeId: data.cafeId,
        type: data.type,
        status: import_client21.CafeChangeRequestStatus.PENDING
      }
    });
    if (existing) throw fail2(`There is already a pending ${data.type} change request for this cafe`, 409);
    const request = await prisma.cafeChangeRequest.create({
      data: {
        cafeId: data.cafeId,
        requestedById: data.userId,
        type: data.type,
        payload: data.payload,
        reason: data.reason,
        status: import_client21.CafeChangeRequestStatus.PENDING
      },
      include: {
        cafe: { select: { name: true } }
      }
    });
    await this.activityLogs.logAction({
      userId: data.userId,
      action: "CAFE_CHANGE_REQUEST_CREATED",
      entityType: "CafeChangeRequest",
      entityId: request.id,
      description: `Requested ${data.type} changes for ${request.cafe.name}`
    });
    return request;
  }
  async listForOwner(userId, filters) {
    const { page, limit } = filters;
    const where = { requestedById: userId };
    const [requests, total] = await Promise.all([
      prisma.cafeChangeRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { cafe: { select: { name: true, slug: true } } }
      }),
      prisma.cafeChangeRequest.count({ where })
    ]);
    return { data: requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
  async get(id) {
    const request = await prisma.cafeChangeRequest.findUnique({ where: { id }, include: { cafe: true, requestedBy: { select: { id: true, name: true, email: true } } } });
    if (!request) throw fail2("Change request not found", 404);
    return request;
  }
  async approve(id, adminId) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.cafeChangeRequest.findUnique({ where: { id }, include: { cafe: true } });
      if (!request) throw fail2("Change request not found", 404);
      if (request.status !== import_client21.CafeChangeRequestStatus.PENDING) throw fail2("Change request has already been processed", 409);
      if (!request.cafe.ownerId || request.cafe.ownerId !== request.requestedById) throw fail2("The requester no longer owns this cafe", 403);
      const payload = request.payload;
      const data = {};
      if (request.type === import_client21.CafeChangeRequestType.BUSINESS_INFO) {
        for (const field of ["shortDescription", "description", "phone", "email", "website", "instagram", "facebook", "priceRange"]) if (payload[field] !== void 0) data[field] = payload[field];
      } else if (request.type === import_client21.CafeChangeRequestType.LOCATION) {
        for (const field of ["address", "city", "state", "country", "postalCode", "latitude", "longitude"]) if (payload[field] !== void 0) data[field] = payload[field];
      } else throw fail2("This change request type is not supported for automatic approval", 422);
      const now = /* @__PURE__ */ new Date();
      await tx.cafe.update({ where: { id: request.cafeId }, data });
      const updated = await tx.cafeChangeRequest.update({ where: { id, status: import_client21.CafeChangeRequestStatus.PENDING }, data: { status: import_client21.CafeChangeRequestStatus.APPROVED, reviewedById: adminId, reviewedAt: now }, include: { cafe: { select: { id: true, name: true, slug: true } } } });
      await tx.activityLog.create({ data: { userId: adminId, action: "ADMIN_APPROVED_CAFE_CHANGE_REQUEST", entityType: "CafeChangeRequest", entityId: id, description: `Approved ${request.type} change request for ${request.cafe.name}` } });
      await tx.notification.create({ data: { userId: request.requestedById, title: "Your cafe changes were approved.", message: `Changes for ${request.cafe.name} were approved.`, type: "CAFE_CHANGE_REQUEST_APPROVED" } });
      const user = await tx.user.findUnique({ where: { id: request.requestedById } });
      if (user) {
        emailService.sendChangeRequestApprovedEmail(
          { id: user.id, name: user.name, email: user.email },
          request.cafe.name,
          request.type
        ).catch((err) => console.error("[ChangeRequestService]: Failed to send change request approval email:", err));
      }
      return updated;
    });
  }
  async reject(id, adminId, reason) {
    const request = await prisma.cafeChangeRequest.findUnique({ where: { id }, include: { cafe: true } });
    if (!request) throw fail2("Change request not found", 404);
    if (request.status !== import_client21.CafeChangeRequestStatus.PENDING) throw fail2("Change request has already been processed", 409);
    const updated = await prisma.$transaction(async (tx) => {
      const value = await tx.cafeChangeRequest.update({ where: { id, status: import_client21.CafeChangeRequestStatus.PENDING }, data: { status: import_client21.CafeChangeRequestStatus.REJECTED, adminNotes: reason, reviewedById: adminId, reviewedAt: /* @__PURE__ */ new Date() }, include: { cafe: { select: { id: true, name: true, slug: true } } } });
      await tx.activityLog.create({ data: { userId: adminId, action: "ADMIN_REJECTED_CAFE_CHANGE_REQUEST", entityType: "CafeChangeRequest", entityId: id, description: `Rejected change request for ${request.cafe.name}` } });
      await tx.notification.create({ data: { userId: request.requestedById, title: "Your cafe change request was rejected.", message: `Changes for ${request.cafe.name} were rejected: ${reason}`, type: "CAFE_CHANGE_REQUEST_REJECTED" } });
      const user = await tx.user.findUnique({ where: { id: request.requestedById } });
      if (user) {
        emailService.sendChangeRequestRejectedEmail(
          { id: user.id, name: user.name, email: user.email },
          request.cafe.name,
          request.type,
          reason
        ).catch((err) => console.error("[ChangeRequestService]: Failed to send change request rejection email:", err));
      }
      return value;
    });
    return updated;
  }
};

// server/src/controllers/changeRequestController.ts
var reasonSchema = import_zod11.z.object({ reason: import_zod11.z.string().trim().min(5).max(1e3) });
var sendError2 = (res, error) => res.status(error.status || (error.name === "ZodError" ? 422 : 400)).json({ success: false, error: { message: error.message, details: error.issues } });
var ChangeRequestController = class {
  constructor() {
    this.service = new ChangeRequestService();
    this.list = async (req, res) => {
      try {
        const status = req.query.status;
        const type = req.query.type;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
        res.json({ success: true, ...await this.service.list({ status, type, search: req.query.search, page, limit }) });
      } catch (e) {
        sendError2(res, e);
      }
    };
    this.create = async (req, res) => {
      try {
        const { cafeId, type, payload, reason } = req.body;
        if (!cafeId || !type || !payload || !reason) {
          return res.status(400).json({ success: false, error: { message: "Missing required fields" } });
        }
        const result = await this.service.create({
          cafeId,
          userId: req.user.id,
          type,
          payload,
          reason
        });
        res.json({ success: true, data: result });
      } catch (e) {
        sendError2(res, e);
      }
    };
    this.listMyRequests = async (req, res) => {
      try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
        const result = await this.service.listForOwner(req.user.id, { page, limit });
        res.json({ success: true, ...result });
      } catch (e) {
        sendError2(res, e);
      }
    };
    this.get = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.get(req.params.id) });
      } catch (e) {
        sendError2(res, e);
      }
    };
    this.approve = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.approve(req.params.id, req.user.id) });
      } catch (e) {
        sendError2(res, e);
      }
    };
    this.reject = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.reject(req.params.id, req.user.id, reasonSchema.parse(req.body).reason) });
      } catch (e) {
        sendError2(res, e);
      }
    };
  }
};

// server/src/services/mediaService.ts
init_database();
var import_path11 = __toESM(require("path"), 1);
var import_fs10 = __toESM(require("fs"), 1);
var MediaService = class {
  /**
   * Register a file as a MediaAsset
   */
  async registerAsset(data) {
    return prisma.mediaAsset.create({
      data: {
        ...data
      }
    });
  }
  /**
   * Get paginated media assets
   */
  async getAssets(params) {
    const { page = 1, limit = 20, mimeType, uploadedById, search } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (mimeType) where.mimeType = { startsWith: mimeType };
    if (uploadedById) where.uploadedById = uploadedById;
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { originalName: { contains: search, mode: "insensitive" } },
        { altText: { contains: search, mode: "insensitive" } },
        { caption: { contains: search, mode: "insensitive" } }
      ];
    }
    const [total, assets] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ]);
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      assets
    };
  }
  /**
   * Get media asset by ID with usage details
   */
  async getAssetById(id) {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        },
        cafePhotos: {
          include: {
            cafe: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        blogPosts: {
          select: { id: true, title: true, slug: true }
        },
        curatedLists: {
          select: { id: true, title: true, slug: true }
        }
      }
    });
    if (!asset) return null;
    return asset;
  }
  /**
   * Update media asset metadata
   */
  async updateAsset(id, data) {
    return prisma.mediaAsset.update({
      where: { id },
      data
    });
  }
  /**
   * Delete media asset
   */
  async deleteAsset(id) {
    const asset = await this.getAssetById(id);
    if (!asset) throw new Error("Asset not found");
    const isUsed = asset.cafePhotos.length > 0 || asset.blogPosts.length > 0 || asset.curatedLists.length > 0;
    if (isUsed) {
      throw new Error("Asset is actively used and cannot be deleted.");
    }
    await prisma.mediaAsset.delete({ where: { id } });
    const filePath = import_path11.default.join(process.cwd(), asset.url.replace(/^\//, ""));
    if (import_fs10.default.existsSync(filePath)) {
      import_fs10.default.unlinkSync(filePath);
    }
    if (asset.thumbnailUrl) {
      const thumbPath = import_path11.default.join(process.cwd(), asset.thumbnailUrl.replace(/^\//, ""));
      if (import_fs10.default.existsSync(thumbPath)) {
        import_fs10.default.unlinkSync(thumbPath);
      }
    }
    return true;
  }
  /**
   * Find orphan media assets
   */
  async findOrphans(gracePeriodDays = 30) {
    const graceDate = /* @__PURE__ */ new Date();
    graceDate.setDate(graceDate.getDate() - gracePeriodDays);
    const assets = await prisma.mediaAsset.findMany({
      where: {
        createdAt: { lt: graceDate },
        cafePhotos: { none: {} },
        blogPosts: { none: {} },
        curatedLists: { none: {} }
      },
      include: {
        uploadedBy: { select: { name: true } }
      }
    });
    return assets;
  }
};

// server/src/controllers/mediaController.ts
init_logger();
var mediaService = new MediaService();
var MediaController = class {
  /**
   * List media assets
   */
  async list(req, res) {
    try {
      const { page, limit, mimeType, uploadedById, search } = req.query;
      const result = await mediaService.getAssets({
        page: page ? parseInt(page) : void 0,
        limit: limit ? parseInt(limit) : void 0,
        mimeType,
        uploadedById,
        search
      });
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Error in MediaController.list", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  /**
   * Get media asset details
   */
  async getById(req, res) {
    try {
      const asset = await mediaService.getAssetById(req.params.id);
      if (!asset) {
        return res.status(404).json({ success: false, message: "Asset not found" });
      }
      res.json({ success: true, data: asset });
    } catch (error) {
      logger.error("Error in MediaController.getById", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  /**
   * Update media asset
   */
  async update(req, res) {
    try {
      const asset = await mediaService.updateAsset(req.params.id, req.body);
      res.json({ success: true, data: asset });
    } catch (error) {
      logger.error("Error in MediaController.update", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  /**
   * Delete media asset
   */
  async delete(req, res) {
    try {
      await mediaService.deleteAsset(req.params.id);
      res.json({ success: true, message: "Asset deleted successfully" });
    } catch (error) {
      logger.error("Error in MediaController.delete", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
  /**
   * List orphan media
   */
  async listOrphans(req, res) {
    try {
      const gracePeriod = req.query.gracePeriod ? parseInt(req.query.gracePeriod) : 30;
      const orphans = await mediaService.findOrphans(gracePeriod);
      res.json({ success: true, data: orphans });
    } catch (error) {
      logger.error("Error in MediaController.listOrphans", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// server/src/controllers/editorialController.ts
init_editorialService();
init_logger();
var editorialService4 = new EditorialService();
var EditorialController = class {
  /**
   * Get revisions for an entity
   */
  async getRevisions(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const revisions = await editorialService4.getRevisions(entityType, entityId);
      res.json({ success: true, data: revisions });
    } catch (error) {
      logger.error("Error in EditorialController.getRevisions", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  /**
   * Restore to a revision
   */
  async restoreRevision(req, res) {
    try {
      const { revisionId } = req.params;
      const authorId = req.user.id;
      await editorialService4.restoreRevision(revisionId, authorId);
      res.json({ success: true, message: "Revision restored successfully" });
    } catch (error) {
      logger.error("Error in EditorialController.restoreRevision", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  /**
   * Run quality checks
   */
  async runQualityChecks(req, res) {
    try {
      const issues = await editorialService4.runQualityChecks();
      res.json({ success: true, data: issues });
    } catch (error) {
      logger.error("Error in EditorialController.runQualityChecks", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  /**
   * Manual trigger for scheduled publishing
   */
  async triggerScheduledPublishing(req, res) {
    try {
      const result = await editorialService4.publishScheduledContent();
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Error in EditorialController.triggerScheduledPublishing", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// server/src/controllers/redirectController.ts
init_logger();
var redirectService4 = new RedirectService();
var RedirectController = class {
  async list(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await redirectService4.listRedirects({
        page: page ? parseInt(page) : void 0,
        limit: limit ? parseInt(limit) : void 0
      });
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Error in RedirectController.list", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async create(req, res) {
    try {
      const { oldPath, newPath, statusCode } = req.body;
      const redirect = await redirectService4.createRedirect(oldPath, newPath, statusCode);
      res.json({ success: true, data: redirect });
    } catch (error) {
      logger.error("Error in RedirectController.create", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async update(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const redirect = await redirectService4.toggleActive(id, isActive);
      res.json({ success: true, data: redirect });
    } catch (error) {
      logger.error("Error in RedirectController.update", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async delete(req, res) {
    try {
      const { id } = req.params;
      await redirectService4.deleteRedirect(id);
      res.json({ success: true, message: "Redirect deleted" });
    } catch (error) {
      logger.error("Error in RedirectController.delete", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// server/src/routes/adminRoutes.ts
var router12 = (0, import_express12.Router)();
var adminController = new AdminController();
var claimController = new ClaimController();
var changeRequestController = new ChangeRequestController();
var blogController2 = new BlogPostController();
var listController2 = new CuratedListController();
var mediaController = new MediaController();
var editorialController = new EditorialController();
var redirectController = new RedirectController();
var testimonialController2 = new TestimonialController();
router12.use(requireAuth);
router12.use(requireRole("ADMIN"));
router12.get("/claims", claimController.getAdminClaims);
router12.get("/claims/:id", claimController.getAdminClaim);
router12.post("/claims/:id/approve", claimController.approveClaim);
router12.post("/claims/:id/reject", claimController.rejectClaim);
router12.post("/claims/:id/reopen", claimController.reopenClaim);
router12.get("/change-requests", changeRequestController.list);
router12.get("/change-requests/:id", changeRequestController.get);
router12.post("/change-requests/:id/approve", changeRequestController.approve);
router12.post("/change-requests/:id/reject", changeRequestController.reject);
router12.get("/dashboard", adminController.getDashboardStats);
router12.get("/cafe-submissions", adminController.getSubmissions);
router12.get("/cafe-submissions/:id", adminController.getSubmissionById);
router12.post("/cafe-submissions/:id/approve", adminController.approveSubmission);
router12.post("/cafe-submissions/:id/reject", adminController.rejectSubmission);
router12.post("/cafe-submissions/:id/reopen", adminController.reopenSubmission);
router12.get("/reviews", adminController.getReviews);
router12.get("/reviews/:id", adminController.getReviewById);
router12.post("/reviews/:id/approve", adminController.approveReview);
router12.post("/reviews/:id/reject", adminController.rejectReview);
router12.post("/reviews/:id/hide", adminController.hideReview);
router12.post("/reviews/:id/restore", adminController.restoreReview);
router12.delete("/reviews/:reviewId/photos/:photoId", adminController.deleteReviewPhoto);
router12.get("/cafes", adminController.getCafes);
router12.get("/cafes/:id", adminController.getCafeById);
router12.patch("/cafes/:id/status", adminController.updateCafeStatus);
router12.patch("/cafes/:id/toggle-flag", adminController.toggleCafeFlag);
router12.patch("/cafes/:id/owner", adminController.updateCafeOwner);
router12.get("/users", adminController.getUsers);
router12.patch("/users/:id/status", adminController.updateUserStatus);
router12.get("/activity-logs", adminController.getActivityLogs);
router12.get("/system/status", adminController.getSystemStatus);
router12.get("/system/diagnostics", adminController.getDiagnostics);
router12.get("/system/security", adminController.getSecurityOverview);
router12.get("/system/deployments", adminController.getDeployments);
router12.get("/system/release", adminController.getReleaseMetadata);
router12.post("/system/maintenance", adminController.toggleMaintenanceMode);
router12.post("/system/metrics/reset", adminController.resetMetrics);
router12.post("/system/backup", adminController.runBackup);
router12.post("/system/cleanup", adminController.runCleanup);
router12.get("/system/alerts", adminController.getAlerts);
router12.post("/system/alerts/:id/acknowledge", adminController.acknowledgeAlert);
router12.post("/system/alerts/:id/resolve", adminController.resolveAlert);
router12.get("/system/jobs", adminController.getMaintenanceJobs);
router12.get("/system/jobs/runs", adminController.getJobRuns);
router12.post("/system/jobs/:jobName/run", adminController.runJob);
router12.get("/system/data-integrity", adminController.getDataIntegrityReport);
router12.get("/system/cafes/duplicates", adminController.findDuplicateCafes);
router12.get("/system/cafes/find-duplicates", adminController.findDuplicateCafes);
router12.get("/blog", blogController2.getAdminPosts);
router12.get("/blog/:id", blogController2.getById);
router12.post("/blog", blogController2.create);
router12.patch("/blog/:id", blogController2.update);
router12.delete("/blog/:id", blogController2.delete);
router12.patch("/blog/:id/status", blogController2.updateStatus);
router12.get("/lists", listController2.getAdminLists);
router12.get("/lists/:id", listController2.getById);
router12.post("/lists", listController2.create);
router12.patch("/lists/:id", listController2.update);
router12.delete("/lists/:id", listController2.delete);
router12.patch("/lists/:id/status", listController2.updateStatus);
router12.get("/testimonials", testimonialController2.list);
router12.get("/testimonials/:id", testimonialController2.getById);
router12.post("/testimonials", testimonialController2.create);
router12.patch("/testimonials/:id", testimonialController2.update);
router12.delete("/testimonials/:id", testimonialController2.delete);
router12.get("/media", mediaController.list);
router12.get("/media/orphans", mediaController.listOrphans);
router12.get("/media/:id", mediaController.getById);
router12.patch("/media/:id", mediaController.update);
router12.delete("/media/:id", mediaController.delete);
router12.get("/editorial/quality", editorialController.runQualityChecks);
router12.post("/editorial/publish-scheduled", editorialController.triggerScheduledPublishing);
router12.get("/editorial/revisions/:entityType/:entityId", editorialController.getRevisions);
router12.post("/editorial/revisions/:revisionId/restore", editorialController.restoreRevision);
router12.get("/redirects", redirectController.list);
router12.post("/redirects", redirectController.create);
router12.patch("/redirects/:id", redirectController.update);
router12.delete("/redirects/:id", redirectController.delete);
router12.post("/lists/:id/cafes", listController2.addCafe);
router12.patch("/lists/:id/cafes/:cafeId", listController2.updateCafe);
router12.delete("/lists/:id/cafes/:cafeId", listController2.removeCafe);
var adminRoutes_default = router12;

// server/src/routes/owner.routes.ts
var import_express13 = require("express");

// server/src/controllers/ownerController.ts
var import_zod12 = require("zod");
var import_client23 = require("@prisma/client");

// server/src/services/ownerService.ts
var import_client22 = require("@prisma/client");
var import_promises = __toESM(require("fs/promises"), 1);
var import_path12 = __toESM(require("path"), 1);
init_database();

// server/src/repositories/menuRepository.ts
init_database();
var MenuRepository = class {
  async findByCafeId(cafeId, publicOnly = true) {
    const where = { cafeId };
    if (publicOnly) {
      where.isActive = true;
    }
    return prisma.menu.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        categories: {
          include: {
            items: {
              include: {
                tags: true,
                optionGroups: {
                  include: {
                    options: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  async findById(id) {
    return prisma.menu.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            items: {
              include: {
                tags: true,
                optionGroups: {
                  include: {
                    options: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  async create(data) {
    return prisma.menu.create({ data });
  }
  async update(id, data) {
    return prisma.menu.update({
      where: { id },
      data
    });
  }
  async delete(id) {
    return prisma.menu.delete({
      where: { id }
    });
  }
  // Category operations
  async createCategory(data) {
    return prisma.menuCategory.create({ data });
  }
  async updateCategory(id, data) {
    return prisma.menuCategory.update({
      where: { id },
      data
    });
  }
  async deleteCategory(id) {
    return prisma.menuCategory.delete({
      where: { id }
    });
  }
  // Item operations
  async createItem(data) {
    return prisma.menuItem.create({ data });
  }
  async updateItem(id, data) {
    return prisma.menuItem.update({
      where: { id },
      data
    });
  }
  async deleteItem(id) {
    return prisma.menuItem.delete({
      where: { id }
    });
  }
  // Helper for ownership checks
  async findMenuWithOwnership(menuId) {
    return prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        cafe: {
          select: {
            id: true,
            ownerId: true
          }
        }
      }
    });
  }
  async findCategoryWithOwnership(categoryId) {
    return prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: {
        menu: {
          include: {
            cafe: {
              select: {
                id: true,
                ownerId: true
              }
            }
          }
        }
      }
    });
  }
  async findItemWithOwnership(itemId) {
    return prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          include: {
            menu: {
              include: {
                cafe: {
                  select: {
                    id: true,
                    ownerId: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
};

// server/src/dtos/menuDto.ts
function mapToMenuDto(menu) {
  return {
    id: menu.id,
    cafeId: menu.cafeId,
    name: menu.name,
    description: menu.description,
    isActive: menu.isActive,
    sortOrder: menu.sortOrder,
    categories: (menu.categories || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      sortOrder: cat.sortOrder || 0,
      items: (cat.items || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price ? parseFloat(item.price.toString()) : 0,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
        isFeatured: item.isFeatured,
        sortOrder: item.sortOrder || 0,
        tags: (item.tags || []).map((t) => t.name),
        optionGroups: (item.optionGroups || []).map((group) => ({
          id: group.id,
          name: group.name,
          minSelection: group.minSelection,
          maxSelection: group.maxSelection,
          isRequired: group.isRequired,
          options: (group.options || []).map((opt) => ({
            id: opt.id,
            name: opt.name,
            priceModifier: opt.priceModifier ? parseFloat(opt.priceModifier.toString()) : 0,
            isAvailable: opt.isAvailable
          }))
        }))
      }))
    }))
  };
}

// server/src/services/ownerService.ts
var fail3 = (message, status = 400) => Object.assign(new Error(message), { status });
var ownerCafeInclude = {
  photos: { orderBy: { sortOrder: "asc" } },
  hours: { orderBy: { dayOfWeek: "asc" } },
  amenities: { include: { amenity: true } },
  _count: { select: { reviews: true, favorites: true, photos: true } }
};
var OwnerService = class {
  constructor() {
    this.activityLogs = new ActivityLogService();
    // Menu Management
    this.menuRepository = new MenuRepository();
  }
  async requireCafe(cafeId, userId, isAdmin) {
    const cafe = await prisma.cafe.findFirst({ where: { id: cafeId, ...isAdmin ? {} : { ownerId: userId } } });
    if (!cafe) throw fail3("Cafe not found or access denied", 404);
    return cafe;
  }
  async getDashboard(userId, isAdmin) {
    const cafeWhere = isAdmin ? {} : { ownerId: userId };
    const [claimedCafes, pendingClaims, publishedCafes, pendingChangeRequests, reviews, rating] = await Promise.all([
      prisma.cafe.count({ where: cafeWhere }),
      prisma.cafeOwnerClaim.count({ where: { userId, status: import_client22.ClaimStatus.PENDING } }),
      prisma.cafe.count({ where: { ...cafeWhere, status: import_client22.CafeStatus.PUBLISHED } }),
      prisma.cafeChangeRequest.count({ where: { ...isAdmin ? {} : { requestedById: userId }, status: import_client22.CafeChangeRequestStatus.PENDING } }),
      prisma.cafeReview.count({ where: { cafe: cafeWhere, status: { in: [import_client22.ReviewStatus.PENDING, import_client22.ReviewStatus.APPROVED] } } }),
      prisma.cafe.aggregate({ where: { ...cafeWhere, status: import_client22.CafeStatus.PUBLISHED }, _avg: { ratingAverage: true } })
    ]);
    return { isAdministrativeAccess: isAdmin, claimedCafes, pendingClaims, publishedCafes, pendingChangeRequests, totalReviews: reviews, averageRating: Number(rating._avg.ratingAverage || 0) };
  }
  async getOwnedCafes(userId, isAdmin, page = 1, limit = 20) {
    const where = isAdmin ? {} : { ownerId: userId };
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const [cafes, total] = await Promise.all([
      prisma.cafe.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (safePage - 1) * safeLimit, take: safeLimit, include: ownerCafeInclude }),
      prisma.cafe.count({ where })
    ]);
    return { data: cafes.map((cafe) => this.mapSummary(cafe)), pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }
  async getOwnedCafe(id, userId, isAdmin) {
    const cafe = await prisma.cafe.findFirst({ where: { id, ...isAdmin ? {} : { ownerId: userId } }, include: { ...ownerCafeInclude, owner: { select: { id: true, name: true, email: true } } } });
    if (!cafe) throw fail3("Cafe not found or access denied", 404);
    return { ...cafe, ratingAverage: Number(cafe.ratingAverage) };
  }
  async updateBusiness(cafeId, userId, isAdmin, data) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const updated = await prisma.cafe.update({ where: { id: cafe.id }, data: {
      shortDescription: sanitizePlain(data.shortDescription),
      description: sanitizePlain(data.description),
      address: data.address ? sanitizePlain(data.address) : void 0,
      city: data.city ? sanitizePlain(data.city) : void 0,
      state: data.state ? sanitizePlain(data.state) : "",
      country: data.country ? sanitizePlain(data.country) : void 0,
      postalCode: data.postalCode ? sanitizePlain(data.postalCode) : "",
      phone: data.phone ? sanitizePlain(data.phone) : null,
      email: data.email ? sanitizePlain(data.email) : null,
      website: data.website ? sanitizePlain(data.website) : null,
      instagram: data.instagram ? sanitizePlain(data.instagram) : null,
      facebook: data.facebook ? sanitizePlain(data.facebook) : null,
      priceRange: data.priceRange
    }, include: ownerCafeInclude });
    await this.activityLogs.logAction({ userId, action: "OWNER_UPDATED_CAFE", entityType: "Cafe", entityId: cafe.id, description: `Updated business information for ${cafe.name}` });
    return { ...updated, ratingAverage: Number(updated.ratingAverage) };
  }
  async createChangeRequest(cafeId, userId, type, payload, reason) {
    const cafe = await this.requireCafe(cafeId, userId, false);
    const existing = await prisma.cafeChangeRequest.findFirst({ where: { cafeId, requestedById: userId, type, status: import_client22.CafeChangeRequestStatus.PENDING } });
    if (existing) throw fail3("A pending change request of this type already exists", 409);
    const request = await prisma.cafeChangeRequest.create({ data: { cafeId, requestedById: userId, type, payload, reason } });
    await this.activityLogs.logAction({ userId, action: "OWNER_CREATED_CAFE_CHANGE_REQUEST", entityType: "CafeChangeRequest", entityId: request.id, description: `Created ${type} change request for ${cafe.name}` });
    return request;
  }
  async getChangeRequests(cafeId, userId, isAdmin) {
    await this.requireCafe(cafeId, userId, isAdmin);
    const requests = await prisma.cafeChangeRequest.findMany({ where: { cafeId, ...isAdmin ? {} : { requestedById: userId } }, include: { cafe: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
    return requests.map((request) => this.mapChangeRequest(request));
  }
  async cancelChangeRequest(id, userId) {
    const request = await prisma.cafeChangeRequest.findFirst({ where: { id, requestedById: userId } });
    if (!request) throw fail3("Change request not found", 404);
    if (request.status !== import_client22.CafeChangeRequestStatus.PENDING) throw fail3("Only pending change requests can be cancelled", 409);
    const updated = await prisma.cafeChangeRequest.update({ where: { id }, data: { status: import_client22.CafeChangeRequestStatus.CANCELLED }, include: { cafe: { select: { name: true } } } });
    await this.activityLogs.logAction({ userId, action: "OWNER_CANCELLED_CAFE_CHANGE_REQUEST", entityType: "CafeChangeRequest", entityId: id, description: `Cancelled change request for ${updated.cafe.name}` });
    return this.mapChangeRequest(updated);
  }
  async updateHours(cafeId, userId, isAdmin, hours) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    if (hours.length !== 7 || new Set(hours.map((hour) => hour.dayOfWeek)).size !== 7) throw fail3("A complete weekly schedule is required");
    await prisma.$transaction(async (tx) => {
      await tx.cafeHours.deleteMany({ where: { cafeId: cafe.id } });
      await tx.cafeHours.createMany({ data: hours.map((hour) => ({ cafeId: cafe.id, dayOfWeek: hour.dayOfWeek, isClosed: hour.isClosed, openTime: hour.isClosed ? null : hour.openTime, closeTime: hour.isClosed ? null : hour.closeTime })) });
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_UPDATED_CAFE_HOURS", entityType: "Cafe", entityId: cafe.id, description: `Updated hours for ${cafe.name}` });
    return this.getOwnedCafe(cafe.id, userId, isAdmin);
  }
  async updateAmenities(cafeId, userId, isAdmin, amenityIds) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const uniqueIds = [...new Set(amenityIds)];
    const activeAmenities = await prisma.amenity.findMany({ where: { id: { in: uniqueIds }, active: true }, select: { id: true } });
    if (activeAmenities.length !== uniqueIds.length) throw fail3("One or more amenities are invalid or inactive");
    await prisma.$transaction(async (tx) => {
      await tx.cafeAmenity.deleteMany({ where: { cafeId: cafe.id } });
      if (uniqueIds.length) await tx.cafeAmenity.createMany({ data: uniqueIds.map((amenityId) => ({ cafeId: cafe.id, amenityId })), skipDuplicates: true });
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_UPDATED_CAFE_AMENITIES", entityType: "Cafe", entityId: cafe.id, description: `Updated amenities for ${cafe.name}` });
    return this.getOwnedCafe(cafe.id, userId, isAdmin);
  }
  async getReviews(cafeId, userId, isAdmin, page = 1, limit = 20) {
    await this.requireCafe(cafeId, userId, isAdmin);
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const where = { cafeId, status: { in: [import_client22.ReviewStatus.PENDING, import_client22.ReviewStatus.APPROVED] } };
    const [reviews, total] = await Promise.all([
      prisma.cafeReview.findMany({ where, skip: (safePage - 1) * safeLimit, take: safeLimit, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, avatarUrl: true } }, photos: true } }),
      prisma.cafeReview.count({ where })
    ]);
    return { data: reviews.map((review) => ({ id: review.id, overallRating: review.overallRating, coffeeRating: review.coffeeRating, ambianceRating: review.ambianceRating, serviceRating: review.serviceRating, comment: review.comment, createdAt: review.createdAt, reviewer: review.user, photos: review.photos })), pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }
  async uploadPhoto(cafeId, userId, isAdmin, file) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const photoCount = await prisma.cafePhoto.count({ where: { cafeId: cafe.id } });
    if (photoCount >= 20) throw fail3("A cafe can have at most 20 photos", 409);
    const photo = await prisma.cafePhoto.create({ data: { cafeId: cafe.id, url: `/uploads/cafes/${file.filename}`, sortOrder: photoCount, isCover: photoCount === 0 } });
    await this.activityLogs.logAction({ userId, action: "OWNER_UPLOADED_CAFE_PHOTO", entityType: "CafePhoto", entityId: photo.id, description: `Uploaded a photo for ${cafe.name}` });
    return photo;
  }
  async deletePhoto(cafeId, photoId, userId, isAdmin) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const photo = await prisma.cafePhoto.findFirst({ where: { id: photoId, cafeId: cafe.id } });
    if (!photo) throw fail3("Photo not found", 404);
    const replacement = photo.isCover ? await prisma.cafePhoto.findFirst({ where: { cafeId: cafe.id, id: { not: photo.id } }, orderBy: { sortOrder: "asc" } }) : null;
    await prisma.$transaction(async (tx) => {
      await tx.cafePhoto.delete({ where: { id: photo.id } });
      if (replacement) await tx.cafePhoto.update({ where: { id: replacement.id }, data: { isCover: true } });
    });
    if (photo.url.startsWith("/uploads/")) await import_promises.default.unlink(import_path12.default.join(process.cwd(), photo.url.slice(1))).catch(() => void 0);
    await this.activityLogs.logAction({ userId, action: "OWNER_DELETED_CAFE_PHOTO", entityType: "CafePhoto", entityId: photo.id, description: `Deleted a photo for ${cafe.name}` });
    return { message: "Photo deleted" };
  }
  async setCoverPhoto(cafeId, photoId, userId, isAdmin) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const photo = await prisma.cafePhoto.findFirst({ where: { id: photoId, cafeId: cafe.id } });
    if (!photo) throw fail3("Photo not found", 404);
    await prisma.$transaction(async (tx) => {
      await tx.cafePhoto.updateMany({ where: { cafeId: cafe.id }, data: { isCover: false } });
      await tx.cafePhoto.update({ where: { id: photo.id }, data: { isCover: true } });
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_CHANGED_COVER_PHOTO", entityType: "CafePhoto", entityId: photo.id, description: `Changed cover photo for ${cafe.name}` });
    return prisma.cafePhoto.findMany({ where: { cafeId: cafe.id }, orderBy: { sortOrder: "asc" } });
  }
  async updatePhotoMetadata(cafeId, photoId, userId, isAdmin, data) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const photo = await prisma.cafePhoto.findFirst({ where: { id: photoId, cafeId: cafe.id } });
    if (!photo) throw fail3("Photo not found", 404);
    const updated = await prisma.cafePhoto.update({
      where: { id: photoId },
      data: {
        altText: data.altText !== void 0 ? sanitizePlain(data.altText) : void 0,
        caption: data.caption !== void 0 ? sanitizePlain(data.caption) : void 0
      }
    });
    await this.activityLogs.logAction({
      userId,
      action: "OWNER_UPDATED_PHOTO_METADATA",
      entityType: "CafePhoto",
      entityId: photoId,
      description: `Updated metadata for photo in ${cafe.name}`
    });
    return updated;
  }
  async getMenus(cafeId, userId, isAdmin) {
    await this.requireCafe(cafeId, userId, isAdmin);
    const menus = await this.menuRepository.findByCafeId(cafeId, false);
    return menus.map(mapToMenuDto);
  }
  async createMenu(cafeId, userId, isAdmin, data) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const menu = await this.menuRepository.create({
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      cafe: { connect: { id: cafe.id } }
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_CREATED_MENU", entityType: "Menu", entityId: menu.id, description: `Created menu ${menu.name} for ${cafe.name}` });
    return mapToMenuDto(menu);
  }
  async updateMenu(cafeId, menuId, userId, isAdmin, data) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const existingMenu = await this.menuRepository.findById(menuId);
    if (!existingMenu || existingMenu.cafeId !== cafe.id) throw fail3("Menu not found", 404);
    const menu = await this.menuRepository.update(menuId, {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      sortOrder: data.sortOrder
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_UPDATED_MENU", entityType: "Menu", entityId: menu.id, description: `Updated menu ${menu.name} for ${cafe.name}` });
    return mapToMenuDto(menu);
  }
  async deleteMenu(cafeId, menuId, userId, isAdmin) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const existingMenu = await this.menuRepository.findById(menuId);
    if (!existingMenu || existingMenu.cafeId !== cafe.id) throw fail3("Menu not found", 404);
    await this.menuRepository.delete(menuId);
    await this.activityLogs.logAction({ userId, action: "OWNER_DELETED_MENU", entityType: "Menu", entityId: menuId, description: `Deleted menu ${existingMenu.name} for ${cafe.name}` });
    return { message: "Menu deleted" };
  }
  // Categories
  async createCategory(cafeId, menuId, userId, isAdmin, data) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const menu = await this.menuRepository.findById(menuId);
    if (!menu || menu.cafeId !== cafe.id) throw fail3("Menu not found", 404);
    const category = await this.menuRepository.createCategory({
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      menu: { connect: { id: menuId } }
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_CREATED_MENU_CATEGORY", entityType: "MenuCategory", entityId: category.id, description: `Created category ${category.name} in menu ${menu.name}` });
    return category;
  }
  async updateCategory(cafeId, categoryId, userId, isAdmin, data) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const category = await this.menuRepository.findCategoryWithOwnership(categoryId);
    if (!category || category.menu.cafe.id !== cafe.id) throw fail3("Category not found", 404);
    const updated = await this.menuRepository.updateCategory(categoryId, {
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_UPDATED_MENU_CATEGORY", entityType: "MenuCategory", entityId: categoryId, description: `Updated category ${updated.name}` });
    return updated;
  }
  async deleteCategory(cafeId, categoryId, userId, isAdmin) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const category = await this.menuRepository.findCategoryWithOwnership(categoryId);
    if (!category || category.menu.cafe.id !== cafe.id) throw fail3("Category not found", 404);
    await this.menuRepository.deleteCategory(categoryId);
    await this.activityLogs.logAction({ userId, action: "OWNER_DELETED_MENU_CATEGORY", entityType: "MenuCategory", entityId: categoryId, description: `Deleted category ${category.name}` });
    return { message: "Category deleted" };
  }
  // Items
  async createMenuItem(cafeId, categoryId, userId, isAdmin, data) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const category = await this.menuRepository.findCategoryWithOwnership(categoryId);
    if (!category || category.menu.cafe.id !== cafe.id) throw fail3("Category not found", 404);
    const { tags, optionGroups, ...rest } = data;
    const item = await this.menuRepository.createItem({
      name: rest.name,
      description: rest.description,
      price: new import_client22.Prisma.Decimal(rest.price),
      imageUrl: rest.imageUrl,
      isAvailable: rest.isAvailable ?? true,
      isFeatured: rest.isFeatured ?? false,
      sortOrder: rest.sortOrder ?? 0,
      category: { connect: { id: categoryId } },
      tags: tags ? {
        create: tags.map((t) => ({ name: t }))
      } : void 0,
      optionGroups: optionGroups ? {
        create: optionGroups.map((og) => ({
          name: og.name,
          minSelection: og.minSelection ?? 0,
          maxSelection: og.maxSelection ?? 1,
          isRequired: og.isRequired ?? false,
          options: {
            create: og.options.map((opt) => ({
              name: opt.name,
              priceModifier: new import_client22.Prisma.Decimal(opt.priceModifier ?? 0),
              isAvailable: opt.isAvailable ?? true
            }))
          }
        }))
      } : void 0
    });
    await this.activityLogs.logAction({ userId, action: "OWNER_CREATED_MENU_ITEM", entityType: "MenuItem", entityId: item.id, description: `Created item ${item.name} in category ${category.name}` });
    return item;
  }
  async updateMenuItem(cafeId, itemId, userId, isAdmin, data) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const item = await this.menuRepository.findItemWithOwnership(itemId);
    if (!item || item.category.menu.cafe.id !== cafe.id) throw fail3("Item not found", 404);
    const { tags, optionGroups, ...rest } = data;
    const updateData = {
      name: rest.name,
      description: rest.description,
      price: rest.price !== void 0 ? new import_client22.Prisma.Decimal(rest.price) : void 0,
      imageUrl: rest.imageUrl,
      isAvailable: rest.isAvailable,
      isFeatured: rest.isFeatured,
      sortOrder: rest.sortOrder
    };
    if (tags !== void 0) {
      updateData.tags = {
        deleteMany: {},
        create: tags.map((t) => ({ name: t }))
      };
    }
    if (optionGroups !== void 0) {
      updateData.optionGroups = {
        deleteMany: {},
        create: optionGroups.map((og) => ({
          name: og.name,
          minSelection: og.minSelection ?? 0,
          maxSelection: og.maxSelection ?? 1,
          isRequired: og.isRequired ?? false,
          options: {
            create: og.options.map((opt) => ({
              name: opt.name,
              priceModifier: new import_client22.Prisma.Decimal(opt.priceModifier ?? 0),
              isAvailable: opt.isAvailable ?? true
            }))
          }
        }))
      };
    }
    const updated = await this.menuRepository.updateItem(itemId, updateData);
    await this.activityLogs.logAction({ userId, action: "OWNER_UPDATED_MENU_ITEM", entityType: "MenuItem", entityId: itemId, description: `Updated item ${updated.name}` });
    return updated;
  }
  async deleteMenuItem(cafeId, itemId, userId, isAdmin) {
    const cafe = await this.requireCafe(cafeId, userId, isAdmin);
    const item = await this.menuRepository.findItemWithOwnership(itemId);
    if (!item || item.category.menu.cafe.id !== cafe.id) throw fail3("Item not found", 404);
    await this.menuRepository.deleteItem(itemId);
    await this.activityLogs.logAction({ userId, action: "OWNER_DELETED_MENU_ITEM", entityType: "MenuItem", entityId: itemId, description: `Deleted item ${item.name}` });
    return { message: "Item deleted" };
  }
  mapSummary(cafe) {
    return { id: cafe.id, name: cafe.name, slug: cafe.slug, city: cafe.city, address: cafe.address, status: cafe.status, verified: cafe.verified, ratingAverage: Number(cafe.ratingAverage), reviewCount: cafe._count.reviews, favoriteCount: cafe._count.favorites, photoCount: cafe._count.photos, coverImage: cafe.photos[0]?.url || null };
  }
  mapChangeRequest(request) {
    return { id: request.id, cafeId: request.cafeId, cafeName: request.cafe.name, type: request.type, status: request.status, payload: request.payload, reason: request.reason, adminNotes: request.adminNotes, createdAt: request.createdAt, reviewedAt: request.reviewedAt };
  }
};

// server/src/controllers/ownerController.ts
var emptyToNull = (val) => val === "" ? null : val;
var businessSchema = import_zod12.z.object({
  shortDescription: import_zod12.z.string().trim().min(10).max(300),
  description: import_zod12.z.string().trim().min(20).max(5e3),
  address: import_zod12.z.string().trim().min(5).max(255).optional(),
  city: import_zod12.z.string().trim().min(2).max(100).optional(),
  state: import_zod12.z.preprocess((val) => val === null || val === void 0 ? "" : val, import_zod12.z.string().trim().max(100).optional().default("")),
  country: import_zod12.z.string().trim().min(2).max(100).optional(),
  postalCode: import_zod12.z.preprocess((val) => val === null || val === void 0 ? "" : val, import_zod12.z.string().trim().max(20).optional().default("")),
  phone: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().trim().max(40).nullable().optional()),
  email: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().trim().email().max(255).nullable().optional()),
  website: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().trim().url().max(500).nullable().optional()),
  instagram: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().trim().url().max(500).nullable().optional()),
  facebook: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().trim().url().max(500).nullable().optional()),
  priceRange: import_zod12.z.number().int().min(1).max(4)
}).strict();
var timeSchema = import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional());
var hoursSchema = import_zod12.z.object({ dayOfWeek: import_zod12.z.number().int().min(0).max(6), isClosed: import_zod12.z.boolean(), openTime: timeSchema, closeTime: timeSchema });
var amenitiesSchema = import_zod12.z.object({ amenityIds: import_zod12.z.array(import_zod12.z.string().cuid()).max(50) }).strict();
var changeRequestSchema = import_zod12.z.object({ type: import_zod12.z.nativeEnum(import_client23.CafeChangeRequestType), payload: import_zod12.z.record(import_zod12.z.string(), import_zod12.z.unknown()), reason: import_zod12.z.string().trim().max(2e3).optional() }).strict();
var menuSchema = import_zod12.z.object({
  name: import_zod12.z.string().trim().min(1).max(100),
  description: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().trim().max(1e3).nullable().optional()),
  isActive: import_zod12.z.boolean().optional(),
  sortOrder: import_zod12.z.number().int().optional()
}).strict();
var categorySchema = import_zod12.z.object({
  name: import_zod12.z.string().trim().min(1).max(100),
  description: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().trim().max(1e3).nullable().optional()),
  sortOrder: import_zod12.z.number().int().optional()
}).strict();
var menuItemSchema = import_zod12.z.object({
  name: import_zod12.z.string().trim().min(1).max(100),
  description: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().trim().max(1e3).nullable().optional()),
  price: import_zod12.z.number().min(0),
  imageUrl: import_zod12.z.preprocess(emptyToNull, import_zod12.z.string().url().nullable().optional()),
  isAvailable: import_zod12.z.boolean().optional(),
  isFeatured: import_zod12.z.boolean().optional(),
  sortOrder: import_zod12.z.number().int().optional(),
  tags: import_zod12.z.array(import_zod12.z.string()).optional(),
  optionGroups: import_zod12.z.array(import_zod12.z.object({
    name: import_zod12.z.string().trim().min(1).max(100),
    minSelection: import_zod12.z.number().int().min(0).optional(),
    maxSelection: import_zod12.z.number().int().min(1).optional(),
    isRequired: import_zod12.z.boolean().optional(),
    options: import_zod12.z.array(import_zod12.z.object({
      name: import_zod12.z.string().trim().min(1).max(100),
      priceModifier: import_zod12.z.number().min(0).optional(),
      isAvailable: import_zod12.z.boolean().optional()
    }))
  })).optional()
}).strict();
var sendError3 = (res, error) => res.status(error.status || (error.name === "ZodError" ? 422 : 400)).json({ success: false, error: { message: error.message, details: error.issues } });
var OwnerController = class {
  constructor() {
    this.service = new OwnerService();
    this.getDashboard = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.getDashboard(req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.getCafes = async (req, res) => {
      try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
        res.json({ success: true, ...await this.service.getOwnedCafes(req.user.id, this.isAdmin(req), page, limit) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.getCafe = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.getOwnedCafe(req.params.id, req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.updateBusiness = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.updateBusiness(req.params.id, req.user.id, this.isAdmin(req), businessSchema.parse(req.body)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.createChangeRequest = async (req, res) => {
      try {
        const data = changeRequestSchema.parse(req.body);
        res.status(201).json({ success: true, data: await this.service.createChangeRequest(req.params.id, req.user.id, data.type, data.payload, data.reason) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.getChangeRequests = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.getChangeRequests(req.params.id, req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.cancelChangeRequest = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.cancelChangeRequest(req.params.requestId, req.user.id) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.updateHours = async (req, res) => {
      try {
        const hours = import_zod12.z.array(hoursSchema).length(7).parse(req.body.hours);
        res.json({ success: true, data: await this.service.updateHours(req.params.id, req.user.id, this.isAdmin(req), hours) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.updateAmenities = async (req, res) => {
      try {
        const { amenityIds } = amenitiesSchema.parse(req.body);
        res.json({ success: true, data: await this.service.updateAmenities(req.params.id, req.user.id, this.isAdmin(req), amenityIds) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.getReviews = async (req, res) => {
      try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
        res.json({ success: true, ...await this.service.getReviews(req.params.id, req.user.id, this.isAdmin(req), page, limit) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.uploadPhoto = async (req, res) => {
      try {
        if (!req.file) return res.status(422).json({ success: false, error: { message: "Photo is required" } });
        res.status(201).json({ success: true, data: await this.service.uploadPhoto(req.params.id, req.user.id, this.isAdmin(req), req.file) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.deletePhoto = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.deletePhoto(req.params.id, req.params.photoId, req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.setCoverPhoto = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.setCoverPhoto(req.params.id, req.params.photoId, req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.updatePhotoMetadata = async (req, res) => {
      try {
        const schema = import_zod12.z.object({
          altText: import_zod12.z.string().trim().max(255).optional(),
          caption: import_zod12.z.string().trim().max(1e3).optional()
        }).strict();
        res.json({
          success: true,
          data: await this.service.updatePhotoMetadata(
            req.params.id,
            req.params.photoId,
            req.user.id,
            this.isAdmin(req),
            schema.parse(req.body)
          )
        });
      } catch (e) {
        sendError3(res, e);
      }
    };
    // Menus
    this.getMenus = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.getMenus(req.params.id, req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.createMenu = async (req, res) => {
      try {
        res.status(201).json({ success: true, data: await this.service.createMenu(req.params.id, req.user.id, this.isAdmin(req), menuSchema.parse(req.body)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.updateMenu = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.updateMenu(req.params.id, req.params.menuId, req.user.id, this.isAdmin(req), menuSchema.partial().parse(req.body)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.deleteMenu = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.deleteMenu(req.params.id, req.params.menuId, req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    // Categories
    this.createCategory = async (req, res) => {
      try {
        res.status(201).json({ success: true, data: await this.service.createCategory(req.params.id, req.params.menuId, req.user.id, this.isAdmin(req), categorySchema.parse(req.body)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.updateCategory = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.updateCategory(req.params.id, req.params.categoryId, req.user.id, this.isAdmin(req), categorySchema.partial().parse(req.body)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.deleteCategory = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.deleteCategory(req.params.id, req.params.categoryId, req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    // Items
    this.createMenuItem = async (req, res) => {
      try {
        res.status(201).json({ success: true, data: await this.service.createMenuItem(req.params.id, req.params.categoryId, req.user.id, this.isAdmin(req), menuItemSchema.parse(req.body)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.updateMenuItem = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.updateMenuItem(req.params.id, req.params.itemId, req.user.id, this.isAdmin(req), menuItemSchema.partial().parse(req.body)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
    this.deleteMenuItem = async (req, res) => {
      try {
        res.json({ success: true, data: await this.service.deleteMenuItem(req.params.id, req.params.itemId, req.user.id, this.isAdmin(req)) });
      } catch (e) {
        sendError3(res, e);
      }
    };
  }
  isAdmin(req) {
    return req.user.role === "ADMIN";
  }
};

// server/src/controllers/ownerAnalyticsController.ts
var import_zod13 = require("zod");
var import_date_fns2 = require("date-fns");
var analyticsQuerySchema = import_zod13.z.object({
  from: import_zod13.z.string().refine((val) => (0, import_date_fns2.isValid)((0, import_date_fns2.parseISO)(val)), { message: "Invalid from date" }),
  to: import_zod13.z.string().refine((val) => (0, import_date_fns2.isValid)((0, import_date_fns2.parseISO)(val)), { message: "Invalid to date" }),
  interval: import_zod13.z.enum(["day", "week", "month"]).default("day")
});
var OwnerAnalyticsController = class {
  constructor() {
    this.analyticsService = new AnalyticsService();
    this.cafeService = new CafeService();
    this.getAnalytics = async (req, res, next) => {
      try {
        const { cafeId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === "ADMIN";
        const validatedQuery = analyticsQuerySchema.parse(req.query);
        const fromDate = (0, import_date_fns2.startOfDay)((0, import_date_fns2.parseISO)(validatedQuery.from));
        const toDate = (0, import_date_fns2.endOfDay)((0, import_date_fns2.parseISO)(validatedQuery.to));
        const cafe = await this.cafeService.getCafeById(cafeId);
        if (!cafe) {
          return res.status(404).json({
            success: false,
            error: { message: "Cafe not found" }
          });
        }
        if (!isAdmin && cafe.ownerId !== userId) {
          return res.status(403).json({
            success: false,
            error: { message: "Unauthorized: You do not own this cafe" }
          });
        }
        const diff = (0, import_date_fns2.differenceInDays)(toDate, fromDate);
        if (diff > 365) {
          return res.status(400).json({
            success: false,
            error: { message: "Date range cannot exceed 365 days" }
          });
        }
        if (fromDate > toDate) {
          return res.status(400).json({
            success: false,
            error: { message: "From date cannot be after to date" }
          });
        }
        const analytics = await this.analyticsService.getCafeAnalytics(cafeId, {
          from: fromDate,
          to: toDate,
          interval: validatedQuery.interval
        });
        res.json({
          success: true,
          data: {
            cafe: {
              id: cafe.id,
              name: cafe.name,
              slug: cafe.slug
            },
            period: {
              from: fromDate.toISOString(),
              to: toDate.toISOString(),
              interval: validatedQuery.interval
            },
            ...analytics
          }
        });
      } catch (error) {
        if (error instanceof import_zod13.z.ZodError) {
          return res.status(400).json({
            success: false,
            error: { message: "Invalid query parameters", details: error.issues }
          });
        }
        next(error);
      }
    };
  }
};

// server/src/routes/owner.routes.ts
var router13 = (0, import_express13.Router)();
var controller2 = new OwnerController();
var analyticsController = new OwnerAnalyticsController();
router13.use(requireAuth, requireRole("OWNER", "ADMIN"));
router13.get("/dashboard", controller2.getDashboard);
router13.get("/cafes", controller2.getCafes);
router13.get("/cafes/:id", controller2.getCafe);
router13.get("/cafes/:cafeId/analytics", analyticsController.getAnalytics);
router13.patch("/cafes/:id/business", submissionRateLimit, controller2.updateBusiness);
router13.put("/cafes/:id/hours", submissionRateLimit, controller2.updateHours);
router13.put("/cafes/:id/amenities", submissionRateLimit, controller2.updateAmenities);
router13.get("/cafes/:id/reviews", controller2.getReviews);
router13.post("/cafes/:id/photos", submissionRateLimit, uploadOwnerPhoto.single("photo"), controller2.uploadPhoto);
router13.delete("/cafes/:id/photos/:photoId", controller2.deletePhoto);
router13.patch("/cafes/:id/photos/:photoId", submissionRateLimit, controller2.updatePhotoMetadata);
router13.post("/cafes/:id/photos/:photoId/cover", controller2.setCoverPhoto);
router13.get("/cafes/:id/change-requests", controller2.getChangeRequests);
router13.post("/cafes/:id/change-requests", submissionRateLimit, controller2.createChangeRequest);
router13.post("/change-requests/:requestId/cancel", controller2.cancelChangeRequest);
router13.get("/cafes/:id/menus", controller2.getMenus);
router13.post("/cafes/:id/menus", submissionRateLimit, controller2.createMenu);
router13.patch("/cafes/:id/menus/:menuId", submissionRateLimit, controller2.updateMenu);
router13.delete("/cafes/:id/menus/:menuId", controller2.deleteMenu);
router13.post("/cafes/:id/menus/:menuId/categories", submissionRateLimit, controller2.createCategory);
router13.patch("/cafes/:id/categories/:categoryId", submissionRateLimit, controller2.updateCategory);
router13.delete("/cafes/:id/categories/:categoryId", controller2.deleteCategory);
router13.post("/cafes/:id/categories/:categoryId/items", submissionRateLimit, controller2.createMenuItem);
router13.patch("/cafes/:id/items/:itemId", submissionRateLimit, controller2.updateMenuItem);
router13.delete("/cafes/:id/items/:itemId", controller2.deleteMenuItem);
var owner_routes_default = router13;

// server/src/routes/menu.routes.ts
var import_express14 = require("express");

// server/src/services/menuService.ts
var import_client24 = require("@prisma/client");
var MenuService = class {
  constructor() {
    this.menuRepository = new MenuRepository();
  }
  async getCafeMenus(cafeId, publicOnly = true) {
    const menus = await this.menuRepository.findByCafeId(cafeId, publicOnly);
    return menus.map(mapToMenuDto);
  }
  async getMenuById(menuId) {
    const menu = await this.menuRepository.findById(menuId);
    if (!menu) return null;
    return mapToMenuDto(menu);
  }
  async createMenu(cafeId, data) {
    const menu = await this.menuRepository.create({
      name: data.name,
      description: data.description,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      cafe: { connect: { id: cafeId } }
    });
    return mapToMenuDto(menu);
  }
  async updateMenu(menuId, data) {
    const menu = await this.menuRepository.update(menuId, {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      sortOrder: data.sortOrder
    });
    return mapToMenuDto(menu);
  }
  async deleteMenu(menuId) {
    await this.menuRepository.delete(menuId);
  }
  // Category
  async createCategory(menuId, data) {
    return this.menuRepository.createCategory({
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder ?? 0,
      menu: { connect: { id: menuId } }
    });
  }
  async updateCategory(categoryId, data) {
    return this.menuRepository.updateCategory(categoryId, {
      name: data.name,
      description: data.description,
      sortOrder: data.sortOrder
    });
  }
  async deleteCategory(categoryId) {
    await this.menuRepository.deleteCategory(categoryId);
  }
  // Item
  async createItem(categoryId, data) {
    const { tags, optionGroups, ...rest } = data;
    return this.menuRepository.createItem({
      name: rest.name,
      description: rest.description,
      price: new import_client24.Prisma.Decimal(rest.price),
      imageUrl: rest.imageUrl,
      isAvailable: rest.isAvailable ?? true,
      isFeatured: rest.isFeatured ?? false,
      sortOrder: rest.sortOrder ?? 0,
      category: { connect: { id: categoryId } },
      tags: tags ? {
        create: tags.map((t) => ({ name: t }))
      } : void 0,
      optionGroups: optionGroups ? {
        create: optionGroups.map((og) => ({
          name: og.name,
          minSelection: og.minSelection ?? 0,
          maxSelection: og.maxSelection ?? 1,
          isRequired: og.isRequired ?? false,
          options: {
            create: og.options.map((opt) => ({
              name: opt.name,
              priceModifier: new import_client24.Prisma.Decimal(opt.priceModifier ?? 0),
              isAvailable: opt.isAvailable ?? true
            }))
          }
        }))
      } : void 0
    });
  }
  async updateItem(itemId, data) {
    const { tags, optionGroups, ...rest } = data;
    const updateData = {
      name: rest.name,
      description: rest.description,
      price: rest.price !== void 0 ? new import_client24.Prisma.Decimal(rest.price) : void 0,
      imageUrl: rest.imageUrl,
      isAvailable: rest.isAvailable,
      isFeatured: rest.isFeatured,
      sortOrder: rest.sortOrder
    };
    if (tags !== void 0) {
      updateData.tags = {
        deleteMany: {},
        create: tags.map((t) => ({ name: t }))
      };
    }
    return this.menuRepository.updateItem(itemId, updateData);
  }
  async deleteItem(itemId) {
    await this.menuRepository.deleteItem(itemId);
  }
  // Ownership verification helper
  async verifyMenuOwnership(menuId, userId) {
    const menu = await this.menuRepository.findMenuWithOwnership(menuId);
    return !!menu && menu.cafe.ownerId === userId;
  }
  async verifyCategoryOwnership(categoryId, userId) {
    const category = await this.menuRepository.findCategoryWithOwnership(categoryId);
    return !!category && category.menu.cafe.ownerId === userId;
  }
  async verifyItemOwnership(itemId, userId) {
    const item = await this.menuRepository.findItemWithOwnership(itemId);
    return !!item && item.category.menu.cafe.ownerId === userId;
  }
};

// server/src/controllers/menuController.ts
init_database();
var MenuController = class {
  constructor() {
    this.service = new MenuService();
    this.getCafeMenu = async (req, res) => {
      try {
        const { slug } = req.params;
        console.log(`[MenuController] Fetching menu for cafe slug: ${slug}`);
        const cafe = await prisma.cafe.findUnique({ where: { slug }, select: { id: true } });
        if (!cafe) {
          console.warn(`[MenuController] Cafe not found for slug: ${slug}`);
          return res.status(404).json({ success: false, error: { message: "Cafe not found" } });
        }
        const menus = await this.service.getCafeMenus(cafe.id, true);
        console.log(`[MenuController] Found ${menus.length} menus for cafe ID: ${cafe.id}`);
        res.json({ success: true, data: menus });
      } catch (e) {
        console.error(`[MenuController] Error fetching menu:`, e);
        res.status(400).json({ success: false, error: { message: e.message } });
      }
    };
  }
};

// server/src/routes/menu.routes.ts
var router14 = (0, import_express14.Router)();
var controller3 = new MenuController();
router14.get("/:slug", controller3.getCafeMenu);
var menu_routes_default = router14;

// server/src/routes/notification.routes.ts
var import_express15 = require("express");

// server/src/repositories/notificationRepository.ts
init_database();
var NotificationRepository = class {
  async findAllByUserId(userId, limit = 50, skip = 0) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip
    });
  }
  async countUnreadByUserId(userId) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }
  async findById(id) {
    return prisma.notification.findUnique({
      where: { id }
    });
  }
  async update(id, data) {
    return prisma.notification.update({
      where: { id },
      data
    });
  }
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
  async create(data) {
    return prisma.notification.create({
      data
    });
  }
  async delete(id) {
    return prisma.notification.delete({
      where: { id }
    });
  }
};

// server/src/services/notificationService.ts
var NotificationService = class {
  constructor() {
    this.repository = new NotificationRepository();
  }
  async getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const notifications = await this.repository.findAllByUserId(userId, limit, skip);
    const unreadCount = await this.repository.countUnreadByUserId(userId);
    return {
      notifications,
      unreadCount
    };
  }
  async getUnreadCount(userId) {
    return this.repository.countUnreadByUserId(userId);
  }
  async markAsRead(userId, notificationId) {
    const notification = await this.repository.findById(notificationId);
    if (!notification) {
      throw { status: 404, message: "Notification not found" };
    }
    if (notification.userId !== userId) {
      throw { status: 403, message: "Not authorized" };
    }
    return this.repository.update(notificationId, { isRead: true });
  }
  async markAllAsRead(userId) {
    return this.repository.markAllAsRead(userId);
  }
  async createNotification(userId, data) {
    return this.repository.create({
      user: { connect: { id: userId } },
      title: data.title,
      message: data.message,
      type: data.type
    });
  }
};

// server/src/controllers/notificationController.ts
var NotificationController = class {
  constructor() {
    this.service = new NotificationService();
    this.getNotifications = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const result = await this.service.getNotifications(userId, page, limit);
        res.json({ success: true, data: result.notifications, unreadCount: result.unreadCount });
      } catch (error) {
        next(error);
      }
    };
    this.markAsRead = async (req, res, next) => {
      try {
        const userId = req.user.id;
        const { id } = req.params;
        await this.service.markAsRead(userId, id);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    };
    this.markAllAsRead = async (req, res, next) => {
      try {
        const userId = req.user.id;
        await this.service.markAllAsRead(userId);
        res.json({ success: true });
      } catch (error) {
        next(error);
      }
    };
  }
};

// server/src/routes/notification.routes.ts
var router15 = (0, import_express15.Router)();
var controller4 = new NotificationController();
router15.get("/", requireAuth, controller4.getNotifications);
router15.post("/read-all", requireAuth, controller4.markAllAsRead);
router15.patch("/:id/read", requireAuth, controller4.markAsRead);
var notification_routes_default = router15;

// server/src/routes/recommendation.routes.ts
var import_express16 = require("express");

// server/src/controllers/recommendationController.ts
var RecommendationController = class {
  constructor() {
    this.service = new RecommendationService();
    this.getRecommendations = async (req, res, next) => {
      try {
        const limit = parseInt(req.query.limit, 10) || 6;
        const items = await this.service.getRecommendations({
          userId: req.user?.id,
          limit,
          context: req.query.context || "home",
          excludeCafeId: req.query.excludeCafeId,
          cafeId: req.query.cafeId,
          city: req.query.city,
          amenity: req.query.amenity
        });
        res.json({ success: true, data: { items } });
      } catch (error) {
        next(error);
      }
    };
    this.getDiagnostics = async (_req, res, next) => {
      try {
        res.json({ success: true, data: this.service.getDiagnostics() });
      } catch (error) {
        next(error);
      }
    };
  }
};

// server/src/routes/recommendation.routes.ts
var import_client25 = require("@prisma/client");
var router16 = (0, import_express16.Router)();
var controller5 = new RecommendationController();
router16.get("/", optionalAuth, controller5.getRecommendations);
router16.get("/cafes", optionalAuth, controller5.getRecommendations);
router16.get("/diagnostics", requireAuth, requireRole(import_client25.Role.ADMIN), controller5.getDiagnostics);
var recommendation_routes_default = router16;

// server/src/routes/seo.routes.ts
var import_express17 = require("express");
init_database();
var router17 = (0, import_express17.Router)();
var PORT = process.env.PORT || 3e3;
var APP_URL = process.env.CLIENT_URL || `http://localhost:${PORT}`;
router17.get("/robots.txt", (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /owner
Disallow: /profile
Disallow: /api

Sitemap: ${APP_URL}/sitemap.xml
`;
  res.header("Content-Type", "text/plain");
  res.send(robots);
});
router17.get("/sitemap.xml", async (req, res) => {
  try {
    const [cafes, posts, lists] = await Promise.all([
      prisma.cafe.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true }
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true }
      }),
      prisma.curatedList.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true }
      })
    ]);
    const staticPages = [
      "",
      "/explore",
      "/blog",
      "/lists",
      "/about",
      "/contact"
    ];
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    staticPages.forEach((page) => {
      sitemap += `
  <url>
    <loc>${APP_URL}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`;
    });
    cafes.forEach((cafe) => {
      sitemap += `
  <url>
    <loc>${APP_URL}/cafes/${cafe.slug}</loc>
    <lastmod>${cafe.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
    posts.forEach((post) => {
      sitemap += `
  <url>
    <loc>${APP_URL}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });
    lists.forEach((list) => {
      sitemap += `
  <url>
    <loc>${APP_URL}/lists/${list.slug}</loc>
    <lastmod>${list.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });
    sitemap += "\n</urlset>";
    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});
var seo_routes_default = router17;

// server/src/routes/search.routes.ts
var import_express18 = require("express");

// server/src/repositories/searchRepository.ts
init_database();
var import_client26 = require("@prisma/client");
var SearchRepository = class {
  async getArticleSuggestions(query, limit) {
    const posts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        title: true,
        category: true,
        slug: true
      },
      take: limit,
      orderBy: { publishedAt: "desc" }
    });
    return posts.map((post) => ({
      type: "article",
      id: post.id,
      label: post.title,
      subtitle: post.category || "Article",
      slug: post.slug
    }));
  }
  async getCafeSuggestions(query, limit) {
    const cafes = await prisma.cafe.findMany({
      where: {
        status: import_client26.CafeStatus.PUBLISHED,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { shortDescription: { contains: query, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        name: true,
        city: true,
        slug: true
      },
      take: limit,
      orderBy: [
        {
          name: "asc"
        }
      ]
    });
    return cafes.map((cafe) => ({
      type: "cafe",
      id: cafe.id,
      label: cafe.name,
      subtitle: cafe.city,
      slug: cafe.slug
    }));
  }
  async getCitySuggestions(query, limit) {
    const cities = await prisma.cafe.findMany({
      where: {
        status: import_client26.CafeStatus.PUBLISHED,
        city: { contains: query, mode: "insensitive" }
      },
      select: {
        city: true,
        state: true
      },
      distinct: ["city"],
      take: limit
    });
    return cities.map((city) => ({
      type: "city",
      label: city.city,
      subtitle: city.state || "Location"
    }));
  }
  async getAmenitySuggestions(query, limit) {
    const amenities = await prisma.amenity.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true
      },
      take: limit
    });
    return amenities.map((amenity) => ({
      type: "amenity",
      id: amenity.id,
      label: amenity.name,
      subtitle: "Amenity",
      slug: amenity.slug
    }));
  }
};

// server/src/services/searchService.ts
var SearchService = class {
  constructor() {
    this.searchRepository = new SearchRepository();
  }
  async getSuggestions(query, limit = 8) {
    if (!query || query.length < 2) {
      return [];
    }
    const normalizedQuery = query.trim().toLowerCase();
    const [cafes, cities, amenities, articles] = await Promise.all([
      this.searchRepository.getCafeSuggestions(normalizedQuery, limit),
      this.searchRepository.getCitySuggestions(normalizedQuery, Math.floor(limit / 2)),
      this.searchRepository.getAmenitySuggestions(normalizedQuery, Math.floor(limit / 2)),
      this.searchRepository.getArticleSuggestions(normalizedQuery, limit)
    ]);
    const combined = [...cafes, ...cities, ...amenities, ...articles];
    return combined.sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      const aExact = aLabel === normalizedQuery;
      const bExact = bLabel === normalizedQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      const aStarts = aLabel.startsWith(normalizedQuery);
      const bStarts = bLabel.startsWith(normalizedQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    }).slice(0, limit);
  }
};

// server/src/routes/search.routes.ts
var import_zod14 = require("zod");
var router18 = (0, import_express18.Router)();
var searchService = new SearchService();
var suggestionsSchema = import_zod14.z.object({
  q: import_zod14.z.string().min(1).max(100),
  limit: import_zod14.z.string().optional().transform((v) => v ? parseInt(v, 10) : 8)
});
router18.get("/suggestions", searchRateLimit, async (req, res) => {
  try {
    const result = suggestionsSchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: result.error.issues
      });
    }
    const { q, limit } = result.data;
    const suggestions = await searchService.getSuggestions(q, Math.min(limit, 10));
    res.json({
      success: true,
      data: {
        query: q,
        suggestions
      }
    });
  } catch (error) {
    console.error("[SearchSuggestions]: Error fetching suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suggestions"
    });
  }
});
var search_routes_default = router18;

// server/src/app.ts
var import_meta = {};
var getCurrentDir = () => {
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  try {
    if (typeof import_meta !== "undefined" && import_meta.url) {
      return import_path13.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
    }
  } catch {
  }
  return process.cwd();
};
var currentDir = getCurrentDir();
var resolveClientDist = () => {
  const candidates = [
    import_path13.default.resolve(process.cwd(), "dist"),
    import_path13.default.resolve(currentDir, "dist"),
    import_path13.default.resolve(currentDir, "../dist"),
    import_path13.default.resolve(currentDir, "../../dist"),
    currentDir
  ];
  for (const dir of candidates) {
    const indexPath = import_path13.default.join(dir, "index.html");
    if (import_fs11.default.existsSync(indexPath)) {
      return dir;
    }
  }
  return null;
};
var resolveClientSourceHtml = () => {
  const candidates = [
    import_path13.default.resolve(process.cwd(), "client/index.html"),
    import_path13.default.resolve(currentDir, "client/index.html"),
    import_path13.default.resolve(currentDir, "../client/index.html"),
    import_path13.default.resolve(currentDir, "../../client/index.html")
  ];
  for (const p of candidates) {
    if (import_fs11.default.existsSync(p)) {
      return p;
    }
  }
  return null;
};
async function createApp() {
  const app = (0, import_express19.default)();
  app.set("trust proxy", 1);
  app.use(requestCorrelation);
  app.use(requestLogger);
  app.use(redirectMiddleware);
  app.use(globalRateLimit);
  app.use((0, import_helmet.default)({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? cspConfig : false
  }));
  app.use((0, import_cors.default)({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const port = Number(process.env.PORT) || 3e3;
      const allowedOrigins = [
        process.env.CLIENT_URL,
        `http://localhost:${port}`,
        "http://localhost:5173"
      ].filter(Boolean);
      const isLocalIp = /^http:\/\/(127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|100\.)/.test(origin);
      if (allowedOrigins.includes(origin) || isLocalIp) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token", "X-Requested-With", "Accept", "X-Correlation-Id"],
    exposedHeaders: ["Authorization", "x-auth-token"]
  }));
  app.use((0, import_morgan.default)("dev"));
  app.use(import_express19.default.json({ limit: "1mb" }));
  app.use(import_express19.default.urlencoded({ extended: true, limit: "1mb" }));
  app.use((0, import_cookie_parser.default)());
  app.use("/uploads", import_express19.default.static(import_path13.default.join(process.cwd(), "uploads"), {
    maxAge: "30d",
    immutable: true
  }));
  app.use("/api/health", health_routes_default);
  app.get("/api/live", (req, res) => res.status(200).json({ success: true, status: "alive" }));
  app.get("/api/ready", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ success: true, status: "ready" });
    } catch (error) {
      res.status(503).json({ success: false, status: "not-ready", reason: "Database unavailable" });
    }
  });
  app.use(maintenanceMiddleware);
  app.use("/api/cafes", cafe_routes_default);
  app.use("/api/auth", auth_routes_default);
  app.use("/api/lists", list_routes_default);
  app.use("/api/testimonials", testimonial_routes_default);
  app.use("/api/blog", blog_routes_default);
  app.use("/api/reviews", review_routes_default);
  app.use("/api/users", user_routes_default);
  app.use("/api", claim_routes_default);
  app.use("/api/cafe-submissions", submission_routes_default);
  app.use("/api/amenities", amenity_routes_default);
  app.use("/api/admin", adminRoutes_default);
  app.use("/api/owner", owner_routes_default);
  app.use("/api/menu", menu_routes_default);
  app.use("/api/notifications", notification_routes_default);
  app.use("/api/recommendations", recommendation_routes_default);
  app.use("/api/search", search_routes_default);
  app.use("/", seo_routes_default);
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      error: { message: `API endpoint not found: ${req.method} ${req.originalUrl}` }
    });
  });
  app.use("/.well-known", (req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  const clientDistPath = resolveClientDist();
  const clientHtmlPath = resolveClientSourceHtml();
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction || !clientDistPath) {
    if (isProduction && !clientDistPath) {
      console.warn('[Server]: NODE_ENV is "production" but compiled dist/index.html was not found. Initializing Vite middleware fallback so frontend is available.');
    } else {
      console.log("[Server]: Running in development mode with Vite middleware");
    }
    const viteConfigCandidates = [
      import_path13.default.resolve(process.cwd(), "vite.config.ts"),
      import_path13.default.resolve(currentDir, "vite.config.ts"),
      import_path13.default.resolve(currentDir, "../vite.config.ts"),
      import_path13.default.resolve(currentDir, "../../vite.config.ts")
    ];
    const viteConfigFile = viteConfigCandidates.find((p) => import_fs11.default.existsSync(p)) || import_path13.default.resolve(process.cwd(), "vite.config.ts");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "custom",
      configFile: viteConfigFile
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads") || req.originalUrl.startsWith("/.well-known")) {
        return next();
      }
      const url = req.originalUrl;
      try {
        const sourceHtml = clientHtmlPath || import_path13.default.resolve(process.cwd(), "client/index.html");
        if (!import_fs11.default.existsSync(sourceHtml)) {
          return res.status(404).send("client/index.html not found");
        }
        let template = import_fs11.default.readFileSync(sourceHtml, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        console.error(`[Vite]: Error transforming HTML for ${url}:`, e);
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    console.log(`[Server]: Running in production mode. Serving static files from: ${clientDistPath}`);
    app.use(import_express19.default.static(clientDistPath));
    app.get("*", (req, res) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads") || req.originalUrl.startsWith("/.well-known")) {
        return res.status(404).json({ error: "Not found" });
      }
      const indexPath = import_path13.default.join(clientDistPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err && !res.headersSent) {
          res.status(404).send("Application index.html not found");
        }
      });
    });
  }
  app.use(errorHandler);
  return app;
}

// server/src/services/schedulerService.ts
init_cleanupService();
init_database();
init_logger();
var import_client27 = require("@prisma/client");
init_jobRunnerService();
init_dataIntegrityService();
init_backupService();
var SchedulerService = class {
  constructor() {
    this.intervals = [];
  }
  start() {
    logger.info("[Scheduler]: Starting background job scheduler...");
    const cleanupInterval = setInterval(async () => {
      await jobRunnerService.runJob("system-cleanup", () => cleanupService.runAll());
    }, 24 * 60 * 60 * 1e3);
    this.intervals.push(cleanupInterval);
    const emailRetryInterval = setInterval(async () => {
      await jobRunnerService.runJob("email-retry", async () => {
        const pendingJobs = await prisma.emailJob.findMany({
          where: {
            status: { in: [import_client27.EmailJobStatus.PENDING, import_client27.EmailJobStatus.FAILED] },
            attempts: { lt: 5 },
            availableAt: { lte: /* @__PURE__ */ new Date() }
          },
          take: 10
        });
        if (pendingJobs.length > 0) {
          logger.debug(`[Scheduler]: Processing ${pendingJobs.length} pending/retrying email jobs`);
          let successCount = 0;
          let failureCount = 0;
          for (const job of pendingJobs) {
            try {
              await emailService.processJob(job.id);
              successCount++;
            } catch (err) {
              failureCount++;
            }
          }
          return { processedCount: pendingJobs.length, successCount, failureCount };
        }
        return { processedCount: 0, successCount: 0, failureCount: 0 };
      });
    }, 60 * 1e3);
    this.intervals.push(emailRetryInterval);
    const emailRecoveryInterval = setInterval(async () => {
      await jobRunnerService.runJob("email-recovery", async () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
        const stuckJobs = await prisma.emailJob.findMany({
          where: {
            status: import_client27.EmailJobStatus.PROCESSING,
            updatedAt: { lt: oneHourAgo }
          }
        });
        if (stuckJobs.length > 0) {
          const result = await prisma.emailJob.updateMany({
            where: { id: { in: stuckJobs.map((j) => j.id) } },
            data: { status: import_client27.EmailJobStatus.PENDING, attempts: { increment: 1 } }
          });
          return { processedCount: result.count, successCount: result.count, failureCount: 0 };
        }
        return { processedCount: 0, successCount: 0, failureCount: 0 };
      });
    }, 10 * 60 * 1e3);
    this.intervals.push(emailRecoveryInterval);
    const integrityInterval = setInterval(async () => {
      await jobRunnerService.runJob("data-integrity-scan", async () => {
        const report = await dataIntegrityService.getIntegrityReport();
        const totalIssues = report.cafes.inconsistentRatings + report.reviews.orphaned + report.media.missingFiles + report.media.orphanedFiles;
        return { processedCount: totalIssues, successCount: 0, failureCount: 0, message: "Scan completed" };
      });
    }, 24 * 60 * 60 * 1e3);
    this.intervals.push(integrityInterval);
    const diskInterval = setInterval(async () => {
      await jobRunnerService.runJob("disk-monitoring", async () => {
        const { operationalService: operationalService2 } = await Promise.resolve().then(() => (init_operationalService(), operationalService_exports));
        const status = await operationalService2.getStatus();
        const diskSpace = status.storage.availableDiskSpace;
        if (diskSpace.includes("95%") || diskSpace.includes("96%") || diskSpace.includes("97%") || diskSpace.includes("98%") || diskSpace.includes("99%") || diskSpace.includes("100%")) {
          logger.error(`[Scheduler]: CRITICAL DISK SPACE: ${diskSpace}`);
        } else if (diskSpace.includes("80%") || diskSpace.includes("90%")) {
          logger.warn(`[Scheduler]: Low disk space: ${diskSpace}`);
        }
        return { processedCount: 1, successCount: 1, failureCount: 0, message: `Disk check: ${diskSpace}` };
      });
    }, 15 * 60 * 1e3);
    this.intervals.push(diskInterval);
    const healthInterval = setInterval(async () => {
      await jobRunnerService.runJob("health-verification", async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return { processedCount: 1, successCount: 1, failureCount: 0, message: "Database connection healthy" };
        } catch (err) {
          logger.error("[Scheduler]: Health check failed - Database unreachable");
          return { processedCount: 1, successCount: 0, failureCount: 1, message: err.message };
        }
      });
    }, 5 * 60 * 1e3);
    this.intervals.push(healthInterval);
    const publicationInterval = setInterval(async () => {
      await jobRunnerService.runJob("publish-scheduled-content", async () => {
        const { EditorialService: EditorialService2 } = await Promise.resolve().then(() => (init_editorialService(), editorialService_exports));
        const editorialService5 = new EditorialService2();
        const results = await editorialService5.publishScheduledContent();
        const totalPublished = results.blogPosts + results.curatedLists;
        return {
          processedCount: totalPublished,
          successCount: totalPublished,
          failureCount: results.errors.length,
          message: results.errors.length > 0 ? `Errors: ${results.errors.join(", ")}` : void 0
        };
      });
    }, 5 * 60 * 1e3);
    this.intervals.push(publicationInterval);
    const releaseInterval = setInterval(async () => {
      await jobRunnerService.runJob("release-cleanup", async () => {
        const { deploymentService: deploymentService2 } = await Promise.resolve().then(() => (init_deploymentService(), deploymentService_exports));
        const count = await deploymentService2.cleanupOldReleases();
        return { processedCount: count, successCount: count, failureCount: 0, message: `Cleaned up ${count} old releases` };
      });
    }, 7 * 24 * 60 * 60 * 1e3);
    this.intervals.push(releaseInterval);
    const backupInterval = setInterval(async () => {
      await jobRunnerService.runJob("backup-database", async () => {
        await backupService.backupDatabase();
        return { processedCount: 1, successCount: 1, failureCount: 0, message: "Daily backup completed" };
      });
    }, 24 * 60 * 60 * 1e3);
    this.intervals.push(backupInterval);
    const certInterval = setInterval(async () => {
      await jobRunnerService.runJob("certificate-monitoring", async () => {
        const hasSSL = process.env.SSL_ENABLED === "true";
        return {
          processedCount: 1,
          successCount: 1,
          failureCount: 0,
          message: hasSSL ? "SSL is enabled and active" : "SSL not configured (using standard HTTP)"
        };
      });
    }, 24 * 60 * 60 * 1e3);
    this.intervals.push(certInterval);
    const verifyInterval = setInterval(async () => {
      await jobRunnerService.runJob("verify-backups", () => backupService.verifyBackups());
    }, 7 * 24 * 60 * 60 * 1e3);
    this.intervals.push(verifyInterval);
    logger.info("[Scheduler]: Background job scheduler started.");
  }
  stop() {
    logger.info("[Scheduler]: Stopping background job scheduler...");
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    logger.info("[Scheduler]: Background job scheduler stopped.");
  }
};
var schedulerService = new SchedulerService();

// server/src/index.ts
console.log("[Server]: loadEnv completed");
console.log("[Server]: Importing database...");
console.log("[Server]: Importing app...");
console.log("[Server]: Importing scheduler...");
var PORT2 = process.env.PORT || 3e3;
var ENV = process.env.NODE_ENV || "development";
async function startServer() {
  try {
    console.log(`[Server]: Starting in ${ENV} mode...`);
    await connectWithRetry();
    const app = await createApp();
    const server = app.listen(PORT2, "0.0.0.0", () => {
      console.log(`[Server]: CafeFinder API is running on http://localhost:${PORT2}`);
      console.log(`[Server]: Environment: ${ENV}`);
      schedulerService.start();
    });
    const shutdown = async (signal) => {
      console.log(`[Server]: ${signal} received. Shutting down gracefully...`);
      schedulerService.stop();
      server.close(async () => {
        console.log("[Server]: HTTP server closed.");
        try {
          await prisma.$disconnect();
          await stopLocalPostgresServer();
          console.log("[Server]: Database connections closed.");
          process.exit(0);
        } catch (err) {
          console.error("[Server]: Error during database disconnection:", err);
          process.exit(1);
        }
      });
      setTimeout(() => {
        console.error("[Server]: Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 1e4);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("[Server]: Failed to start server:", error);
    process.exit(1);
  }
}
startServer();
