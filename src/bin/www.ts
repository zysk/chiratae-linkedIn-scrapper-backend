#!/usr/bin/env node

/**
 * Module dependencies.
 */
import http from "http";
import debug from "debug";
import { AddressInfo } from "net";
import { app } from "../app";
import { initializeScheduledCampaigns } from "../services/scheduler.service";
import config from "../config/config";

const debugLog = debug("modernmart-backend:server");

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string): number | string | boolean {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || config.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening(): void {
  const addr = server.address() as AddressInfo;
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debugLog("Listening on " + bind);
  console.log(`Server listening on ${bind}`);
}

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Initialize scheduled campaigns
 */
initializeScheduledCampaigns().catch((err) => {
  console.error("Failed to initialize scheduled campaigns:", err);
});

/**
 * Handle process termination - cleanup resources.
 */
async function cleanup(): Promise<void> {
  console.log("Cleaning up resources...");

  // Close server
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
}

// Handle termination signals
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
