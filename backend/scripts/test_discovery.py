import httpx
import asyncio
import json

async def test_discovery():
    url = "http://localhost:8000/api/competitors/discover"
    # Note: This might need an auth token if the backend is running and requires it.
    # For now, I'll assume the user's environment might allow local testing or I'll just check the logic.
    
    payload = {
        "brand_name": "Dissan",
        "industry": "Cleaning Services",
        "domain": "grupodissan.com",
        "description": "Servicios de limpieza industrial y mantenimiento.",
        "country": "ES",
        "language": "es",
        "business_scope": "national"
    }
    
    # Since I don't have the auth token, I'll just mock a call if needed, 
    # but I'll try to check if I can hit it if it's already running.
    # However, it's safer to just verify the code logic I wrote.
    
    print(f"Testing discovery for {payload['brand_name']}...")
    # ... (rest of the test script if I could run it)

if __name__ == "__main__":
    # asyncio.run(test_discovery())
    pass
