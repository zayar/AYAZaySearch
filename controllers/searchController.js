const vertexAISearchService = require('../services/vertexAISearchService');

class SearchController {
  async search(req, res) {
    try {
      const { query, pageSize, pageToken, filter, orderBy, sessionId, facets, boost } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const options = {
        ...(pageSize && { pageSize }),
        ...(pageToken && { pageToken }),
        ...(filter && { filter }),
        ...(orderBy && { orderBy }),
        ...(facets && { facetSpecs: facets }),
        ...(boost && { boostSpecs: boost })
      };

      const results = await vertexAISearchService.search(query, options);
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed', message: error.message });
    }
  }

  async generateAnswer(req, res) {
    try {
      const { query, queryId, sessionId, options, searchResults } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const answer = await vertexAISearchService.generateAnswer(
        query,
        queryId || '',
        '-',
        options || {},
        searchResults || null
      );
      
      res.json(answer);
    } catch (error) {
      console.error('Answer generation error:', error);
      res.status(500).json({ error: 'Answer generation failed', message: error.message });
    }
  }

  async searchWithAnswer(req, res) {
    try {
      const { query, pageSize, pageToken, filter, orderBy, sessionId } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      // First perform the search
      const searchOptions = {
        ...(pageSize && { pageSize }),
        ...(pageToken && { pageToken }),
        ...(filter && { filter }),
        ...(orderBy && { orderBy })
      };

      // Start both operations in parallel
      const searchPromise = vertexAISearchService.search(query, searchOptions);
      
      // For initial answer generation, we'll use empty search results
      // The answer will be refined once search results are available
      const answerPromise = vertexAISearchService.generateAnswer(
        query,
        '', // queryId will be empty initially
        '-',
        {},
        null // no search results yet
      );

      // Wait for both operations to complete
      const [searchResults, initialAnswer] = await Promise.all([
        searchPromise,
        answerPromise
      ]);
      
      // If we have search results with a queryId, generate a refined answer
      let finalAnswer = initialAnswer;
      if (searchResults.queryId && searchResults.results && searchResults.results.length > 0) {
        // Only generate refined answer if initial answer doesn't already have good results
        if (!initialAnswer.answerText || initialAnswer.answerText.length < 100) {
          try {
            finalAnswer = await vertexAISearchService.generateAnswer(
              query,
              searchResults.queryId,
              '-',
              {},
              searchResults.results
            );
          } catch (error) {
            console.error('Refined answer generation failed, using initial answer:', error);
            // Keep the initial answer if refined generation fails
          }
        }
      }

      // Combine both results
      const combinedResults = {
        ...searchResults,
        answer: finalAnswer
      };

      res.json(combinedResults);
    } catch (error) {
      console.error('Search with answer error:', error);
      res.status(500).json({ error: 'Search with answer failed', message: error.message });
    }
  }

  async autocomplete(req, res) {
    try {
      const { query, queryModel, userPseudoId, includeTailSuggestions } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const options = {
        ...(queryModel && { queryModel }),
        ...(userPseudoId && { userPseudoId }),
        ...(includeTailSuggestions !== undefined && { includeTailSuggestions })
      };

      const suggestions = await vertexAISearchService.autocomplete(query, options);
      res.json(suggestions);
    } catch (error) {
      console.error('Autocomplete error:', error);
      res.status(500).json({ error: 'Autocomplete failed', message: error.message });
    }
  }
}

module.exports = new SearchController(); 