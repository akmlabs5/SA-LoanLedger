#!/bin/bash

# Production Smoke Tests
# Verifies security headers, CORS, and HTTPS redirects
# Run: ./smoke-test.sh

echo "🚀 Running Production Smoke Tests..."
tsx server/smokeTests.ts
