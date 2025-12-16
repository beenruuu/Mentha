from typing import List, Optional
from presidio_analyzer import AnalyzerEngine, PatternRecognizer, RecognizerRegistry, Pattern
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig
import logging
import os

logger = logging.getLogger(__name__)

class PiiService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PiiService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self.enabled = os.getenv("ENABLE_PII_REDACTION", "true").lower() == "true"
        
        if self.enabled:
            try:
                logger.info("Initializing Presidio PII Engine with EN and ES support...")
                
                # Configure NLP engine to support both English and Spanish
                configuration = {
                    "nlp_engine_name": "spacy",
                    "models": [
                        {"lang_code": "en", "model_name": "en_core_web_lg"},
                        {"lang_code": "es", "model_name": "es_core_news_lg"},
                    ],
                }
                
                provider = NlpEngineProvider(nlp_configuration=configuration)
                nlp_engine = provider.create_engine()

                # Initialize Analyzer with multi-language support
                self.analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en", "es"])
                self.anonymizer = AnonymizerEngine()
                
                # Add custom patterns if needed (DNI is usually covered by built-in ES_NIF recognizer in Presidio 2.2+)
                # But to be safe, we can ensure it's active or add a backup regex if built-in fails
                self._add_custom_recognizers()
                
                logger.info("Presidio PII Engine (EN/ES) initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Presidio engines: {e}")
                self.enabled = False
        else:
            logger.info("PII Redaction is disabled via configuration.")

    def _add_custom_recognizers(self):
        # Example: Add specific heavy-regex for DNI/NIE if built-in one misses cases
        # For now we rely on Presidio's default registry which includes ES_NIF
        pass

    def anonymize_text(self, text: str, entities: Optional[List[str]] = None, language: str = 'es') -> str:
        """
        Analyze and anonymize PII in the given text.
        
        Args:
            text: Input text to clean
            entities: List of entity types to look for.
            language: Language code ('en' or 'es'). Defaults to 'es' for LOPD compliance.
            
        Returns:
            Text with PII replaced by placeholders (e.g. <EMAIL>)
        """
        if not self.enabled or not text:
            return text

        if entities is None:
            # Default entities to redact
            # Added ES_NIF for Spanish ID
            entities = ["EMAIL_ADDRESS", "PHONE_NUMBER", "IP_ADDRESS", "CREDIT_CARD", "PERSON", "ES_NIF"]

        try:
            # Analyze
            results = self.analyzer.analyze(
                text=text,
                entities=entities,
                language=language 
            )

            if not results:
                return text

            # Anonymize
            anonymized_result = self.anonymizer.anonymize(
                text=text,
                analyzer_results=results,
                operators={
                    "DEFAULT": OperatorConfig("replace", {"new_value": "<PII>"}),
                    "EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "<EMAIL>"}),
                    "PHONE_NUMBER": OperatorConfig("replace", {"new_value": "<PHONE>"}),
                    "IP_ADDRESS": OperatorConfig("replace", {"new_value": "<IP_ADDRESS>"}),
                    "CREDIT_CARD": OperatorConfig("replace", {"new_value": "<CREDIT_CARD>"}),
                    "PERSON": OperatorConfig("replace", {"new_value": "<PERSON>"}),
                    "ES_NIF": OperatorConfig("replace", {"new_value": "<DNI/NIE>"}),
                }
            )
            
            return anonymized_result.text
            
        except Exception as e:
            logger.error(f"Error during PII anonymization: {e}")
            return text 
