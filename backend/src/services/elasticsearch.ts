import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

export const EMAIL_INDEX = 'email_jobs';

/**
 * Creates the email_jobs index with field mappings if it doesn't already exist.
 */
export async function ensureIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
  if (exists) return;

  await esClient.indices.create({
    index: EMAIL_INDEX,
    mappings: {
      properties: {
        id: { type: 'keyword' },
        userId: { type: 'keyword' },
        recipientEmail: { type: 'keyword' },
        recipientName: { type: 'text' },
        subject: { type: 'text', analyzer: 'standard' },
        body: { type: 'text', analyzer: 'standard' },
        status: { type: 'keyword' },
        scheduledAt: { type: 'date' },
        sentAt: { type: 'date' },
        createdAt: { type: 'date' },
      },
    },
  });

  console.log(`✅ Elasticsearch index "${EMAIL_INDEX}" created`);
}

export interface EmailDocument {
  id: string;
  userId: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  createdAt: Date;
}

export async function indexEmail(doc: EmailDocument): Promise<void> {
  await esClient.index({
    index: EMAIL_INDEX,
    id: doc.id,
    document: doc,
  });
}

export interface SearchResult {
  total: number;
  hits: EmailDocument[];
}

export async function searchEmails(
  userId: string,
  query: string,
  from = 0,
  size = 20
): Promise<SearchResult> {
  const response = await esClient.search<EmailDocument>({
    index: EMAIL_INDEX,
    from,
    size,
    query: {
      bool: {
        must: [
          { term: { userId } },
          {
            multi_match: {
              query,
              fields: ['subject^3', 'body', 'recipientEmail', 'recipientName'],
              fuzziness: 'AUTO',
            },
          },
        ],
      },
    },
    sort: [{ sentAt: { order: 'desc' } }],
  });

  const hits = response.hits.hits
    .map((h) => h._source)
    .filter((s): s is EmailDocument => !!s);

  return {
    total: typeof response.hits.total === 'number'
      ? response.hits.total
      : (response.hits.total?.value ?? 0),
    hits,
  };
}
