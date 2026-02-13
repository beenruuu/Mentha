
import json
import re

def escape_newlines_in_strings(text):
    """Escape unescaped newlines within JSON string values"""
    result = []
    in_string = False
    i = 0
    while i < len(text):
        char = text[i]
        
        # Toggle string state when we encounter unescaped quotes
        if char == '"' and (i == 0 or text[i-1] != '\\'):
            in_string = not in_string
            result.append(char)
        # If we're in a string and encounter a newline, escape it
        elif in_string and char in ('\n', '\r'):
            if char == '\n':
                result.append('\\n')
            # Skip \r characters
        else:
            result.append(char)
        
        i += 1
    
    return ''.join(result)

def parse_json(content):
    print(f"Content length: {len(content)}")
    try:
        # Try to find JSON in the response if it's wrapped in text
        
        # Strip markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        start_idx = content.find('{')
        end_idx = content.rfind('}') + 1
        if start_idx != -1 and end_idx != -1:
            json_str = content[start_idx:end_idx]
            # Basic cleanup for common LLM JSON errors
            # Remove trailing commas before closing braces/brackets
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            # Remove comments if any (// ...)
            json_str = re.sub(r'//.*', '', json_str)
            
            try:
                results = json.loads(json_str, strict=False)
                print("✅ JSON parsed successfully.")
                return results
            except json.JSONDecodeError as e:
                print(f"❌ Standard parse failed: {e}")
                print("🔧 Attempting to escape newlines in strings...")
                
                json_str_fixed = escape_newlines_in_strings(json_str)
                
                try:
                    results = json.loads(json_str_fixed, strict=False)
                    print("✅ JSON parsed successfully after escaping newlines.")
                    return results
                except json.JSONDecodeError as e2:
                    print(f"❌ Newline escaping failed: {e2}")
                    print("🔧 Attempting aggressive cleanup (replacing all newlines)...")
                    json_str_clean = json_str.replace('\n', ' ').replace('\r', '')
                    try:
                        results = json.loads(json_str_clean, strict=False)
                        print("✅ JSON parsed successfully after aggressive cleanup.")
                        return results
                    except json.JSONDecodeError as e3:
                        print(f"❌ All parsing attempts failed: {e3}")
                        return {"error": str(e3)}

        else:
            print("Could not find JSON brackets in response.")
            return {"raw_text": content}
    except Exception as e:
        print(f"Exception during parsing: {e}")
        return {"error": str(e)}

# Test cases based on the user's error logs

# Test 1: Truncated JSON (incomplete)
print("=" * 60)
print("Test 1: Truncated JSON")
print("=" * 60)
malformed_json = """
{
    "score": 62,
    "summary": "Grupo Dissan tiene presencia estable en resultados locales y de nicho dentro del sector de servicios integrales. Sin embargo, su visibilidad en motores de búsqueda y...
"""
result = parse_json(malformed_json)
print(f"Result keys: {result.keys()}")
print()

# Test 2: Unescaped newlines in summary (most common issue)
print("=" * 60)
print("Test 2: Unescaped Newlines in Summary")
print("=" * 60)
unescaped_newlines = """
{
    "score": 62,
    "summary": "Line 1
Line 2",
    "keywords": [
        {"keyword": "test", "search_volume": 100}
    ]
}
"""
result = parse_json(unescaped_newlines)
print(f"Result keys: {result.keys()}")
if 'keywords' in result:
    print(f"Keywords found: {len(result['keywords'])}")
print()

# Test 3: Realistic full response with unescaped newlines
print("=" * 60)
print("Test 3: Realistic Full Response with Unescaped Newlines")
print("=" * 60)
realistic_response = """{
    "score": 68,
    "summary": "Grupo Dissan muestra una presencia digital moderada con posicionamiento sólido en términos de mantenimiento integral y facility management, pero carece de visibilidad en búsquedas relacionadas con IA.
Necesita fortalecer su estrategia de contenido digital.",
    "strengths": ["Experiencia consolidada", "Servicios integrales"],
    "weaknesses": ["Baja visibilidad online", "Contenido limitado"],
    "keywords": [
        {
            "keyword": "mantenimiento integral",
            "search_volume": 1200,
            "difficulty": 45.5,
            "ai_visibility_score": 35.2,
            "opportunity": "high"
        },
        {
            "keyword": "facility management",
            "search_volume": 800,
            "difficulty": 52.0,
            "ai_visibility_score": 28.5,
            "opportunity": "medium"
        }
    ],
    "competitors": [
        {
            "name": "Competitor A",
            "domain": "competitora.com",
            "visibility_score": 72.5,
            "tracked": true,
            "insight": "Fuerte presencia en contenido educativo"
        }
    ],
    "crawlers": [
        {
            "name": "GPTBot",
            "model": "ChatGPT",
            "last_visit_hours": 48,
            "frequency": "weekly",
            "pages_visited": 15,
            "insight": "Visitas regulares a páginas de servicios",
            "top_pages": ["/servicios", "/contacto"]
        }
    ]
}"""
result = parse_json(realistic_response)
print(f"Result keys: {result.keys()}")
if 'keywords' in result:
    print(f"✅ Keywords found: {len(result['keywords'])}")
if 'competitors' in result:
    print(f"✅ Competitors found: {len(result['competitors'])}")
if 'crawlers' in result:
    print(f"✅ Crawlers found: {len(result['crawlers'])}")
if 'error' in result:
    print(f"❌ Error: {result['error']}")
print()
