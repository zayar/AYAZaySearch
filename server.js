const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'AYAZay Search API is running' });
});

// Performance monitoring endpoint
app.get('/api/stats', (req, res) => {
  const cacheManager = require('./services/cacheManager');
  const { getAgentStats } = require('./services/httpClient');
  
  res.status(200).json({
    cache: cacheManager.getStats(),
    connections: getAgentStats(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// API routes
app.use('/api', searchRoutes);

// Image proxy endpoint to handle CORS issues with external images
app.get('/api/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('Proxying image:', url);

    // Fetch the image from the external URL
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AYAZay-Image-Proxy/1.0'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch image', 
        status: response.status,
        statusText: response.statusText 
      });
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    console.log('Image fetched successfully:', {
      contentType,
      contentLength,
      url
    });

    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Content-Length': contentLength,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*'
    });

    // Stream the image data to the response
    response.body.pipe(res);

  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`AYAZay Search API server is running on port ${PORT}`);
  console.log(`Project ID: ${config.projectId}`);
  console.log(`Engine ID: ${config.engineId}`);
  console.log(`Demo UI available at: http://localhost:${PORT}/search-demo.html`);
}); 