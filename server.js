import http from "http";
import app from "./app";
import { appConfig } from "./config/app.config";

async function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
}

async function startServer() {
    try {
        const port = await normalizePort(process.env.PORT || "3000");
        const application = await app.initialize();

        application.set("port", port);
        const server = http.createServer(application);

        // Handle specific listen errors with friendly messages
        server.on("error", (error) => {
            if (error.syscall !== "listen") throw error;

            const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

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
        });

        // Server listening event handler
        server.on("listening", () => {
            const addr = server.address();
            const bind = typeof addr === "string"
                ? "pipe " + addr
                : "port " + addr.port;
            console.log("Listening on " + bind);
        });

        server.listen(port);

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

// Start the server
startServer();