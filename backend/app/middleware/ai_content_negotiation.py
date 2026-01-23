"""
AI Content Negotiation Middleware for GEO/AEO.

This middleware implements "Markdown Twins" - serving optimized content
based on the requesting client:

1. For AI Bots (GPTBot, ClaudeBot, etc.):
   - Serve Markdown or text/plain optimized for token efficiency
   - Include contextual chunking for RAG systems
   - Strip unnecessary HTML/CSS/JS noise

2. For Human Users:
   - Serve normal HTML with full styling and interactivity

3. For Accept: text/markdown requests:
   - Explicitly serve Markdown representation

Key Concepts:
- Content negotiation based on User-Agent and Accept headers
- Pre-generated Markdown stored in database/cache (not generated on-the-fly)
- Contextual chunking: Each section prefixed with article title for RAG context
- Token efficiency: ~10x reduction compared to HTML

Usage:
    from fastapi import FastAPI
    from app.middleware.ai_content_negotiation import AIContentNegotiationMiddleware
    
    app = FastAPI()
    app.add_middleware(AIContentNegotiationMiddleware)
"""

import logging
import re
from typing import Callable, Dict, List, Optional, Set
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


# Known AI bot User-Agent signatures
AI_BOT_SIGNATURES: Set[str] = {
    # OpenAI
    "gptbot",
    "chatgpt-user",
    "oai-searchbot",
    
    # Anthropic
    "claudebot",
    "anthropic-ai",
    
    # Google
    "google-extended",
    "googlebot",  # Consider if you want Google to get markdown
    
    # Perplexity
    "perplexitybot",
    
    # Common Crawl (used for training)
    "ccbot",
    
    # Cohere
    "cohere-ai",
    
    # Other AI services
    "diffbot",
    "bytespider",
    "amazonbot",
    "facebookbot",  # Meta AI
    
    # Generic AI crawlers
    "ai2bot",
    "gptbot",
}

# Content types that indicate AI/machine consumption
MACHINE_ACCEPT_TYPES: Set[str] = {
    "text/markdown",
    "text/plain",
    "application/json",
}


def is_ai_bot(user_agent: str) -> bool:
    """
    Detect if the request is from an AI bot.
    
    Args:
        user_agent: The User-Agent header value
    
    Returns:
        True if the request appears to be from an AI crawler
    """
    if not user_agent:
        return False
    
    user_agent_lower = user_agent.lower()
    
    for signature in AI_BOT_SIGNATURES:
        if signature in user_agent_lower:
            return True
    
    return False


def prefers_markdown(accept_header: str) -> bool:
    """
    Check if the client prefers Markdown content.
    
    Args:
        accept_header: The Accept header value
    
    Returns:
        True if text/markdown is preferred
    """
    if not accept_header:
        return False
    
    # Simple check - could be more sophisticated with q-values
    return "text/markdown" in accept_header.lower()


def convert_html_to_contextual_markdown(
    html_content: str,
    article_title: str,
    article_url: str
) -> str:
    """
    Convert HTML to Markdown with contextual chunking.
    
    This is a fallback for content without pre-generated Markdown.
    In production, Markdown should be pre-generated on save.
    
    Contextual Chunking Strategy:
    - Prefix each H2 with article title for RAG context retention
    - Include article URL in header for citation
    - Strip non-essential HTML
    
    Args:
        html_content: The HTML content to convert
        article_title: Title of the article
        article_url: URL of the article
    
    Returns:
        Contextual Markdown string
    """
    try:
        import markdownify
        
        # Convert HTML to Markdown
        md_content = markdownify.markdownify(
            html_content,
            heading_style="ATX",
            strip=['script', 'style', 'nav', 'footer', 'aside']
        )
        
        # Contextual chunking: Prefix H2s with article context
        # Pattern: ## Section Title -> ## Article Title - Section Title
        def contextualize_heading(match):
            heading = match.group(1).strip()
            return f"## {article_title} - {heading}"
        
        md_content = re.sub(
            r'^## (.+)$',
            contextualize_heading,
            md_content,
            flags=re.MULTILINE
        )
        
        # Add header with metadata
        header = f"""# {article_title}

> Source: {article_url}
> This content is optimized for AI consumption.

---

"""
        
        return header + md_content
        
    except ImportError:
        logger.warning("markdownify not installed, returning plain text fallback")
        # Basic HTML stripping fallback
        from html.parser import HTMLParser
        
        class HTMLStripper(HTMLParser):
            def __init__(self):
                super().__init__()
                self.text = []
            
            def handle_data(self, data):
                self.text.append(data)
            
            def get_text(self):
                return ' '.join(self.text)
        
        stripper = HTMLStripper()
        stripper.feed(html_content)
        return f"# {article_title}\n\n{stripper.get_text()}"


class AIContentNegotiationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to serve AI-optimized content based on client detection.
    
    Workflow:
    1. Check User-Agent for AI bot signatures
    2. Check Accept header for text/markdown preference
    3. If AI bot or markdown preferred:
       - Look for pre-generated Markdown in response context
       - Fall back to HTML-to-Markdown conversion
    4. Otherwise: Pass through normal response
    
    Configuration:
        enabled_paths: List of path prefixes to apply middleware
        disabled_paths: List of paths to skip (API endpoints, etc.)
    """
    
    def __init__(
        self,
        app,
        enabled_paths: Optional[List[str]] = None,
        disabled_paths: Optional[List[str]] = None,
    ):
        """
        Initialize middleware.
        
        Args:
            app: The ASGI application
            enabled_paths: Paths to enable middleware (default: all)
            disabled_paths: Paths to skip middleware
        """
        super().__init__(app)
        self.enabled_paths = enabled_paths or ["/"]
        self.disabled_paths = disabled_paths or [
            "/api/",
            "/auth/",
            "/admin/",
            "/_next/",
            "/static/",
        ]
    
    def _should_process(self, path: str) -> bool:
        """Check if the path should be processed by middleware."""
        # Skip disabled paths
        for disabled in self.disabled_paths:
            if path.startswith(disabled):
                return False
        
        # Check enabled paths
        for enabled in self.enabled_paths:
            if path.startswith(enabled):
                return True
        
        return False
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint
    ) -> Response:
        """
        Process request and potentially transform response for AI bots.
        """
        path = request.url.path
        
        # Skip middleware for certain paths
        if not self._should_process(path):
            return await call_next(request)
        
        # Check if this is an AI bot or markdown request
        user_agent = request.headers.get("user-agent", "")
        accept_header = request.headers.get("accept", "")
        
        is_bot = is_ai_bot(user_agent)
        wants_markdown = prefers_markdown(accept_header)
        
        # If not AI-related, pass through
        if not is_bot and not wants_markdown:
            return await call_next(request)
        
        # Log AI bot access for analytics
        if is_bot:
            logger.info(f"AI Bot detected: {user_agent[:100]} accessing {path}")
        
        # Get the original response
        response = await call_next(request)
        
        # Only transform HTML responses
        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type:
            return response
        
        # Check if we have pre-generated Markdown in response state
        # This would be set by the view/endpoint
        markdown_content = getattr(request.state, "markdown_content", None)
        article_title = getattr(request.state, "article_title", "Content")
        article_url = str(request.url)
        
        if markdown_content:
            # Serve pre-generated Markdown
            return Response(
                content=markdown_content,
                media_type="text/markdown",
                headers={
                    "X-Content-Type-Options": "nosniff",
                    "X-AI-Optimized": "true",
                    "Cache-Control": "public, max-age=3600"
                }
            )
        
        # Fallback: Convert HTML to Markdown on-the-fly
        # Note: This is less efficient than pre-generation
        try:
            # Read the response body
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            html_content = body.decode("utf-8", errors="ignore")
            
            # Convert to contextual Markdown
            md_content = convert_html_to_contextual_markdown(
                html_content,
                article_title,
                article_url
            )
            
            return Response(
                content=md_content,
                media_type="text/markdown",
                headers={
                    "X-Content-Type-Options": "nosniff",
                    "X-AI-Optimized": "true",
                    "X-Conversion": "on-the-fly",
                    "Cache-Control": "public, max-age=3600"
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to convert HTML to Markdown: {e}")
            return response


# Utility function for endpoints to set Markdown content
def set_markdown_content(
    request: Request,
    markdown: str,
    title: str
) -> None:
    """
    Set pre-generated Markdown content for the middleware.
    
    Call this from your endpoint before returning the HTML response.
    The middleware will serve the Markdown to AI bots.
    
    Args:
        request: The FastAPI Request object
        markdown: Pre-generated Markdown content
        title: Article/page title
    
    Example:
        @app.get("/article/{slug}")
        async def get_article(request: Request, slug: str):
            article = await get_article_by_slug(slug)
            
            # Set Markdown for AI bots
            set_markdown_content(
                request,
                article.markdown_content,
                article.title
            )
            
            return templates.TemplateResponse("article.html", {...})
    """
    if not hasattr(request, "state"):
        request.state = type("State", (), {})()
    
    request.state.markdown_content = markdown
    request.state.article_title = title
