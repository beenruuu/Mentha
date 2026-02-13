import httpx
import asyncio

async def test_query():
    url = "http://127.0.0.1:8000/api/prompts/query"
    
    # Payload 1: Minimal (should work now that fields are optional)
    payload_minimal = {}
    
    # Payload 2: Full valid payload
    payload_full = {
        "brand_id": "test-brand-id",
        "prompt": "Test prompt",
        "providers": ["openai"]
    }
    
    # Payload 3: Invalid type
    payload_invalid = {
        "brand_id": 123,  # Int instead of str
        "prompt": "Test",
        "providers": "openai" # Str instead of List
    }

    async with httpx.AsyncClient() as client:
        print(f"Testing URL: {url}")
        
        try:
            print("\n--- Test 1: Empty Payload ---")
            resp = await client.post(url, json=payload_minimal)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            
            print("\n--- Test 2: Full Payload ---")
            resp = await client.post(url, json=payload_full)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            
            print("\n--- Test 3: Invalid Payload ---")
            resp = await client.post(url, json=payload_invalid)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_query())
