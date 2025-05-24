const https = require('https');
const http = require('http');

// Create agents with keep-alive enabled
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 10000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  rejectUnauthorized: true
});

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 10000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000
});

// Custom fetch with keep-alive agents
async function fetchWithKeepAlive(url, options = {}) {
  const isHttps = url.startsWith('https://');
  const agent = isHttps ? httpsAgent : httpAgent;
  
  // Use native fetch with custom agent
  const fetchOptions = {
    ...options,
    agent: agent
  };

  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Monitor agent statistics
function getAgentStats() {
  return {
    https: {
      requests: Object.keys(httpsAgent.requests || {}).length,
      sockets: Object.keys(httpsAgent.sockets || {}).length,
      freeSockets: Object.keys(httpsAgent.freeSockets || {}).length
    },
    http: {
      requests: Object.keys(httpAgent.requests || {}).length,
      sockets: Object.keys(httpAgent.sockets || {}).length,
      freeSockets: Object.keys(httpAgent.freeSockets || {}).length
    }
  };
}

module.exports = {
  fetchWithKeepAlive,
  getAgentStats
}; 