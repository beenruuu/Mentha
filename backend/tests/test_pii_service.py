import unittest
import sys
import os

# Add backend to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.processing.pii_service import PiiService

class TestPiiService(unittest.TestCase):
    def setUp(self):
        self.service = PiiService()

    def test_pii_redaction(self):
        text = "My email is test@example.com and phone is 555-123-4567."
        
        if not self.service.enabled:
            print("WARNING: PiiService is disabled. Presidio models might be missing.")
            # If disabled, it should return original text
            result = self.service.anonymize_text(text)
            self.assertEqual(result, text)
        else:
            result = self.service.anonymize_text(text)
            self.assertNotEqual(result, text)
            self.assertIn("<EMAIL>", result)
            self.assertIn("<PHONE>", result)
            print(f"Original: {text}")
            print(f"Redacted: {result}")

    def test_pii_spanish(self):
        # Test DNI detection (Spanish ID)
        text = "Mi DNI es 12345678Z y mi correo es hola@ejemplo.es"
        
        if not self.service.enabled:
            return

        # Explicitly use Spanish language model
        result = self.service.anonymize_text(text, language='es')
        
        self.assertIn("<EMAIL>", result)
        # Note: Presidio's DNI detection depends on the ES_NIF recognizer. 
        # If it's correctly loaded, it should appear.
        # We assert generic PII or specific DNI/NIF placeholder.
        self.assertTrue("<DNI/NIE>" in result or "<PII>" in result, f"Failed to redact DNI in: {result}")
        print(f"Original ES: {text}")
        print(f"Redacted ES: {result}")

if __name__ == '__main__':
    unittest.main()
