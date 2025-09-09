const express = require("express");
const http = require("http");
const morgan = require("morgan");
const { serverConfig, db, redis, socket } = require("./config");
const { Enums } = require("./utils/common");
const { ErrorResponse } = require("./utils/common");

const { initSocket } = socket;
const { initRedis } = redis;
const { STATUS_CODE } = Enums;
const routes = require("./routes");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api", routes);

// 404 handler
app.use((req, res, next) => {
  ErrorResponse.message = `${req.method} ${req.path} not found`;
  ErrorResponse.statusCode = STATUS_CODE.NOT_FOUND;
  res.status(STATUS_CODE.NOT_FOUND).json(ErrorResponse);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  ErrorResponse.message = err.message || "Internal Server Error";
  res.status(err.statusCode || 500).json(ErrorResponse);
});

// DB retry logic
async function waitForDB(maxRetries = 10, delayMs = 2000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await db.authenticate();
      console.log("✅ Database connection established");
      return;
    } catch (err) {
      console.warn(`⏳ Waiting for DB... (${retries + 1}/${maxRetries})`);
      await new Promise((res) => setTimeout(res, delayMs));
      retries++;
    }
  }
  throw new Error("❌ Could not connect to the database after several retries.");
}

const PORT = serverConfig.PORT || 5000;

server.listen(PORT, serverConfig.HOST, async () => {
  console.log(`🚀 Server running on http://${serverConfig.HOST}:${PORT}`);
  try {
    await waitForDB();

    // ✅ init Redis before Socket.IO
    initRedis();
    initSocket(server);

    console.log("🔗 Socket.IO + Redis adapter initialized");
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
});