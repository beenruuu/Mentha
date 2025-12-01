import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Mock settings
from unittest.mock import MagicMock
import sys
sys.modules['app.core.config'] = MagicMock()
sys.modules['app.core.config'].settings = MagicMock()
sys.modules['app.core.config'].settings.OPENAI_API_KEY = "sk-fake-key"

from app.services.analysis.visual_asset_service import VisualAssetService

# Mock httpx.AsyncClient
async def mock_post(*args, **kwargs):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        'choices': [{'message': {'content': 'A photorealistic image of a futuristic vertical farm with LED lighting and lush green crops.'}}]
    }
    return mock_response

# Mock async method
async def mock_generate_prompt(self, context):
    return "A photorealistic image of a futuristic vertical farm with LED lighting and lush green crops."

VisualAssetService._generate_nano_banana_prompt = mock_generate_prompt


# Load environment variables
load_dotenv()

async def test_visual_generator():
    print("Testing VisualAssetService...")
    
    # Check for OpenAI API Key
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment variables.")
        return

    service = VisualAssetService()
    
    # Mock content that should trigger visual suggestions
    # Needs to be > 150 words and have headers to be parsed correctly by the simple heuristic
    mock_content = """
    <h1>The Future of Sustainable Agriculture</h1>
    
    The future of sustainable agriculture relies heavily on advanced hydroponic systems and vertical farming technologies. These systems use up to 90% less water than traditional farming methods, making them essential for a water-scarce future. By controlling the environment, we can ensure optimal growth conditions year-round, regardless of external weather patterns. Vertical farming is another key component, allowing for high-density crop production in urban areas where land is scarce and expensive. This reduces transportation costs and carbon footprint significantly, as food is grown closer to where it is consumed.
    
    Furthermore, the integration of AI and IoT sensors allows for precise monitoring of plant health, nutrient levels, and environmental conditions. This data-driven approach maximizes yield and minimizes waste. We are seeing a shift towards "smart farms" that can operate with minimal human intervention, using robotics for planting, harvesting, and maintenance. The potential for these technologies to feed a growing global population without further degrading our planet's ecosystems is immense. It represents a paradigm shift in how we think about food production, moving from extensive land use to intensive, efficient, and controlled environments.
    
    In addition to technological advancements, there is a growing movement towards regenerative agriculture practices. These include cover cropping, crop rotation, and no-till farming, which help to restore soil health and sequester carbon. By combining high-tech solutions with nature-based practices, we can create a truly sustainable food system. Consumers are also playing a role by demanding more transparency and sustainability in the food supply chain. This consumer pressure is driving major food companies to adopt more sustainable sourcing practices and invest in new technologies. The path forward is clear: we must embrace innovation and sustainability to secure our food future.
    """
    
    print("\nAnalyzing content for visual gaps...")
    suggestions = await service.analyze_visual_gaps(mock_content)
    
    if suggestions:
        print(f"\nFound {len(suggestions)} visual suggestions:")
        for i, suggestion in enumerate(suggestions):
            print(f"\nSuggestion {i+1}:")
            print(f"  Type: {suggestion['type']}")
            print(f"  Reason: {suggestion['reason']}")
            print(f"  Context: {suggestion['context'][:50]}...")
            print(f"  Prompt: {suggestion['suggested_prompt']}")
    else:
        print("\nNo visual suggestions found.")

if __name__ == "__main__":
    asyncio.run(test_visual_generator())
