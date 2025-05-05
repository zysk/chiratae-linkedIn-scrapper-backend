#!/bin/bash

# Color codes for output formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL for API
BASE_URL="http://localhost:4000/api"

# Store tokens
USER_TOKEN=""
ADMIN_TOKEN=""
REFRESH_TOKEN=""

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
  local description=$1
  local command=$2
  local expected_status=$3

  echo -e "\n${YELLOW}Testing: ${description}${NC}"
  echo "Command: $command"

  # Run the command and capture output and status code
  response=$(eval $command)
  status=$?

  # Extract HTTP status code if using curl
  if [[ $command == curl* ]]; then
    http_status=$(echo "$response" | grep -o '"status":[0-9]*' | grep -o '[0-9]*')
    if [[ -z $http_status ]]; then
      # Check if response has success field (which is used in our API)
      success=$(echo "$response" | grep -o '"success":[a-z]*' | grep -o '[a-z]*')
      if [[ $success == "true" ]]; then
        status=0
      else
        status=1
      fi
    else
      # Convert HTTP status to success/fail
      if [[ $http_status -ge 200 && $http_status -lt 300 ]]; then
        status=0
      else
        status=1
      fi
    fi
  fi

  TOTAL_TESTS=$((TOTAL_TESTS + 1))

  # Check if test passed
  if [[ $status -eq $expected_status ]]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAILED${NC}"
    echo -e "${RED}Response: $response${NC}"
  fi

  # If this is a login request, save the token
  if [[ $description == *"login"* || $description == *"Login"* ]]; then
    if [[ $status -eq 0 ]]; then
      if [[ $description == *"admin"* || $description == *"Admin"* ]]; then
        ADMIN_TOKEN=$(echo $response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        echo "Admin Token: ${ADMIN_TOKEN:0:20}..."
      else
        USER_TOKEN=$(echo $response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        echo "User Token: ${USER_TOKEN:0:20}..."
      fi
      REFRESH_TOKEN=$(echo $response | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
    fi
  fi

  # If this contains an ID we need for further tests, extract it
  if [[ $description == *"Create"* ]]; then
    if [[ $status -eq 0 ]]; then
      if [[ $description == *"LinkedIn account"* ]]; then
        LINKEDIN_ACCOUNT_ID=$(echo $response | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
        echo "LinkedIn Account ID: $LINKEDIN_ACCOUNT_ID"
      elif [[ $description == *"Proxy"* ]]; then
        PROXY_ID=$(echo $response | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
        echo "Proxy ID: $PROXY_ID"
      elif [[ $description == *"Campaign"* ]]; then
        CAMPAIGN_ID=$(echo $response | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
        echo "Campaign ID: $CAMPAIGN_ID"
      fi
    fi
  fi

  # Sleep for a moment to avoid overwhelming the server
  sleep 0.5
}

echo -e "${YELLOW}=== CHIRATAE LINKEDIN SCRAPER API TEST SUITE ===${NC}"
echo -e "${YELLOW}Testing Tasks #2, #3, and #4 endpoints${NC}"

# ===== TASK #2: AUTHENTICATION SYSTEM =====
echo -e "\n${YELLOW}===== TASK #2: AUTHENTICATION SYSTEM =====${NC}"

# Test user registration
run_test "User Registration" "curl -s -X POST $BASE_URL/users/register -H 'Content-Type: application/json' -d '{\"name\": \"Test User\", \"email\": \"testuser_$(date +%s)@example.com\", \"password\": \"Password123!\", \"phone\": 9876543210}'" 0

# Test user login
run_test "User Login" "curl -s -X POST $BASE_URL/users/login -H 'Content-Type: application/json' -d '{\"email\": \"admin@example.com\", \"password\": \"adminpass123\"}'" 0

# Test admin login
run_test "Admin Login" "curl -s -X POST $BASE_URL/users/loginAdmin -H 'Content-Type: application/json' -d '{\"email\": \"admin2@example.com\", \"password\": \"adminpass123\"}'" 0

# Test access protected route with token
run_test "Access Protected Route" "curl -s -X GET $BASE_URL/users/me -H 'Authorization: Bearer $USER_TOKEN'" 0

# Test refresh token
run_test "Refresh Token" "curl -s -X POST $BASE_URL/users/refresh-token -H 'Content-Type: application/json' -d '{\"refreshToken\": \"$REFRESH_TOKEN\"}'" 0


# ===== TASK #3: LINKEDIN ACCOUNT & PROXY MANAGEMENT =====
echo -e "\n${YELLOW}===== TASK #3: LINKEDIN ACCOUNT & PROXY MANAGEMENT =====${NC}"

# Test creating LinkedIn account
run_test "Create LinkedIn account" "curl -s -X POST $BASE_URL/linkedin-accounts -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"username\": \"linkedin_test_$(date +%s)\", \"password\": \"securePassword123\", \"email\": \"linkedin_test_$(date +%s)@example.com\", \"description\": \"Test LinkedIn account $(date +%s)\"}'" 0

# Test listing LinkedIn accounts
run_test "List LinkedIn accounts" "curl -s -X GET $BASE_URL/linkedin-accounts -H 'Authorization: Bearer $ADMIN_TOKEN'" 0

# Test creating a proxy
run_test "Create Proxy" "curl -s -X POST $BASE_URL/proxies -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"name\": \"Test Proxy $(date +%s)\", \"host\": \"192.168.0.$(shuf -i 1-255 -n 1)\", \"port\": $(shuf -i 1000-9999 -n 1), \"username\": \"proxyuser\", \"password\": \"proxypass\", \"description\": \"Test proxy for API testing\"}'" 0

# Test listing proxies
run_test "List Proxies" "curl -s -X GET $BASE_URL/proxies -H 'Authorization: Bearer $ADMIN_TOKEN'" 0


# ===== TASK #4: CAMPAIGN MODEL & MANAGEMENT =====
echo -e "\n${YELLOW}===== TASK #4: CAMPAIGN MODEL & MANAGEMENT =====${NC}"

# Test creating a campaign
run_test "Create Campaign" "curl -s -X POST $BASE_URL/campaigns -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"name\": \"Test Campaign $(date +%s)\", \"searchQuery\": \"Software Engineer\", \"company\": \"Google\", \"location\": \"United States\", \"keywords\": [\"React\", \"Node.js\", \"JavaScript\"], \"maxResults\": 100, \"connectionDegree\": \"2nd\", \"linkedinAccountId\": \"$LINKEDIN_ACCOUNT_ID\", \"proxyId\": \"$PROXY_ID\"}'" 0

# Test listing campaigns
run_test "List Campaigns" "curl -s -X GET $BASE_URL/campaigns -H 'Authorization: Bearer $ADMIN_TOKEN'" 0

# Test getting a campaign by ID
run_test "Get Campaign by ID" "curl -s -X GET $BASE_URL/campaigns/$CAMPAIGN_ID -H 'Authorization: Bearer $ADMIN_TOKEN'" 0

# Test updating a campaign
run_test "Update Campaign" "curl -s -X PUT $BASE_URL/campaigns/$CAMPAIGN_ID -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"name\": \"Updated Campaign $(date +%s)\", \"maxResults\": 150}'" 0

# Test adding a campaign to the queue
run_test "Add Campaign to Queue" "curl -s -X POST $BASE_URL/campaigns/queue -H 'Content-Type: application/json' -H 'Authorization: Bearer $ADMIN_TOKEN' -d '{\"campaignId\": \"$CAMPAIGN_ID\", \"priority\": \"high\"}'" 0

# Test getting campaign results
run_test "Get Campaign Results" "curl -s -X GET $BASE_URL/campaigns/$CAMPAIGN_ID/results -H 'Authorization: Bearer $ADMIN_TOKEN'" 0

# Test deleting a campaign
run_test "Delete Campaign" "curl -s -X DELETE $BASE_URL/campaigns/$CAMPAIGN_ID -H 'Authorization: Bearer $ADMIN_TOKEN'" 0


# ===== TEST SUMMARY =====
echo -e "\n${YELLOW}===== TEST SUMMARY =====${NC}"
echo -e "Total tests: $TOTAL_TESTS"
echo -e "Tests passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Tests failed: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [[ $PASSED_TESTS -eq $TOTAL_TESTS ]]; then
  echo -e "\n${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed. Please check the output above.${NC}"
  exit 1
fi
