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

      const searchResults = await vertexAISearchService.search(query, searchOptions);
      
      // Then generate answer using the search results
      const answer = await vertexAISearchService.generateAnswer(
        query,
        searchResults.queryId,
        '-',
        {},
        searchResults.results
      );

      // Combine both results
      const combinedResults = {
        ...searchResults,
        answer: answer
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