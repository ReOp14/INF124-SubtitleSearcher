import { pipeline } from '@xenova/transformers';

/** @type {Promise<unknown> | null} */
let extractorPromise = null;

const MODEL = 'Xenova/all-MiniLM-L6-v2';

export async function getEmbeddingExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL, { quantized: true });
  }
  return extractorPromise;
}

/**
 * Mean-pooled normalized embedding as number[].
 * @param {string} text
 */
export async function embedText(text) {
  const extractor = await getEmbeddingExtractor();
  const out = await extractor(text, { pooling: 'mean', normalize: true });
  const data = out.data;
  if (data instanceof Float32Array || data instanceof Float64Array) {
    return Array.from(data);
  }
  return Array.from(/** @type {Iterable<number>} */ (data));
}

/**
 * @param {string[]} texts
 * @param {number} [batchSize]
 */
export async function embedTexts(texts, batchSize = 16) {
  /** @type {number[][]} */
  const all = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    const vectors = await Promise.all(chunk.map((t) => embedText(t)));
    all.push(...vectors);
  }
  return all;
}
