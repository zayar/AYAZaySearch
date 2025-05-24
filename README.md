# AYAZay E-commerce Search API

A Node.js implementation of e-commerce search using Google Cloud Vertex AI Application AI (formerly Discovery Engine). This API provides powerful search capabilities with AI-generated answers, autocomplete, and product recommendations.

## Features

- **Product Search**: Full-text search with query expansion and spell correction
- **AI-Generated Answers**: Natural language answers using Gemini models
- **Autocomplete**: Real-time search suggestions as users type
- **Session Management**: Maintain search context across queries
- **Faceted Search**: Filter by categories, price ranges, etc.
- **Relevance Scoring**: Results ranked by relevance
- **Related Questions**: AI-suggested follow-up queries

## Prerequisites

- Node.js 16.x or higher
- Google Cloud Project with Vertex AI Search enabled
- Service Account with appropriate permissions
- Vertex AI Search engine created and configured

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ayazay-search-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up authentication:

Option A: Using Application Default Credentials (Recommended)
```bash
gcloud auth application-default login
```

Option B: Using Service Account Key
- Download your service account key from Google Cloud Console
- Set the environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
```

4. Configure environment variables:
Create a `.env` file in the root directory:
```env
# Vertex AI Configuration
PROJECT_ID=254558078304
LOCATION=global
COLLECTION_ID=default_collection
ENGINE_ID=ayazay_1747988653972
SERVING_CONFIG_ID=default_search

# Server Configuration
PORT=3000
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "message": "AYAZay Search API is running"
}
```

### Search Products
```http
POST /api/search
Content-Type: application/json

{
  "query": "blue shirt",
  "pageSize": 10,
  "pageToken": "optional-pagination-token",
  "filter": "price < 100",
  "orderBy": "price desc",
  "sessionId": "optional-session-id",
  "facets": [...],
  "boost": [...]
}
```

Response:
```json
{
  "results": [
    {
      "id": "product-id",
      "title": "Blue Cotton Shirt",
      "link": "https://example.com/product",
      "snippet": "Premium quality blue shirt...",
      "price": "$49.99",
      "image": "image-url",
      "relevanceScore": 0.85
    }
  ],
  "totalSize": 100,
  "nextPageToken": "pagination-token",
  "correctedQuery": "blue shirt",
  "queryId": "query-id",
  "sessionId": "session-id"
}
```

### Generate AI Answer
```http
POST /api/answer
Content-Type: application/json

{
  "query": "What blue shirts do you have?",
  "queryId": "optional-query-id",
  "sessionId": "optional-session-id"
}
```

Response:
```json
{
  "answerText": "We have several blue shirts available on AYAZay...",
  "citations": [...],
  "references": [...],
  "relatedQuestions": [
    "What sizes are available?",
    "Do you have blue shirts in cotton?"
  ]
}
```

### Search with AI Answer (Combined)
```http
POST /api/search-with-answer
Content-Type: application/json

{
  "query": "blue shirt",
  "pageSize": 10,
  "sessionId": "optional-session-id"
}
```

This endpoint combines search results with AI-generated answers in a single response.

### Autocomplete
```http
POST /api/autocomplete
Content-Type: application/json

{
  "query": "blu",
  "queryModel": "user-event",
  "userPseudoId": "user-123"
}
```

Response:
```json
{
  "suggestions": [
    {
      "suggestion": "blue shirt",
      "type": "SUGGESTION"
    },
    {
      "suggestion": "blue jeans",
      "type": "SUGGESTION"
    }
  ]
}
```

## Demo UI

Open `public/search-demo.html` in a web browser to see a working demo of the search interface. Make sure the API server is running first.

## Configuration

### Search Defaults
Edit `config/config.js` to modify default search parameters:
- Page size
- Query expansion settings
- Spell correction mode
- Language code
- Time zone

### Answer Generation
Customize the AI prompt in `config/config.js`:
- Modify the preamble for different response styles
- Change the model version
- Adjust citation settings

## Project Structure

```
ayazay-search-api/
├── config/
│   └── config.js          # Configuration settings
├── controllers/
│   └── searchController.js # Request handlers
├── services/
│   └── vertexAISearchService.js # Vertex AI integration
├── routes/
│   └── searchRoutes.js    # API routes
├── public/
│   └── search-demo.html   # Demo UI
├── server.js              # Express server
├── package.json           # Dependencies
└── README.md             # Documentation
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing required parameters)
- `500`: Internal Server Error

Error responses include a message field with details:
```json
{
  "error": "Search failed",
  "message": "Detailed error message"
}
```

## Best Practices

1. **Session Management**: Use consistent session IDs to maintain search context
2. **Pagination**: Use pageToken for large result sets
3. **Filtering**: Apply filters to narrow results
4. **Caching**: Consider caching frequently searched queries
5. **Rate Limiting**: Implement rate limiting for production use

## Troubleshooting

### Authentication Issues
- Ensure you're logged in with `gcloud auth application-default login`
- Verify the service account has the required permissions:
  - `discoveryengine.viewer`
  - `discoveryengine.editor`

### Search Not Working
- Check that your engine ID and project ID are correct
- Verify the data store has been populated with products
- Check the Google Cloud Console for any errors

### CORS Issues
- The API includes CORS middleware for development
- For production, configure CORS appropriately

## License

This project is licensed under the MIT License.

## Support

For issues or questions:
1. Check the [Vertex AI Search documentation](https://cloud.google.com/generative-ai-app-builder/docs)
2. Review the error logs in Google Cloud Console
3. Contact your Google Cloud support team 