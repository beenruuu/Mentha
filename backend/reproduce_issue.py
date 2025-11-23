
import json
import re

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
                print("JSON parsed successfully.")
                return results
            except json.JSONDecodeError as e:
                # If strict=False fails, try aggressive cleanup
                print(f"Standard parse failed: {e}")
                print("Attempting aggressive cleanup...")
                # Replace actual newlines with space to salvage the JSON
                # We only do this if the initial parse failed
                json_str_clean = json_str.replace('\n', ' ').replace('\r', '')
                results = json.loads(json_str_clean, strict=False)
                print("JSON parsed successfully after aggressive cleanup.")
                return results

        else:
            print("Could not find JSON brackets in response.")
            return {"raw_text": content}
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        return {"error": str(e)}

# Snippet from user log
malformed_json = """
{
    "score": 62,
    "summary": "Grupo Dissan tiene presencia estable en resultados locales y de nicho dentro del sector de servicios integrales. Sin embargo, su visibilidad en motores de búsqueda y...
"""

# Simulate the error context
# The user log says: JSON Decode Error: Expecting ',' delimiter: line 1 column 1987 (char 1986)
# This implies the JSON was much longer and failed later.
# But let's try with the snippet which is clearly truncated/malformed.

print("--- Test 1: Truncated JSON ---")
parse_json(malformed_json)

# Test with unescaped newlines which is another common issue
unescaped_newlines = """
{
    "score": 62,
    "summary": "Line 1
Line 2"
}
"""
print("\n--- Test 2: Unescaped Newlines ---")
parse_json(unescaped_newlines)
