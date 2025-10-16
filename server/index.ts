import express, { type Request, Response, NextFunction } from "express";
import { initializeApp } from "./bootstrap";
import { registerAllRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "./config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers middleware
app.use((req, res, next) => {
  // HTTPS redirect in production with monitoring
  if (config.get('NODE_ENV') === 'production') {
    const forwardedProto = req.headers['x-forwarded-proto'];
    
    // Log x-forwarded-proto status for monitoring
    if (!forwardedProto) {
      log(`⚠️  Missing x-forwarded-proto header from ${req.ip} to ${req.path}`);
    }
    
    // Redirect HTTP to HTTPS
    if (forwardedProto !== 'https') {
      const redirectUrl = `https://${req.headers.host}${req.url}`;
      log(`🔒 HTTPS redirect: ${req.method} ${req.url} → ${redirectUrl}`);
      return res.redirect(301, redirectUrl);
    }
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS - only in production
  if (config.get('NODE_ENV') === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // CORS for custom domain
  const allowedOrigins = [
    'https://akm-labs.com',
    'https://www.akm-labs.com',
    config.isDevelopment() ? 'http://localhost:5000' : null
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize application (database, storage, auth, defaults)
  const deps = await initializeApp(app);

  // Start reminder scheduler for sending due reminders
  const { ReminderScheduler } = await import('./reminderScheduler');
  const reminderScheduler = new ReminderScheduler(deps.storage);
  reminderScheduler.start();

  // Start chat cleanup scheduler for deleting old conversations (30+ days)
  const { ChatCleanupScheduler } = await import('./chatCleanupScheduler');
  const chatCleanupScheduler = new ChatCleanupScheduler(deps.storage);
  chatCleanupScheduler.start();

  // Start snapshot scheduler for daily portfolio snapshots
  const { SnapshotScheduler } = await import('./snapshotScheduler');
  const snapshotScheduler = new SnapshotScheduler(deps.storage);
  snapshotScheduler.start();

  // Register all modular routes
  registerAllRoutes(app, deps);

  app.use(async (err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log critical errors to alert system (500s only, not 4xxs)
    if (status >= 500 && config.get('NODE_ENV') === 'production') {
      try {
        const { AlertService } = await import('./alertService.js');
        await AlertService.createAlert({
          severity: 'error',
          type: 'system',
          title: `Server Error: ${status}`,
          message: message,
          details: {
            stack: err.stack,
            path: req.path,
            method: req.method,
            statusCode: status
          },
          source: 'server',
          status: 'unread'
        });
      } catch (alertError) {
        log('Failed to log error to alert system:', String(alertError));
      }
    }

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (config.isDevelopment()) {
    await setupVite(app, deps.server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = config.get('PORT');
  deps.server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
