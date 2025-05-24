require('dotenv').config();

module.exports = {
  projectId: process.env.PROJECT_ID || '254558078304',
  location: process.env.LOCATION || 'global',
  collectionId: process.env.COLLECTION_ID || 'default_collection',
  engineId: process.env.ENGINE_ID || 'ayazay_1747988653972',
  servingConfigId: process.env.SERVING_CONFIG_ID || 'default_search',
  port: process.env.PORT || 3000,
  
  // Search configuration defaults
  searchDefaults: {
    pageSize: 10,
    queryExpansionSpec: { condition: 'AUTO' },
    spellCorrectionSpec: { mode: 'AUTO' },
    languageCode: 'en-US',
    userInfo: { timeZone: 'Asia/Rangoon' }
  },
  
  // Answer generation configuration
  answerGenerationDefaults: {
    relatedQuestionsSpec: { enable: true },
    answerGenerationSpec: {
      ignoreAdversarialQuery: false,
      ignoreNonAnswerSeekingQuery: false,
      ignoreLowRelevantContent: false,
      multimodalSpec: {},
      includeCitations: true,
      promptSpec: {
        preamble: `Generate a final answer as a helpful and friendly assistant.
Use only the relevant information from the search results.
Don't add any new or unrelated information.
Use the exact words from the search results when possible.
Keep the response friendly, simple, and under 20 sentences.
Always say "product", not "product stock".
Always refer to the platform as "AYAZay".
Avoid showing technical IDs like product_stock_id.
Do not show "* **" in the response.
`
      },
      modelSpec: {
        modelVersion: 'gemini-2.0-flash-001/answer_gen/v1'
      }
    }
  }
}; 