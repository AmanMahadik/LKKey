import Fuse from 'fuse.js';

interface SearchOptions {
  limit?: number;
  threshold?: number;
}

/**
 * Searches a list of Record documents using Fuse.js on the specified searchable fields.
 */
export function searchRecords(
  records: any[],
  query: string,
  searchableFields: string[],
  options: SearchOptions = {}
) {
  const limit = options.limit || 15;
  // Threshold of 0.4 allows spelling errors (2 edits) but filters out completely unrelated names
  const threshold = options.threshold !== undefined ? options.threshold : 0.4;

  // We search nested inside the "data" subdocument (e.g. data.city, data.state)
  const keys = searchableFields.map(field => `data.${field}`);

  const fuse = new Fuse(records, {
    keys,
    threshold,
    includeScore: true,
    ignoreLocation: true, // Search everywhere in string, not just start
  });

  const results = fuse.search(query);

  return results.slice(0, limit).map(res => {
    // If it's a Mongoose document, convert to plain object
    const docObj = res.item.toObject ? res.item.toObject() : res.item;
    return {
      _id: docObj._id,
      datasetId: docObj.datasetId,
      data: docObj.data,
      score: res.score,
    };
  });
}
