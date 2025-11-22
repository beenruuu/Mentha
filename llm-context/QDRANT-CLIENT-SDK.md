# Qdrant Python Client Documentation

This document provides a comprehensive guide to using the Qdrant Python Client for interacting with the Qdrant vector search engine. The client library contains type definitions for all Qdrant API endpoints and allows you to make both synchronous and asynchronous requests.

## Table of Contents

- [Installation](#installation)
- [Client Initialization](#client-initialization)
- [Collections](#collections)
  - [Creating Collections](#creating-collections)
  - [Collection Management](#collection-management)
- [Vector Operations](#vector-operations)
  - [Upserting Vectors](#upserting-vectors)
  - [Searching Vectors](#searching-vectors)
  - [Filtering](#filtering)
  - [Deleting Vectors](#deleting-vectors)
- [Payload Operations](#payload-operations)
  - [Managing Payload Data](#managing-payload-data)
  - [Filtering by Payload](#filtering-by-payload)
- [Advanced Features](#advanced-features)
  - [Batching Operations](#batching-operations)
  - [Recommend API](#recommend-api)
  - [Discover API](#discover-api)
- [Async Client](#async-client)
- [FastEmbed Integration](#fastembed-integration)
- [Important Models](#important-models)

## Installation

Qdrant Python Client can be installed using pip:

```bash
pip install qdrant-client
```

## Client Initialization

Initialize a client to connect to your Qdrant instance:

```python
from qdrant_client import QdrantClient

# Connect to a local Qdrant instance
client = QdrantClient(host="localhost", port=6333)

# Or connect to a remote Qdrant instance with API key
client = QdrantClient(
    url="https://your-qdrant-cluster-url.com",
    api_key="your-api-key"
)
```

## Collections

### Creating Collections

Collections in Qdrant are where you store and search your vectors:

```python
from qdrant_client.models import VectorParams, Distance

# Check if collection exists before creating
if not client.collection_exists("my_collection"):
    # Create a new collection with 100-dimensional vectors using cosine distance
    client.create_collection(
        collection_name="my_collection",
        vectors_config=VectorParams(size=100, distance=Distance.COSINE),
    )
```

You can configure various parameters for your collection:

```python
from qdrant_client.models import VectorParams, Distance, OptimizersConfig, HnswConfig

client.create_collection(
    collection_name="my_collection",
    vectors_config=VectorParams(
        size=768,  # Vector size
        distance=Distance.COSINE,  # Distance function
    ),
    optimizers_config=OptimizersConfig(
        memmap_threshold=20000  # Use disk storage when collection gets large
    ),
    hnsw_config=HnswConfig(
        m=16,  # Number of connections per layer
        ef_construct=100  # Higher values = better recall, slower indexing
    )
)
```

### Collection Management

Common collection management operations:

```python
# Check if a collection exists
exists = client.collection_exists("my_collection")

# Get collection info
info = client.get_collection(collection_name="my_collection")

# List all collections
collections = client.get_collections()

# Delete a collection
client.delete_collection(collection_name="my_collection")
```

## Vector Operations

### Upserting Vectors

Insert or update vectors in a collection:

```python
import numpy as np
from qdrant_client.models import PointStruct

# Generate random vectors for demonstration
vectors = np.random.rand(100, 100)

# Upsert points with IDs, vectors, and optional payload
client.upsert(
    collection_name="my_collection",
    points=[
        PointStruct(
            id=idx,
            vector=vector.tolist(),  # Vector data
            payload={"color": "red", "category": "electronics", "price": 100}  # Metadata
        )
        for idx, vector in enumerate(vectors)
    ]
)
```

### Searching Vectors

Perform vector similarity search:

```python
# Create a query vector
query_vector = np.random.rand(100)

# Basic search - find 5 most similar vectors
search_results = client.search(
    collection_name="my_collection",
    query_vector=query_vector,
    limit=5  # Return 5 closest points
)

# Example result processing
for hit in search_results:
    print(f"ID: {hit.id}, Score: {hit.score}, Payload: {hit.payload}")
```

### Filtering

Combine vector search with metadata filtering:

```python
from qdrant_client.models import Filter, FieldCondition, Range, MatchValue

# Search with a filter on payload properties
hits = client.search(
    collection_name="my_collection",
    query_vector=query_vector,
    query_filter=Filter(
        must=[  # All these conditions must match (AND)
            FieldCondition(
                key='price',
                range=Range(
                    gte=50,  # price >= 50
                    lte=200  # price <= 200
                )
            ),
            FieldCondition(
                key='category',
                match=MatchValue(value="electronics")  # exact match
            )
        ]
    ),
    limit=5
)
```

Complex filtering with logical operations:

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue

# Search with complex filtering
search_results = client.search(
    collection_name="my_collection",
    query_vector=query_vector,
    query_filter=Filter(
        must=[  # AND
            FieldCondition(key="category", match=MatchValue(value="electronics"))
        ],
        should=[  # OR
            FieldCondition(key="color", match=MatchValue(value="red")),
            FieldCondition(key="color", match=MatchValue(value="blue"))
        ],
        must_not=[  # NOT
            FieldCondition(key="price", range=Range(gt=1000))
        ]
    ),
    limit=10
)
```

### Deleting Vectors

Remove vectors from a collection:

```python
# Delete points by their IDs
client.delete(
    collection_name="my_collection",
    points_selector=[1, 2, 3, 4, 5]  # List of point IDs to delete
)

# Delete with a filter
client.delete(
    collection_name="my_collection",
    points_selector=Filter(
        must=[
            FieldCondition(
                key="category",
                match=MatchValue(value="discontinued")
            )
        ]
    )
)
```

## Payload Operations

### Managing Payload Data

Operations for managing point metadata:

```python
# Set payload for specific points
client.set_payload(
    collection_name="my_collection",
    payload={"in_stock": True, "promotion": "summer_sale"},
    points=[1, 2, 3]  # Points to update
)

# Delete specific payload keys
client.delete_payload(
    collection_name="my_collection",
    keys=["promotion"],
    points=[1, 2, 3]
)

# Clear all payload for specific points
client.clear_payload(
    collection_name="my_collection",
    points=[1, 2, 3]
)
```

### Filtering by Payload

Perform payload-only queries without vector search:

```python
# Scroll through points matching a filter
scroll_results = client.scroll(
    collection_name="my_collection",
    scroll_filter=Filter(
        must=[
            FieldCondition(key="in_stock", match=MatchValue(value=True))
        ]
    ),
    limit=100
)

# Count points matching a filter
count_result = client.count(
    collection_name="my_collection",
    count_filter=Filter(
        must=[
            FieldCondition(key="category", match=MatchValue(value="electronics"))
        ]
    )
)
print(f"Matching points: {count_result.count}")
```

## Advanced Features

### Batching Operations

Perform operations in batch for better performance:

```python
from qdrant_client.models import PointStruct, SearchRequest

# Batch search with different query vectors
batch_results = client.search_batch(
    collection_name="my_collection",
    requests=[
        SearchRequest(
            vector=np.random.rand(100).tolist(),
            filter=Filter(
                must=[FieldCondition(key="category", match=MatchValue(value="electronics"))]
            ),
            limit=3
        ),
        SearchRequest(
            vector=np.random.rand(100).tolist(),
            filter=Filter(
                must=[FieldCondition(key="category", match=MatchValue(value="furniture"))]
            ),
            limit=5
        )
    ]
)
```

### Recommend API

Find similar vectors to existing points:

```python
# Recommend similar items based on existing points
recommendations = client.recommend(
    collection_name="my_collection",
    positive=[15, 25, 35],  # Points to use as positive examples
    negative=[10, 20],      # Points to use as negative examples
    limit=10
)
```

### Discover API

Explore diverse but relevant results:

```python
# Discover diverse but relevant results
discover_results = client.discover(
    collection_name="my_collection",
    query_vector=query_vector,
    limit=10
)
```

## Async Client

Starting from version 1.6.1, all Python client methods are available in async version:

```python
from qdrant_client import AsyncQdrantClient, models
import numpy as np
import asyncio

async def main():
    # Initialize async client
    client = AsyncQdrantClient(url="http://localhost:6333")

    # Create collection if doesn't exist
    if not await client.collection_exists("my_collection"):
        await client.create_collection(
            collection_name="my_collection",
            vectors_config=models.VectorParams(size=10, distance=models.Distance.COSINE),
        )

    # Upsert vectors
    await client.upsert(
        collection_name="my_collection",
        points=[
            models.PointStruct(
                id=i,
                vector=np.random.rand(10).tolist(),
                payload={"category": "test"}
            )
            for i in range(100)
        ],
    )

    # Perform search
    res = await client.search(
        collection_name="my_collection",
        query_vector=np.random.rand(10).tolist(),
        limit=10,
    )

    print(res)

# Run the async function
asyncio.run(main())
```

## FastEmbed Integration

Qdrant Python Client offers integration with `fastembed` for easy embedding generation:

```python
from qdrant_client import QdrantClient
from qdrant_client.fastembed import FastEmbedClient

# Create client with FastEmbed integration
client = FastEmbedClient()

# Create collection with default all-MiniLM-L6-v2 768-dim embeddings
client.create_collection("my_fastembed_collection")

# Upsert documents with automatic embedding
client.add(
    collection_name="my_fastembed_collection",
    documents=["This is a document", "This is another document"],
    ids=["doc1", "doc2"]
)

# Search documents by text query
results = client.query(
    collection_name="my_fastembed_collection",
    query_text="document",
    limit=5
)
```

## Important Models

These are some of the most commonly used models in the Qdrant Python client:

- `PointStruct`: Represents a point with ID, vector, and payload
- `Filter`: Define filtering conditions
- `FieldCondition`: Conditions for filtering on payload fields
- `Range`: Range conditions for numeric values
- `MatchValue`: Exact matching for values
- `VectorParams`: Vector configuration parameters
- `Distance`: Enum defining distance functions (COSINE, EUCLID, DOT)
- `SearchRequest`: Define search parameters
- `BatchRequest`: Perform operations in batches
- `OptimizersConfig`: Configure collection optimization parameters
- `HnswConfig`: Configure HNSW index parameters

---

This documentation is based on the [official Qdrant Python Client documentation](https://python-client.qdrant.tech/).