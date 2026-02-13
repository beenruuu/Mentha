import httpx
import asyncio

async def test_url():
    url = "https://www.grupodissan.com/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    print(f"Testing {url}...")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0, headers=headers, verify=False) as client:
            response = await client.get(url)
            print(f"Status: {response.status_code}")
            print(f"Headers: {response.headers}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_url())
