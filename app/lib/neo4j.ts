/**
 * Neo4j Service - Handles graph database operations
 * This service manages connections to Neo4j and retrieves relationship data
 * between entities in the knowledge graph
 */

import neo4j, { Driver, Session } from "neo4j-driver";
import { getConfig } from "./config";
import type { GraphFact } from "./types";

/**
 * Neo4jService class for graph database operations
 * Provides methods to query relationships and context from the knowledge graph
 */
class Neo4jService {
  private static instance: Neo4jService;
  private driver: Driver | null = null;
  private isInitialized: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns The singleton Neo4jService instance
   */
  public static getInstance(): Neo4jService {
    if (!Neo4jService.instance) {
      Neo4jService.instance = new Neo4jService();
    }
    return Neo4jService.instance;
  }

  /**
   * Initialize connection to Neo4j
   * Creates driver with authentication credentials
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("Connecting to Neo4j...");
      const config = getConfig();

      // Create Neo4j driver with authentication and shorter timeout
      this.driver = neo4j.driver(
        config.neo4j.uri,
        neo4j.auth.basic(config.neo4j.user, config.neo4j.password),
        {
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 10000, // 10 seconds instead of 60
          connectionTimeout: 10000,
        }
      );

      // Verify connectivity with timeout
      const verifyPromise = this.driver.verifyConnectivity();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 10000)
      );

      await Promise.race([verifyPromise, timeoutPromise]);

      this.isInitialized = true;
      console.log("✓ Neo4j connected successfully");
    } catch (error) {
      console.error("Failed to connect to Neo4j:", error);
      throw new Error("Failed to initialize Neo4j");
    }
  }

  /**
   * Fetch graph context for given node IDs
   * Retrieves relationships and connected nodes from the graph
   *
   * @param nodeIds - Array of node IDs to fetch context for
   * @param maxRelationships - Maximum relationships per node (default: 5)
   * @returns Array of graph facts (relationships)
   */
  public async fetchGraphContext(
    nodeIds: string[],
    maxRelationships: number = 5
  ): Promise<GraphFact[]> {
    if (!this.isInitialized || !this.driver) {
      await this.initialize();
    }

    const facts: GraphFact[] = [];
    let session: Session | null = null;

    try {
      // Create a new session for this query
      session = this.driver!.session();

      // Query each node for its relationships
      for (const nodeId of nodeIds) {
        try {
          // Cypher query to find relationships for this node
          // Matches the node by ID and retrieves connected nodes with relationship types
          const query = `
            MATCH (n {id: $nodeId})-[r]-(m)
            RETURN type(r) AS rel, m.id AS id, m.name AS name
            LIMIT $limit
          `;

          const result = await session.run(query, {
            nodeId: nodeId,
            limit: neo4j.int(maxRelationships),
          });

          // Process each record into a GraphFact
          result.records.forEach((record) => {
            facts.push({
              source: nodeId,
              rel: record.get("rel"),
              target_id: record.get("id"),
              target_name: record.get("name"),
            });
          });
        } catch (error) {
          console.error(`Error fetching context for node ${nodeId}:`, error);
          // Continue with other nodes even if one fails
        }
      }

      return facts;
    } catch (error) {
      console.error("Neo4j query error:", error);
      throw new Error("Failed to fetch graph context");
    } finally {
      // Always close the session
      if (session) {
        await session.close();
      }
    }
  }

  /**
   * Execute a custom Cypher query
   * Allows for flexible graph queries beyond the standard context fetch
   *
   * @param query - Cypher query string
   * @param parameters - Query parameters
   * @returns Query results
   */
  public async executeQuery(
    query: string,
    parameters: Record<string, any> = {}
  ): Promise<any[]> {
    if (!this.isInitialized || !this.driver) {
      await this.initialize();
    }

    let session: Session | null = null;

    try {
      session = this.driver!.session();
      const result = await session.run(query, parameters);

      // Convert records to plain objects
      return result.records.map((record) => {
        const obj: Record<string, any> = {};
        (record.keys as string[]).forEach((key) => {
          obj[key] = record.get(key);
        });
        return obj;
      });
    } catch (error) {
      console.error("Neo4j query execution error:", error);
      throw new Error("Failed to execute Neo4j query");
    } finally {
      if (session) {
        await session.close();
      }
    }
  }

  /**
   * Get node details by ID
   * Retrieves all properties of a specific node
   *
   * @param nodeId - The node ID to fetch
   * @returns Node properties or null if not found
   */
  public async getNode(nodeId: string): Promise<Record<string, any> | null> {
    if (!this.isInitialized || !this.driver) {
      await this.initialize();
    }

    let session: Session | null = null;

    try {
      session = this.driver!.session();

      const query = "MATCH (n {id: $nodeId}) RETURN n";
      const result = await session.run(query, { nodeId });

      if (result.records.length === 0) {
        return null;
      }

      const node = result.records[0].get("n");
      return node.properties;
    } catch (error) {
      console.error(`Error fetching node ${nodeId}:`, error);
      return null;
    } finally {
      if (session) {
        await session.close();
      }
    }
  }

  /**
   * Check Neo4j connection health
   * Verifies that the driver can connect to the database
   *
   * @returns Boolean indicating health status
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.driver) {
        return false;
      }

      // Verify connectivity
      await this.driver.verifyConnectivity();
      return true;
    } catch (error) {
      console.error("Neo4j health check failed:", error);
      return false;
    }
  }

  /**
   * Close the Neo4j driver connection
   * Should be called when shutting down the application
   */
  public async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.isInitialized = false;
      this.driver = null;
      console.log("✓ Neo4j connection closed");
    }
  }
}

// Export singleton instance
export const neo4jService = Neo4jService.getInstance();
