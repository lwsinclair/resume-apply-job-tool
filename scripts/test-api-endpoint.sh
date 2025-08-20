#!/bin/bash

echo "Testing API endpoints..."
echo "========================="

# Start the server in background
echo "Starting server..."
npm run api > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
echo -e "\n1. Testing health endpoint:"
curl -s http://localhost:3001/api/health | jq '.'

# Test search_jobs endpoint
echo -e "\n2. Testing search_jobs endpoint:"
curl -X POST http://localhost:3001/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "search_jobs",
    "arguments": {
      "query": "DevOps Engineer",
      "location": "Remote",
      "limit": 3
    }
  }' | jq '.data.jobs[0]'

# Test analyze_match endpoint
echo -e "\n3. Testing analyze_match endpoint:"
curl -X POST http://localhost:3001/api/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "analyze_match",
    "arguments": {
      "job": {
        "title": "DevOps Engineer",
        "description": "AWS Kubernetes Terraform required"
      }
    }
  }' | jq '.data | {score: .score, resume_used: .resume_used, matched: .matched_keywords | length}'

# Kill the server
echo -e "\nStopping server..."
kill $SERVER_PID 2>/dev/null

echo "Test complete!"