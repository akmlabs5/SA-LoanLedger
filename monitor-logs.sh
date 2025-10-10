#!/bin/bash

# Production Log Monitor
# Watches logs for errors and alerts in real-time
# Usage: npm run dev | ./monitor-logs.sh
#    or: tail -f /path/to/logs | ./monitor-logs.sh

echo "📊 Production Log Monitor Started"
echo "Pipe your logs to this script or press Ctrl+C to stop"
echo ""

tsx server/logMonitor.ts
