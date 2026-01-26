-- Mentha Backend - Database Triggers for AEO
-- Automatically notify search engines when content changes

-- =============================================================================
-- FUNCTION: Notify on entity changes (for IndexNow push)
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_entity_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Emit a PostgreSQL notification that can be captured by the app
    -- The app will then call IndexNow APIs
    PERFORM pg_notify(
        'entity_changed',
        json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'id', COALESCE(NEW.id, OLD.id),
            'slug', COALESCE(NEW.slug, OLD.slug),
            'timestamp', NOW()
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS: Fire on entity/claim/faq changes
-- =============================================================================

-- Trigger for entities table
DROP TRIGGER IF EXISTS trigger_entity_changed ON public.entities;
CREATE TRIGGER trigger_entity_changed
    AFTER INSERT OR UPDATE OR DELETE ON public.entities
    FOR EACH ROW
    EXECUTE FUNCTION notify_entity_change();

-- Trigger for claims table
DROP TRIGGER IF EXISTS trigger_claim_changed ON public.claims;
CREATE TRIGGER trigger_claim_changed
    AFTER INSERT OR UPDATE OR DELETE ON public.claims
    FOR EACH ROW
    EXECUTE FUNCTION notify_entity_change();

-- Trigger for FAQs table
DROP TRIGGER IF EXISTS trigger_faq_changed ON public.faq_vectors;
CREATE TRIGGER trigger_faq_changed
    AFTER INSERT OR UPDATE OR DELETE ON public.faq_vectors
    FOR EACH ROW
    EXECUTE FUNCTION notify_entity_change();

-- =============================================================================
-- FUNCTION: Track content freshness
-- =============================================================================
CREATE OR REPLACE FUNCTION update_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamps
DROP TRIGGER IF EXISTS trigger_entities_updated ON public.entities;
CREATE TRIGGER trigger_entities_updated
    BEFORE UPDATE ON public.entities
    FOR EACH ROW
    EXECUTE FUNCTION update_content_timestamp();

DROP TRIGGER IF EXISTS trigger_claims_updated ON public.claims;
CREATE TRIGGER trigger_claims_updated
    BEFORE UPDATE ON public.claims
    FOR EACH ROW
    EXECUTE FUNCTION update_content_timestamp();

DROP TRIGGER IF EXISTS trigger_faqs_updated ON public.faq_vectors;
CREATE TRIGGER trigger_faqs_updated
    BEFORE UPDATE ON public.faq_vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_content_timestamp();
