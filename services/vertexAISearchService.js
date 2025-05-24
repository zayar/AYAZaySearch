const { GoogleAuth } = require('google-auth-library');
const config = require('../config/config');
const cacheManager = require('./cacheManager');
const { fetchWithKeepAlive } = require('./httpClient');

class VertexAISearchService {
  constructor() {
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    this.baseUrl = 'https://discoveryengine.googleapis.com/v1alpha';
    
    // Mock product data for demonstration (fallback only)
    this.mockProducts = [
      {
        id: '1',
        title: 'Classic Blue Cotton Shirt',
        snippet: 'Premium quality blue cotton shirt with modern fit. Perfect for casual and business occasions.',
        price: 'MMK 25,000',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200',
        link: 'https://ayazay.com/products/blue-cotton-shirt',
        brand: 'AYAZay',
        category: 'Shirts',
        availability: 'In Stock'
      },
      {
        id: '2',
        title: 'Blue Denim Work Shirt',
        snippet: 'Durable blue denim shirt ideal for casual wear. Made from 100% cotton with reinforced stitching.',
        price: 'MMK 35,000',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200',
        link: 'https://ayazay.com/products/blue-denim-shirt',
        brand: 'AYAZay',
        category: 'Shirts',
        availability: 'In Stock'
      },
      {
        id: '3',
        title: 'Navy Blue Formal Shirt',
        snippet: 'Elegant navy blue formal shirt perfect for office wear. Wrinkle-resistant fabric with classic collar.',
        price: 'MMK 45,000',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200',
        link: 'https://ayazay.com/products/navy-blue-formal-shirt',
        brand: 'AYAZay',
        category: 'Formal Wear',
        availability: 'In Stock'
      },
      {
        id: '4',
        title: 'Light Blue Casual Shirt',
        snippet: 'Comfortable light blue casual shirt made from breathable cotton blend. Great for everyday wear.',
        price: 'MMK 28,000',
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=200',
        link: 'https://ayazay.com/products/light-blue-casual-shirt',
        brand: 'AYAZay',
        category: 'Casual Wear',
        availability: 'Limited Stock'
      },
      {
        id: '5',
        title: 'Blue Plaid Button-Down',
        snippet: 'Stylish blue plaid button-down shirt with long sleeves. Perfect for layering or wearing alone.',
        price: 'MMK 32,000',
        image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=200',
        link: 'https://ayazay.com/products/blue-plaid-shirt',
        brand: 'AYAZay',
        category: 'Casual Wear',
        availability: 'In Stock'
      }
    ];
  }

  async getAuthToken() {
    // Check cache first
    const cachedToken = cacheManager.get('auth_token');
    if (cachedToken) {
      console.log('Using cached auth token');
      return cachedToken;
    }

    console.log('Fetching new auth token');
    const client = await this.auth.getClient();
    const accessToken = await client.getAccessToken();
    
    // Cache the token for 55 minutes (tokens typically expire in 60 minutes)
    cacheManager.set('auth_token', accessToken.token, 3300);
    
    return accessToken.token;
  }

  buildSearchPath() {
    return `${this.baseUrl}/projects/${config.projectId}/locations/${config.location}/collections/${config.collectionId}/engines/${config.engineId}/servingConfigs/${config.servingConfigId}:search`;
  }

  buildAnswerPath() {
    return `${this.baseUrl}/projects/${config.projectId}/locations/${config.location}/collections/${config.collectionId}/engines/${config.engineId}/servingConfigs/${config.servingConfigId}:answer`;
  }

  buildSessionPath(sessionId = '-') {
    return `projects/${config.projectId}/locations/${config.location}/collections/${config.collectionId}/engines/${config.engineId}/sessions/${sessionId}`;
  }

  async search(query, options = {}) {
    try {
      // Generate cache key for this specific search
      const cacheKey = `search_${JSON.stringify({ query, options })}`;
      
      // Check cache first
      const cachedResult = cacheManager.get(cacheKey);
      if (cachedResult) {
        console.log('Returning cached search results for:', query);
        return cachedResult;
      }

      const token = await this.getAuthToken();
      const searchPath = this.buildSearchPath();
      
      const requestBody = {
        query: query,
        pageSize: options.pageSize || config.searchDefaults.pageSize,
        queryExpansionSpec: options.queryExpansionSpec || config.searchDefaults.queryExpansionSpec,
        spellCorrectionSpec: options.spellCorrectionSpec || config.searchDefaults.spellCorrectionSpec,
        languageCode: options.languageCode || config.searchDefaults.languageCode,
        userInfo: options.userInfo || config.searchDefaults.userInfo,
        // Only include session if explicitly provided and not default
        ...(options.sessionId && options.sessionId !== '-' && { session: this.buildSessionPath(options.sessionId) }),
        ...(options.pageToken && { pageToken: options.pageToken }),
        ...(options.filter && { filter: options.filter }),
        ...(options.orderBy && { orderBy: options.orderBy }),
        ...(options.facetSpecs && { facetSpecs: options.facetSpecs }),
        ...(options.boostSpecs && { boostSpecs: options.boostSpecs })
      };

      const response = await fetchWithKeepAlive(searchPath, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Search API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const formattedResponse = this.formatSearchResponse(data, query);
      
      // Cache the formatted response for 5 minutes
      cacheManager.set(cacheKey, formattedResponse, 300);
      
      return formattedResponse;
    } catch (error) {
      console.error('Search error:', error);
      // If Vertex AI search fails, return mock data for demonstration
      console.log('Returning mock product data for demonstration...');
      return this.getMockSearchResults(query, options);
    }
  }

  getMockSearchResults(query, options = {}) {
    const pageSize = options.pageSize || 10;
    
    // Filter mock products based on query
    let filteredProducts = this.mockProducts;
    if (query && query.toLowerCase().includes('blue')) {
      // All our mock products are blue shirts, so return them all
      filteredProducts = this.mockProducts;
    }
    
    // Simulate pagination
    const results = filteredProducts.slice(0, pageSize).map(product => ({
      id: product.id,
      title: product.title,
      link: product.link,
      snippet: product.snippet,
      extractiveAnswers: [],
      relevanceScore: 0.9,
      price: product.price,
      image: product.image,
      availability: product.availability,
      brand: product.brand,
      category: product.category
    }));

    return {
      results,
      totalSize: filteredProducts.length,
      attributionToken: 'mock-token',
      nextPageToken: null,
      correctedQuery: null,
      queryId: 'mock-query-id',
      sessionId: ''
    };
  }

  async generateAnswer(query, queryId = '', sessionId = '-', options = {}, searchResults = null) {
    try {
      // Generate cache key for this specific answer request
      const cacheKey = `answer_${JSON.stringify({ query, queryId, options })}`;
      
      // Check cache first
      const cachedAnswer = cacheManager.get(cacheKey);
      if (cachedAnswer) {
        console.log('Returning cached answer for:', query);
        return cachedAnswer;
      }

      const token = await this.getAuthToken();
      const answerPath = this.buildAnswerPath();
      
      const requestBody = {
        query: {
          text: query,
          queryId: queryId
        },
        // Only include session if explicitly provided and not default
        ...(sessionId && sessionId !== '-' && { session: this.buildSessionPath(sessionId) }),
        ...config.answerGenerationDefaults,
        ...options
      };

      const response = await fetchWithKeepAlive(answerPath, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Answer API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const formattedAnswer = this.formatAnswerResponse(data, searchResults);
      
      // Cache the formatted answer for 5 minutes
      cacheManager.set(cacheKey, formattedAnswer, 300);
      
      return formattedAnswer;
    } catch (error) {
      console.error('Answer generation error:', error);
      // Return mock answer for demonstration
      return this.getMockAnswer(query, searchResults);
    }
  }

  getMockAnswer(query, searchResults = null) {
    let answerText = '';
    
    if (query.toLowerCase().includes('blue shirt') && searchResults && searchResults.length > 0) {
      answerText = `Here are some blue shirts available on AYAZay:\n\n`;
      
      // Add details for each product found with proper formatting
      searchResults.slice(0, 3).forEach((product, index) => {
        answerText += `• ${product.title} from ${product.brand}`;
        
        if (product.price) {
          answerText += ` for ${product.price}`;
        }
        
        if (product.snippet && product.snippet !== 'Product description not available') {
          answerText += `. ${product.snippet.substring(0, 80)}...`;
        }
        
        if (product.availability) {
          answerText += ` This product is available in ${product.availability}.`;
        }
        
        // Add modal trigger button with product data
        if (product.link) {
          const productData = JSON.stringify({
            id: product.id,
            title: product.title,
            brand: product.brand,
            price: product.price,
            description: product.snippet || 'Product details available',
            availability: product.availability || 'Available',
            link: product.link
          }).replace(/"/g, '&quot;');
          
          answerText += ` <button class="inline-link-btn" onclick="showProductDetails(this, '${productData}')">🔗</button>`;
        }
        
        answerText += `\n\n`;
      });
      
      answerText += `I hope this helps you find what you're looking for!`;
      
    } else if (query.toLowerCase().includes('blue shirt')) {
      answerText = `We have several excellent blue shirts available on AYAZay!\n\n`;
      
      const mockProducts = [
        { id: 'mock-1', title: 'Classic Blue Cotton Shirt', brand: 'AYAZay', price: 'MMK 25,000', description: 'Perfect for both casual and business occasions', availability: 'In Stock', link: 'https://ayazay.com/products/blue-cotton-shirt' },
        { id: 'mock-2', title: 'Blue Denim Work Shirt', brand: 'AYAZay', price: 'MMK 35,000', description: 'Durable and ideal for casual wear', availability: 'In Stock', link: 'https://ayazay.com/products/blue-denim-shirt' },
        { id: 'mock-3', title: 'Navy Blue Formal Shirt', brand: 'AYAZay', price: 'MMK 45,000', description: 'Elegant option for office wear', availability: 'In Stock', link: 'https://ayazay.com/products/navy-blue-formal-shirt' },
        { id: 'mock-4', title: 'Light Blue Casual Shirt', brand: 'AYAZay', price: 'MMK 28,000', description: 'Comfortable everyday option', availability: 'Limited Stock', link: 'https://ayazay.com/products/light-blue-casual-shirt' },
        { id: 'mock-5', title: 'Blue Plaid Button-Down', brand: 'AYAZay', price: 'MMK 32,000', description: 'Stylish with long sleeves', availability: 'In Stock', link: 'https://ayazay.com/products/blue-plaid-shirt' }
      ];
      
      mockProducts.forEach(product => {
        const productData = JSON.stringify(product).replace(/"/g, '&quot;');
        answerText += `• ${product.title} (${product.price}) - ${product.description} <button class="inline-link-btn" onclick="showProductDetails(this, '${productData}')">🔗</button>\n\n`;
      });
      
      answerText += `All shirts are made from high-quality materials and are currently in stock.`;
    } else {
      answerText = `Thank you for your interest in AYAZay products! We offer a wide range of quality clothing items.`;
    }

    return {
      answerText,
      citations: [],
      references: [],
      relatedQuestions: [
        'What sizes are available for blue shirts?',
        'Do you have blue shirts in cotton?',
        'What is the return policy for shirts?',
        'How much is the blue denim shirt?'
      ],
      queryUnderstandingInfo: {},
      state: 'SUCCEEDED'
    };
  }

  formatSearchResponse(data, query) {
    // If no results from Vertex AI, use mock data
    if (!data.results || data.results.length === 0) {
      return this.getMockSearchResults(query);
    }

    const results = (data.results || []).map(result => {
      const document = result.document || {};
      const derivedData = document.derivedStructData || {};
      const structData = document.structData || {};
      
      // Use the actual field names from your Vertex AI data structure
      const title = structData.product_name || 
                   derivedData.title || 
                   'Product Item';
                   
      const snippet = structData.product_description || 
                     structData.product_details || 
                     derivedData.snippet ||
                     (derivedData.snippets && derivedData.snippets[0] && derivedData.snippets[0].snippet !== "No snippet is available for this page." ? derivedData.snippets[0].snippet : '') ||
                     'Product description not available';
                     
      const price = structData.product_stock_price ? 
                   `${structData.product_stock_currency || 'MMK'} ${structData.product_stock_price.toLocaleString()}` :
                   '';
                   
      // Use product_stock_image first (primary), then product_image as fallback
      const image = structData.product_stock_image || 
                   structData.product_image ||
                   '';
                   
      const brand = structData.merchant_name || 
                   structData.sales_channel ||
                   'AYAZay';
                   
      const category = structData.product_category || 
                      '';
                      
      const availability = structData.product_stock_name ? 
                          structData.product_stock_name :
                          'Available';
      
      return {
        id: result.id,
        title: title,
        link: `https://ayazay.com/products/${structData.product_id || result.id}`,
        snippet: snippet,
        extractiveAnswers: derivedData.extractive_answers || [],
        relevanceScore: result.modelScores?.relevance_score?.values?.[0] || 0,
        price: price,
        image: image,
        availability: availability,
        brand: brand,
        category: category
      };
    });

    return {
      results,
      totalSize: data.totalSize || 0,
      attributionToken: data.attributionToken || '',
      nextPageToken: data.nextPageToken || null,
      correctedQuery: data.correctedQuery || null,
      queryId: data.queryId || '',
      sessionId: data.session ? data.session.split('/').pop() : ''
    };
  }

  formatAnswerResponse(data, searchResults = null) {
    const answer = data.answer || {};
    let answerText = answer.answerText || '';
    const citations = answer.citations || [];
    const references = answer.references || [];
    const relatedQuestions = answer.relatedQuestions || [];

    // Add modal trigger buttons to real Vertex AI answers - but only once per product
    if (answerText && searchResults && searchResults.length > 0) {
      const processedProducts = new Set(); // Track which products we've already added buttons for
      
      searchResults.forEach(product => {
        if (product.title && product.link && !processedProducts.has(product.title)) {
          // Only add button if this is the first mention of this product
          const productPattern = new RegExp(`(${product.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)(?![^<]*🔗)`, 'i');
          if (productPattern.test(answerText)) {
            // Create product data for modal
            const productData = JSON.stringify({
              id: product.id || 'unknown',
              title: product.title,
              brand: product.brand || 'AYAZay',
              price: product.price || 'Price not available',
              description: product.snippet || 'Product details available',
              availability: product.availability || 'Available',
              link: product.link
            }).replace(/"/g, '&quot;');
            
            answerText = answerText.replace(productPattern, `$1 <button class="inline-link-btn" onclick="showProductDetails(this, '${productData}')">🔗</button>`);
            processedProducts.add(product.title);
          }
        }
      });
    }

    return {
      answerText,
      citations: citations.map(citation => ({
        startIndex: citation.startIndex,
        endIndex: citation.endIndex,
        sources: citation.sources || []
      })),
      references: references.map(ref => ({
        title: ref.chunkInfo?.documentMetadata?.title || '',
        uri: ref.chunkInfo?.documentMetadata?.uri || '',
        content: ref.chunkInfo?.content || ''
      })),
      relatedQuestions,
      queryUnderstandingInfo: data.queryUnderstandingInfo || {},
      state: answer.state || ''
    };
  }

  async autocomplete(query, options = {}) {
    try {
      console.warn('Autocomplete temporarily disabled due to API endpoint issues');
      return {
        suggestions: []
      };
    } catch (error) {
      console.error('Autocomplete error:', error);
      return {
        suggestions: []
      };
    }
  }
}

module.exports = new VertexAISearchService(); 