// lib/cache.js
// TTL-based caching for LaikaTest SDK

// TTL-based cache for storing fetched prompts
class PromptCache {
  constructor(ttl = 30 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // Generate cache key from prompt name and optional version
  generateKey(promptName, versionId) {
    return versionId
      ? `${promptName}:${versionId}`
      : `${promptName}`;
  }

  // Store prompt content with timestamp
  set(promptName, versionId, content) {
    const key = this.generateKey(promptName, versionId);
    this.cache.set(key, {
      content,
      fetchedAt: Date.now()
    });
  }

  // Retrieve prompt content if not expired
  get(promptName, versionId) {
    const key = this.generateKey(promptName, versionId);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.fetchedAt > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.content;
  }

  // Remove expired entries from cache
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.fetchedAt > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache entries and stop cleanup
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

module.exports = { PromptCache };
