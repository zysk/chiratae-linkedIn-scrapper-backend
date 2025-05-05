/**
 * Test scripts for LinkedIn Selenium Integration
 * These tests validate the LinkedIn scraper backend's Selenium integration
 */

// Login as admin first to obtain the token
pm.test("Login as admin", function() {
    pm.sendRequest({
        url: pm.environment.get("baseUrl") + "/api/users/loginAdmin",
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                email: pm.environment.get("adminEmail"),
                password: pm.environment.get("adminPassword")
            })
        }
    }, function (err, res) {
        if (err) {
            console.error(err);
            return;
        }

        const response = res.json();
        if (response.accessToken) {
            pm.environment.set('adminAccessToken', response.accessToken);
            console.log("Admin login successful, token saved");
            testLinkedInOperations();
        } else {
            console.error("Failed to login as admin");
        }
    });
});

// Get a LinkedIn account for testing
function getLinkedInAccount() {
    pm.sendRequest({
        url: pm.environment.get("baseUrl") + "/api/linkedin/accounts/next",
        method: 'GET',
        header: {
            'Authorization': 'Bearer ' + pm.environment.get("adminAccessToken")
        }
    }, function (err, res) {
        if (err) {
            console.error(err);
            return;
        }

        const response = res.json();
        if (response.success && response.data) {
            pm.environment.set('linkedInAccountId', response.data.id);
            console.log("LinkedIn account fetched successfully");
            getProxy();
        } else {
            console.error("Failed to get LinkedIn account");
        }
    });
}

// Get a proxy for testing
function getProxy() {
    pm.sendRequest({
        url: pm.environment.get("baseUrl") + "/api/linkedin/proxies/next",
        method: 'GET',
        header: {
            'Authorization': 'Bearer ' + pm.environment.get("adminAccessToken")
        }
    }, function (err, res) {
        if (err) {
            console.error(err);
            return;
        }

        const response = res.json();
        if (response.success && response.data) {
            pm.environment.set('proxyId', response.data.id);
            console.log("Proxy fetched successfully");
            testLoginToLinkedIn();
        } else {
            console.log("No proxy available, proceeding without proxy");
            testLoginToLinkedIn();
        }
    });
}

// Test LinkedIn login
function testLoginToLinkedIn() {
    // You would need to supply the actual LinkedIn password for this test
    // For security reasons, we're not automating this part
    console.log("To test LinkedIn login:");
    console.log("1. Set the linkedInAccountPassword environment variable");
    console.log("2. Use the Test LinkedIn Login request in the collection");
}

// Test LinkedIn search
function testLinkedInSearch() {
    console.log("To test LinkedIn search:");
    console.log("1. Ensure you have successfully logged in");
    console.log("2. Use the Search LinkedIn Profiles request in the collection");
}

// Main test function
function testLinkedInOperations() {
    getLinkedInAccount();
}

// Validation schema for API responses
const schemas = {
    loginResponse: {
        "type": "object",
        "required": ["success", "message", "data"],
        "properties": {
            "success": {"type": "boolean"},
            "message": {"type": "string"},
            "data": {
                "type": "object",
                "properties": {
                    "account": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "username": {"type": "string"}
                        }
                    },
                    "proxy": {
                        "type": ["object", "null"],
                        "properties": {
                            "id": {"type": "string"},
                            "host": {"type": "string"},
                            "port": {"type": "number"}
                        }
                    }
                }
            }
        }
    },
    searchResponse: {
        "type": "object",
        "required": ["success", "message", "data"],
        "properties": {
            "success": {"type": "boolean"},
            "message": {"type": "string"},
            "data": {
                "type": "object",
                "properties": {
                    "results": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "profileId": {"type": "string"},
                                "profileUrl": {"type": "string"},
                                "name": {"type": "string"},
                                "headline": {"type": ["string", "null"]},
                                "location": {"type": ["string", "null"]},
                                "currentCompany": {"type": ["string", "null"]},
                                "connectionDegree": {"type": ["string", "null"]},
                                "imageUrl": {"type": ["string", "null"]},
                                "isOpenToWork": {"type": "boolean"}
                            }
                        }
                    },
                    "count": {"type": "number"}
                }
            }
        }
    }
};

// Export schemas for reuse in Postman tests
if (typeof module !== 'undefined') {
    module.exports = {
        schemas: schemas
    };
}
