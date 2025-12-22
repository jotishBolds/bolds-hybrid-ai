#!/usr/bin/env python3
"""
Verify database uploads and show statistics
"""

import config
from pinecone import Pinecone
import neo4j

print("🔍 Verifying database uploads...")

# Check Pinecone
print("\n📊 Pinecone Statistics:")
pc = Pinecone(api_key=config.PINECONE_API_KEY)
index = pc.Index(config.PINECONE_INDEX_NAME)
stats = index.describe_index_stats()
print(f"✅ Total vectors: {stats['total_vector_count']}")
print(f"✅ Index dimension: {stats.get('dimension', 'Unknown')}")

# Check Neo4j
print("\n🔗 Neo4j Statistics:")
driver = neo4j.GraphDatabase.driver(config.NEO4J_URI, auth=(config.NEO4J_USER, config.NEO4J_PASSWORD))

with driver.session() as session:
    # Count nodes
    result = session.run("MATCH (n) RETURN count(n) as total_nodes")
    total_nodes = result.single()['total_nodes']
    print(f"✅ Total nodes: {total_nodes}")
    
    # Count relationships
    result = session.run("MATCH ()-[r]->() RETURN count(r) as total_relationships")
    total_relationships = result.single()['total_relationships']
    print(f"✅ Total relationships: {total_relationships}")
    
    # Show node types
    result = session.run("""
        MATCH (n:Entity) 
        RETURN n.type as node_type, count(n) as count 
        ORDER BY count DESC
        LIMIT 10
    """)
    print(f"\n📋 Node types:")
    for record in result:
        print(f"   - {record['node_type']}: {record['count']} nodes")

driver.close()
print(f"\n🎉 Database verification complete!")
print(f"📈 Your Sikkim Government Service Rules assistant is ready to use!")