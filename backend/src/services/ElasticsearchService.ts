import { Client } from '@elastic/elasticsearch';
import { Email, EmailSearchParams } from '../types/email';

export class ElasticsearchService {
    public client: Client;
    public indexName: string = 'emails';

    constructor() {
        this.client = new Client({
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            auth: {
                username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
                password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async initialize() {
        try {
            // Check if Elasticsearch is available
            await this.client.ping();
            console.log('✅ Connected to Elasticsearch');

            // Check if index exists
            const exists = await this.client.indices.exists({ index: this.indexName });

            if (!exists) {
                // Create index with proper mapping
                await this.client.indices.create({
                    index: this.indexName,
                    body: {
                        mappings: {
                            properties: {
                                id: { type: 'keyword' },
                                subject: { type: 'text' },
                                from: { type: 'text' },
                                to: { type: 'text' },
                                body: { type: 'text' },
                                date: { type: 'date' },
                                read: { type: 'boolean' },
                                starred: { type: 'boolean' },
                                category: { type: 'keyword' },
                                priority: { type: 'keyword' },
                                labels: { type: 'keyword' }
                            }
                        }
                    }
                });
                console.log('✅ Elasticsearch index created with proper mapping');
            } else {
                console.log('✅ Elasticsearch index already exists');
            }
        } catch (error: any) {
            console.log('⚠️ Elasticsearch not available:', error.message);
        }
    }

    async updateEmail(id: string, updates: Partial<Email>) {
        try {
            await this.client.update({
                index: this.indexName,
                id: id,
                body: {
                    doc: updates
                }
            });

            await this.client.indices.refresh({ index: this.indexName });
            return true;
        } catch (error) {
            console.log('Update error:', error);
            throw error;
        }
    }

    async indexEmail(email: Email) {
        try {
            // Create a clean email object with only the fields we want to index
            const emailToIndex = {
                id: email.id,
                subject: email.subject,
                from: email.from,
                to: Array.isArray(email.to) ? email.to.join(', ') : email.to,
                body: email.body,
                date: email.date,
                read: email.read,
                starred: email.starred,
                category: email.category || 'uncategorized',
                priority: email.priority || 'normal',
                labels: email.labels || []
            };

            console.log('💾 Indexing email:', {
                id: emailToIndex.id,
                subject: emailToIndex.subject,
                from: emailToIndex.from,
                fromType: typeof emailToIndex.from
            });

            await this.client.index({
                index: this.indexName,
                id: email.id,
                body: emailToIndex,
                refresh: true
            });

            return true;
        } catch (error) {
            console.log('❌ Error indexing email:', error);
            throw error;
        }
    }

    async searchEmails(params: EmailSearchParams): Promise<Email[]> {
        try {
            const mustClauses: any[] = [];

            if (params.query) {
                mustClauses.push({
                    multi_match: {
                        query: params.query,
                        fields: ['subject', 'body', 'from', 'to']
                    }
                });
            }

            if (params.category) {
                mustClauses.push({
                    term: { category: params.category }
                });
            }

            if (params.priority) {
                mustClauses.push({
                    term: { priority: params.priority }
                });
            }

            const searchQuery: any = {
                index: this.indexName,
                size: params.limit || 10,
                from: params.offset || 0,
                sort: [{ date: { order: 'desc' } }]
            };

            if (mustClauses.length > 0) {
                searchQuery.body = {
                    query: {
                        bool: {
                            must: mustClauses
                        }
                    }
                };
            } else {
                searchQuery.body = {
                    query: {
                        match_all: {}
                    }
                };
            }

            const response = await this.client.search(searchQuery);

            return response.hits.hits.map((hit: any) => ({
                ...hit._source,
                date: new Date(hit._source.date)
            }));
        } catch (error) {
            console.log('🔍 Search error:', error);
            return [];
        }
    }

    async deleteEmail(id: string) {
        try {
            await this.client.delete({
                index: this.indexName,
                id: id
            });
            return true;
        } catch (error) {
            console.log('🗑️ Delete error:', error);
            return false;
        }
    }

    async getEmailStats() {
        try {
            const response = await this.client.search({
                index: this.indexName,
                body: {
                    size: 0,
                    aggs: {
                        by_category: {
                            terms: { field: 'category' }
                        },
                        by_priority: {
                            terms: { field: 'priority' }
                        },
                        total_count: {
                            value_count: { field: 'id' }
                        }
                    }
                }
            });

            return response.aggregations;
        } catch (error) {
            console.log('📊 Stats error:', error);
            return null;
        }
    }
}