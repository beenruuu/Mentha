"""
Enhanced Hallucination Detection with RAGAS/DeepEval Integration.

This module enhances the basic hallucination detection with enterprise-grade
metrics from the RAGAS framework:

1. Faithfulness - Does the answer stick to the provided context?
2. Answer Relevance - Does the answer address the question?
3. Context Precision - Are retrieved contexts relevant?
4. Context Recall - Does context contain all ground truth info?

These metrics provide a multi-dimensional view of AI response quality
beyond simple fact-checking.

Architecture:
- RAGASEvaluator class using ragas library
- DeepEvalEvaluator class using deepeval library
- UnifiedHallucinationService combining both approaches

Reference: https://docs.ragas.io/en/stable/concepts/metrics/
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

import httpx
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger(__name__)


class HallucinationType(str, Enum):
    """Types of hallucinations detected."""
    FACTUAL = "factual"  # Wrong facts (dates, numbers)
    ATTRIBUTION = "attribution"  # Wrongly attributed features/products
    FABRICATION = "fabrication"  # Completely made-up information
    EXAGGERATION = "exaggeration"  # Overstated claims
    OUTDATED = "outdated"  # Information no longer accurate


@dataclass
class RAGASMetrics:
    """RAGAS evaluation metrics for a single response."""
    faithfulness: float = 0.0  # 0-1: How faithful to context
    answer_relevance: float = 0.0  # 0-1: How relevant to question
    context_precision: float = 0.0  # 0-1: Precision of retrieved contexts
    context_recall: float = 0.0  # 0-1: Recall of ground truth
    
    # Composite scores
    overall_score: float = 0.0  # Weighted average
    hallucination_risk: str = "low"  # low/medium/high/critical
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "faithfulness": round(self.faithfulness, 3),
            "answer_relevance": round(self.answer_relevance, 3),
            "context_precision": round(self.context_precision, 3),
            "context_recall": round(self.context_recall, 3),
            "overall_score": round(self.overall_score, 3),
            "hallucination_risk": self.hallucination_risk,
        }


@dataclass
class DeepEvalMetrics:
    """DeepEval evaluation metrics for a single response."""
    hallucination_score: float = 0.0  # 0-1: Probability of hallucination
    factual_consistency: float = 0.0  # 0-1: Consistency with facts
    answer_relevancy: float = 0.0  # 0-1: Relevancy to query
    bias_score: float = 0.0  # 0-1: Detected bias
    toxicity_score: float = 0.0  # 0-1: Detected toxicity
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "hallucination_score": round(self.hallucination_score, 3),
            "factual_consistency": round(self.factual_consistency, 3),
            "answer_relevancy": round(self.answer_relevancy, 3),
            "bias_score": round(self.bias_score, 3),
            "toxicity_score": round(self.toxicity_score, 3),
        }


@dataclass
class ClaimAnalysis:
    """Analysis of a single claim."""
    claim_text: str
    claim_type: HallucinationType
    source_model: str
    is_hallucination: bool
    confidence: float
    supporting_evidence: Optional[str] = None
    contradicting_evidence: Optional[str] = None
    explanation: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "claim": self.claim_text,
            "type": self.claim_type.value,
            "model": self.source_model,
            "is_hallucination": self.is_hallucination,
            "confidence": round(self.confidence, 2),
            "supporting_evidence": self.supporting_evidence,
            "contradicting_evidence": self.contradicting_evidence,
            "explanation": self.explanation,
        }


@dataclass
class EnhancedHallucinationResult:
    """Complete result of enhanced hallucination detection."""
    brand_name: str
    query: str
    
    # RAGAS metrics
    ragas_metrics: Optional[RAGASMetrics] = None
    
    # DeepEval metrics
    deepeval_metrics: Optional[DeepEvalMetrics] = None
    
    # Claim-level analysis
    claims: List[ClaimAnalysis] = field(default_factory=list)
    
    # Summary statistics
    total_claims: int = 0
    hallucinated_claims: int = 0
    verified_claims: int = 0
    unverified_claims: int = 0
    
    # Overall assessment
    overall_accuracy: float = 0.0  # 0-100
    hallucination_rate: float = 0.0  # 0-100
    risk_level: str = "low"  # low/medium/high/critical
    
    # Recommendations
    recommendations: List[str] = field(default_factory=list)
    
    analysis_timestamp: Optional[datetime] = None
    
    def __post_init__(self):
        if self.analysis_timestamp is None:
            self.analysis_timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "brand_name": self.brand_name,
            "query": self.query,
            "ragas_metrics": self.ragas_metrics.to_dict() if self.ragas_metrics else None,
            "deepeval_metrics": self.deepeval_metrics.to_dict() if self.deepeval_metrics else None,
            "claims": [c.to_dict() for c in self.claims],
            "summary": {
                "total_claims": self.total_claims,
                "hallucinated": self.hallucinated_claims,
                "verified": self.verified_claims,
                "unverified": self.unverified_claims,
            },
            "scores": {
                "overall_accuracy": round(self.overall_accuracy, 1),
                "hallucination_rate": round(self.hallucination_rate, 1),
                "risk_level": self.risk_level,
            },
            "recommendations": self.recommendations,
            "analysis_timestamp": self.analysis_timestamp.isoformat() if self.analysis_timestamp else None,
        }


class RAGASEvaluator:
    """
    Evaluator using RAGAS metrics.
    
    RAGAS (Retrieval Augmented Generation Assessment) provides standardized
    metrics for evaluating RAG pipeline quality.
    
    When ragas library is available, uses native implementation.
    Otherwise, falls back to LLM-based approximation.
    """
    
    def __init__(self):
        self._ragas_available = self._check_ragas_available()
        self._openai_key = settings.OPENAI_API_KEY
    
    def _check_ragas_available(self) -> bool:
        """Check if ragas library is installed."""
        try:
            import ragas
            return True
        except ImportError:
            logger.warning("RAGAS library not installed. Using LLM approximation.")
            return False
    
    async def evaluate(
        self,
        question: str,
        answer: str,
        contexts: List[str],
        ground_truth: Optional[str] = None
    ) -> RAGASMetrics:
        """
        Evaluate a response using RAGAS metrics.
        
        Args:
            question: The original question
            answer: The AI-generated answer
            contexts: Retrieved context documents
            ground_truth: Optional ground truth answer
            
        Returns:
            RAGASMetrics with all scores
        """
        if self._ragas_available:
            return await self._evaluate_with_ragas(question, answer, contexts, ground_truth)
        else:
            return await self._evaluate_with_llm(question, answer, contexts, ground_truth)
    
    async def _evaluate_with_ragas(
        self,
        question: str,
        answer: str,
        contexts: List[str],
        ground_truth: Optional[str]
    ) -> RAGASMetrics:
        """Use native RAGAS library for evaluation."""
        try:
            import os
            # RAGAS needs proper LLM/Embeddings setup - fallback to LLM evaluation if not configured
            if not settings.OPENAI_API_KEY:
                logger.warning("No OpenAI key for RAGAS - using LLM fallback")
                return await self._evaluate_with_llm(question, answer, contexts, ground_truth)
            
            # Set environment for RAGAS to use OpenAI
            os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
            
            from ragas import evaluate
            from ragas.metrics import (
                faithfulness,
                answer_relevancy,
                context_precision,
                context_recall,
            )
            from ragas.llms import LangchainLLMWrapper
            from ragas.embeddings import LangchainEmbeddingsWrapper
            from langchain_openai import ChatOpenAI, OpenAIEmbeddings
            from datasets import Dataset
            
            # Initialize LLM and Embeddings for RAGAS
            try:
                llm = LangchainLLMWrapper(ChatOpenAI(model="gpt-4o-mini", temperature=0))
                embeddings = LangchainEmbeddingsWrapper(OpenAIEmbeddings(model="text-embedding-3-small"))
            except Exception as wrap_err:
                logger.warning(f"RAGAS wrapper failed: {wrap_err} - using LLM fallback")
                return await self._evaluate_with_llm(question, answer, contexts, ground_truth)
            
            # Prepare dataset
            data = {
                "question": [question],
                "answer": [answer],
                "contexts": [contexts],
            }
            if ground_truth:
                data["ground_truth"] = [ground_truth]
            
            dataset = Dataset.from_dict(data)
            
            # Select metrics
            metrics = [faithfulness, answer_relevancy, context_precision]
            if ground_truth:
                metrics.append(context_recall)
            
            # Run evaluation with explicit LLM and embeddings
            result = evaluate(dataset, metrics=metrics, llm=llm, embeddings=embeddings)
            
            # RAGAS returns an EvaluationResult - access scores via to_pandas() or scores attribute
            # Convert to dict properly
            scores_dict = {}
            try:
                # Modern RAGAS uses scores dict or list
                if hasattr(result, 'scores'):
                    raw_scores = result.scores
                    # scores might be a list of dicts or a dict
                    if isinstance(raw_scores, list) and len(raw_scores) > 0:
                        scores_dict = raw_scores[0] if isinstance(raw_scores[0], dict) else {}
                    elif isinstance(raw_scores, dict):
                        scores_dict = raw_scores
                elif hasattr(result, 'to_pandas'):
                    df = result.to_pandas()
                    scores_dict = df.iloc[0].to_dict() if len(df) > 0 else {}
                elif hasattr(result, '__getitem__'):
                    # Try index access for list-like results
                    if len(result) > 0:
                        first_result = result[0]
                        if isinstance(first_result, dict):
                            scores_dict = first_result
                        elif hasattr(first_result, '__dict__'):
                            scores_dict = first_result.__dict__
                else:
                    # Fallback: try dict-like access
                    scores_dict = dict(result) if hasattr(result, '__iter__') else {}
            except Exception as score_err:
                logger.warning(f"Could not extract RAGAS scores: {score_err}")
                scores_dict = {}
            
            metrics_result = RAGASMetrics(
                faithfulness=float(scores_dict.get("faithfulness", 0.0)),
                answer_relevance=float(scores_dict.get("answer_relevancy", 0.0)),
                context_precision=float(scores_dict.get("context_precision", 0.0)),
                context_recall=float(scores_dict.get("context_recall", 0.0)) if ground_truth else 0.5,
            )
            
            # Calculate overall score
            scores = [
                metrics_result.faithfulness,
                metrics_result.answer_relevance,
                metrics_result.context_precision,
            ]
            metrics_result.overall_score = sum(scores) / len(scores)
            
            # Determine risk level
            metrics_result.hallucination_risk = self._calculate_risk(metrics_result)
            
            return metrics_result
            
        except Exception as e:
            logger.error(f"RAGAS evaluation failed: {e}")
            return await self._evaluate_with_llm(question, answer, contexts, ground_truth)
    
    async def _evaluate_with_llm(
        self,
        question: str,
        answer: str,
        contexts: List[str],
        ground_truth: Optional[str]
    ) -> RAGASMetrics:
        """
        Approximate RAGAS metrics using LLM when library not available.
        
        This provides a reasonable approximation of the key metrics.
        """
        if not self._openai_key:
            logger.warning("No OpenAI key for LLM evaluation")
            return RAGASMetrics()
        
        context_text = "\n".join(contexts[:3])  # Limit context size
        
        prompt = f"""You are an expert at evaluating AI response quality.
Analyze this Q&A and rate on a scale of 0.0 to 1.0:

QUESTION: {question}

CONTEXT PROVIDED:
{context_text[:2000]}

AI ANSWER:
{answer[:1500]}

{f'GROUND TRUTH: {ground_truth}' if ground_truth else ''}

Rate these metrics (0.0 = terrible, 1.0 = perfect):

1. FAITHFULNESS: Does the answer ONLY contain information that can be derived from the context? 
   - 1.0 = Every claim is supported by context
   - 0.0 = Many claims not in context

2. ANSWER_RELEVANCE: Does the answer directly address the question?
   - 1.0 = Perfectly answers the question
   - 0.0 = Completely misses the point

3. CONTEXT_PRECISION: Are the provided contexts relevant to the question?
   - 1.0 = All contexts are highly relevant
   - 0.0 = Contexts are irrelevant

Return ONLY a JSON object:
{{"faithfulness": 0.X, "answer_relevance": 0.X, "context_precision": 0.X, "explanation": "brief explanation"}}"""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 200,
                        "temperature": 0,
                    },
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    # Parse JSON from response
                    import re
                    json_match = re.search(r'\{[^{}]+\}', content, re.DOTALL)
                    if json_match:
                        scores = json.loads(json_match.group())
                        
                        metrics = RAGASMetrics(
                            faithfulness=float(scores.get("faithfulness", 0.5)),
                            answer_relevance=float(scores.get("answer_relevance", 0.5)),
                            context_precision=float(scores.get("context_precision", 0.5)),
                            context_recall=0.5 if not ground_truth else 0.5,
                        )
                        
                        # Calculate overall
                        metrics.overall_score = (
                            metrics.faithfulness * 0.4 +
                            metrics.answer_relevance * 0.4 +
                            metrics.context_precision * 0.2
                        )
                        metrics.hallucination_risk = self._calculate_risk(metrics)
                        
                        return metrics
                        
        except Exception as e:
            logger.error(f"LLM evaluation failed: {e}")
        
        return RAGASMetrics(hallucination_risk="unknown")
    
    def _calculate_risk(self, metrics: RAGASMetrics) -> str:
        """Calculate hallucination risk level from metrics."""
        if metrics.faithfulness < 0.3:
            return "critical"
        elif metrics.faithfulness < 0.5 or metrics.overall_score < 0.4:
            return "high"
        elif metrics.faithfulness < 0.7 or metrics.overall_score < 0.6:
            return "medium"
        else:
            return "low"


class DeepEvalEvaluator:
    """
    Evaluator using DeepEval metrics.
    
    DeepEval provides additional metrics focused on hallucination detection
    and safety assessment.
    """
    
    def __init__(self):
        self._deepeval_available = self._check_deepeval_available()
        self._openai_key = settings.OPENAI_API_KEY
    
    def _check_deepeval_available(self) -> bool:
        """Check if deepeval library is installed."""
        try:
            import deepeval
            return True
        except ImportError:
            logger.warning("DeepEval library not installed. Using LLM approximation.")
            return False
    
    async def evaluate(
        self,
        input_query: str,
        actual_output: str,
        context: List[str],
        expected_output: Optional[str] = None
    ) -> DeepEvalMetrics:
        """
        Evaluate a response using DeepEval metrics.
        
        Args:
            input_query: The original query
            actual_output: The AI-generated response
            context: Retrieved context documents
            expected_output: Optional expected output
            
        Returns:
            DeepEvalMetrics with all scores
        """
        if self._deepeval_available:
            return await self._evaluate_with_deepeval(
                input_query, actual_output, context, expected_output
            )
        else:
            return await self._evaluate_with_llm(
                input_query, actual_output, context
            )
    
    async def _evaluate_with_deepeval(
        self,
        input_query: str,
        actual_output: str,
        context: List[str],
        expected_output: Optional[str]
    ) -> DeepEvalMetrics:
        """Use native DeepEval library."""
        try:
            from deepeval import evaluate as deepeval_evaluate
            from deepeval.metrics import (
                HallucinationMetric,
                AnswerRelevancyMetric,
                FaithfulnessMetric,
            )
            from deepeval.test_case import LLMTestCase
            
            # Create test case
            test_case = LLMTestCase(
                input=input_query,
                actual_output=actual_output,
                context=context,
            )
            if expected_output:
                test_case.expected_output = expected_output
            
            # Initialize metrics
            hallucination = HallucinationMetric(threshold=0.5)
            relevancy = AnswerRelevancyMetric(threshold=0.5)
            
            # Evaluate
            hallucination.measure(test_case)
            relevancy.measure(test_case)
            
            return DeepEvalMetrics(
                hallucination_score=1 - hallucination.score,  # Invert: higher = worse
                answer_relevancy=relevancy.score,
                factual_consistency=hallucination.score,
            )
            
        except Exception as e:
            logger.error(f"DeepEval evaluation failed: {e}")
            return await self._evaluate_with_llm(input_query, actual_output, context)
    
    async def _evaluate_with_llm(
        self,
        input_query: str,
        actual_output: str,
        context: List[str]
    ) -> DeepEvalMetrics:
        """Approximate DeepEval metrics using LLM."""
        if not self._openai_key:
            return DeepEvalMetrics()
        
        context_text = "\n".join(context[:3])
        
        prompt = f"""Analyze this AI response for quality issues.

QUERY: {input_query}

CONTEXT:
{context_text[:2000]}

RESPONSE:
{actual_output[:1500]}

Evaluate on 0.0 to 1.0 scale:

1. HALLUCINATION_PROBABILITY: How likely the response contains made-up information?
   - 0.0 = Definitely grounded in context
   - 1.0 = Mostly fabricated

2. FACTUAL_CONSISTENCY: Does it align with the provided context?
   - 1.0 = Perfectly consistent
   - 0.0 = Contradicts context

3. ANSWER_RELEVANCY: Does it answer the query?
   - 1.0 = Directly answers query
   - 0.0 = Irrelevant response

Return ONLY JSON:
{{"hallucination_probability": 0.X, "factual_consistency": 0.X, "answer_relevancy": 0.X}}"""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 150,
                        "temperature": 0,
                    },
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    import re
                    json_match = re.search(r'\{[^{}]+\}', content)
                    if json_match:
                        scores = json.loads(json_match.group())
                        
                        return DeepEvalMetrics(
                            hallucination_score=float(scores.get("hallucination_probability", 0.5)),
                            factual_consistency=float(scores.get("factual_consistency", 0.5)),
                            answer_relevancy=float(scores.get("answer_relevancy", 0.5)),
                        )
                        
        except Exception as e:
            logger.error(f"LLM evaluation for DeepEval failed: {e}")
        
        return DeepEvalMetrics()


class EnhancedHallucinationService:
    """
    Enhanced Hallucination Detection Service combining RAGAS and DeepEval.
    
    Usage:
        service = get_enhanced_hallucination_service()
        
        result = await service.detect_hallucinations(
            brand_name="Mentha",
            query="What is Mentha and what does it do?",
            ai_response="Mentha is an AI tool...",
            contexts=["Mentha provides..."],
            ground_truth_facts={"founding_year": 2024}
        )
        
        print(f"Risk Level: {result.risk_level}")
        print(f"Hallucination Rate: {result.hallucination_rate}%")
    """
    
    _instance: Optional["EnhancedHallucinationService"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, "_initialized") and self._initialized:
            return
        
        self._ragas_evaluator = RAGASEvaluator()
        self._deepeval_evaluator = DeepEvalEvaluator()
        self._openai_key = settings.OPENAI_API_KEY
        self._initialized = True
    
    async def detect_hallucinations(
        self,
        brand_name: str,
        query: str,
        ai_response: str,
        contexts: List[str],
        ground_truth_facts: Optional[Dict[str, Any]] = None,
        use_ragas: bool = True,
        use_deepeval: bool = True
    ) -> EnhancedHallucinationResult:
        """
        Detect hallucinations using enhanced metrics.
        
        Args:
            brand_name: Brand being analyzed
            query: Original query
            ai_response: AI-generated response
            contexts: Retrieved context documents
            ground_truth_facts: Known facts for verification
            use_ragas: Whether to use RAGAS metrics
            use_deepeval: Whether to use DeepEval metrics
            
        Returns:
            EnhancedHallucinationResult with complete analysis
        """
        logger.info(f"Starting enhanced hallucination detection for {brand_name}")
        
        result = EnhancedHallucinationResult(
            brand_name=brand_name,
            query=query,
        )
        
        # Run RAGAS evaluation
        if use_ragas:
            ground_truth_str = None
            if ground_truth_facts:
                ground_truth_str = json.dumps(ground_truth_facts)
            
            result.ragas_metrics = await self._ragas_evaluator.evaluate(
                question=query,
                answer=ai_response,
                contexts=contexts,
                ground_truth=ground_truth_str,
            )
        
        # Run DeepEval evaluation
        if use_deepeval:
            result.deepeval_metrics = await self._deepeval_evaluator.evaluate(
                input_query=query,
                actual_output=ai_response,
                context=contexts,
            )
        
        # Extract and analyze individual claims
        claims = await self._extract_and_verify_claims(
            brand_name,
            ai_response,
            ground_truth_facts or {},
        )
        result.claims = claims
        
        # Calculate summary statistics
        result.total_claims = len(claims)
        result.hallucinated_claims = sum(1 for c in claims if c.is_hallucination)
        result.verified_claims = sum(1 for c in claims if not c.is_hallucination and c.confidence > 0.7)
        result.unverified_claims = result.total_claims - result.hallucinated_claims - result.verified_claims
        
        # Calculate overall scores
        if result.total_claims > 0:
            result.hallucination_rate = (result.hallucinated_claims / result.total_claims) * 100
            result.overall_accuracy = ((result.total_claims - result.hallucinated_claims) / result.total_claims) * 100
        
        # Determine risk level
        result.risk_level = self._determine_risk_level(result)
        
        # Generate recommendations
        result.recommendations = self._generate_recommendations(result)
        
        logger.info(
            f"Hallucination detection complete: {result.hallucinated_claims}/{result.total_claims} "
            f"claims hallucinated, risk={result.risk_level}"
        )
        
        return result
    
    async def _extract_and_verify_claims(
        self,
        brand_name: str,
        response: str,
        facts: Dict[str, Any]
    ) -> List[ClaimAnalysis]:
        """Extract and verify individual claims from response."""
        claims = []
        
        if not self._openai_key:
            return claims
        
        prompt = f"""Analyze this AI response about "{brand_name}" and extract factual claims.

RESPONSE:
{response[:2000]}

KNOWN FACTS:
{json.dumps(facts, indent=2) if facts else "None provided"}

Extract each factual claim and verify against known facts.

Return JSON array:
[
  {{
    "claim": "exact claim text",
    "type": "factual|attribution|fabrication|exaggeration|outdated",
    "is_hallucination": true/false,
    "confidence": 0.0-1.0,
    "explanation": "why this is/isn't a hallucination"
  }}
]

Only include verifiable factual claims, not opinions."""

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response_api = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1000,
                        "temperature": 0,
                    },
                )
                
                if response_api.status_code == 200:
                    data = response_api.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    # Parse JSON array
                    import re
                    json_match = re.search(r'\[[\s\S]*\]', content)
                    if json_match:
                        claim_list = json.loads(json_match.group())
                        
                        for c in claim_list:
                            claim_type = c.get("type", "factual")
                            try:
                                claim_type_enum = HallucinationType(claim_type)
                            except ValueError:
                                claim_type_enum = HallucinationType.FACTUAL
                            
                            claims.append(ClaimAnalysis(
                                claim_text=c.get("claim", ""),
                                claim_type=claim_type_enum,
                                source_model="ai_response",
                                is_hallucination=c.get("is_hallucination", False),
                                confidence=float(c.get("confidence", 0.5)),
                                explanation=c.get("explanation", ""),
                            ))
                            
        except Exception as e:
            logger.error(f"Claim extraction failed: {e}")
        
        return claims
    
    def _determine_risk_level(self, result: EnhancedHallucinationResult) -> str:
        """Determine overall risk level from all metrics."""
        risk_factors = []
        
        # Check RAGAS metrics
        if result.ragas_metrics:
            if result.ragas_metrics.faithfulness < 0.4:
                risk_factors.append(2)  # Major risk
            elif result.ragas_metrics.faithfulness < 0.6:
                risk_factors.append(1)  # Minor risk
            
            if result.ragas_metrics.hallucination_risk == "critical":
                risk_factors.append(3)
            elif result.ragas_metrics.hallucination_risk == "high":
                risk_factors.append(2)
        
        # Check DeepEval metrics
        if result.deepeval_metrics:
            if result.deepeval_metrics.hallucination_score > 0.7:
                risk_factors.append(2)
            elif result.deepeval_metrics.hallucination_score > 0.4:
                risk_factors.append(1)
        
        # Check claim-level analysis
        if result.hallucination_rate > 50:
            risk_factors.append(3)
        elif result.hallucination_rate > 25:
            risk_factors.append(2)
        elif result.hallucination_rate > 10:
            risk_factors.append(1)
        
        # Calculate total risk score
        total_risk = sum(risk_factors)
        
        if total_risk >= 5:
            return "critical"
        elif total_risk >= 3:
            return "high"
        elif total_risk >= 1:
            return "medium"
        else:
            return "low"
    
    def _generate_recommendations(self, result: EnhancedHallucinationResult) -> List[str]:
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        
        # Based on RAGAS metrics
        if result.ragas_metrics:
            if result.ragas_metrics.faithfulness < 0.5:
                recommendations.append(
                    "Low faithfulness detected. Improve source documentation and ensure "
                    "AI responses are grounded in verified brand information."
                )
            if result.ragas_metrics.context_precision < 0.5:
                recommendations.append(
                    "Retrieved contexts are not precise. Improve content structure "
                    "with clear headings and focused paragraphs."
                )
        
        # Based on hallucination rate
        if result.hallucination_rate > 30:
            recommendations.append(
                f"High hallucination rate ({result.hallucination_rate:.0f}%). "
                "Update brand knowledge bases across AI platforms with verified facts."
            )
        
        # Based on claim types
        claim_types = [c.claim_type for c in result.claims if c.is_hallucination]
        type_counts = {}
        for ct in claim_types:
            type_counts[ct.value] = type_counts.get(ct.value, 0) + 1
        
        if type_counts.get("factual", 0) > 2:
            recommendations.append(
                "Multiple factual errors detected. Ensure key facts (founding date, "
                "leadership, location) are prominently documented on About pages."
            )
        
        if type_counts.get("attribution", 0) > 1:
            recommendations.append(
                "Attribution errors found. Create clear product/service pages with "
                "Schema.org markup to prevent feature misattribution."
            )
        
        if type_counts.get("fabrication", 0) > 0:
            recommendations.append(
                "Fabricated claims detected. Monitor AI platforms for brand mentions "
                "and submit corrections to knowledge bases."
            )
        
        if not recommendations:
            recommendations.append(
                "Overall accuracy is acceptable. Continue monitoring for emerging "
                "hallucinations as AI models are updated."
            )
        
        return recommendations


# Singleton instance
_enhanced_hallucination_service: Optional[EnhancedHallucinationService] = None


def get_enhanced_hallucination_service() -> EnhancedHallucinationService:
    """Get singleton instance."""
    global _enhanced_hallucination_service
    if _enhanced_hallucination_service is None:
        _enhanced_hallucination_service = EnhancedHallucinationService()
    return _enhanced_hallucination_service
