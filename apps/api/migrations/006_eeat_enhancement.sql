-- Mentha Backend - E-E-A-T Enhancement
-- Authors, Content Clusters, and Aggregate Ratings for maximum AI trust

-- =============================================================================
-- AUTHORS: Expert entities for E-E-A-T (Schema.org Person)
-- Having named, credentialed authors increases AI trust in content
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    -- Credentials (critical for E-E-A-T)
    job_title TEXT,
    organization TEXT,
    credentials TEXT[], -- e.g., ['PhD', 'CPA', 'AWS Certified']
    years_experience INTEGER,
    
    -- Bio & Social Proof
    bio TEXT,
    image_url TEXT,
    
    -- Social/Authority Links (sameAs for Schema.org)
    linkedin_url TEXT,
    twitter_url TEXT,
    github_url TEXT,
    personal_website TEXT,
    
    -- Expertise Areas (used for content matching)
    expertise_topics TEXT[] DEFAULT '{}',
    
    -- Schema.org properties
    same_as TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_authors_slug ON public.authors(slug);
CREATE INDEX idx_authors_expertise ON public.authors USING GIN(expertise_topics);

-- =============================================================================
-- CONTENT CLUSTERS: Topical Authority Modeling
-- Groups related content to demonstrate deep expertise in specific areas
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.content_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cluster identity
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- The "pillar" content (main authoritative piece)
    pillar_url TEXT,
    pillar_title TEXT,
    
    -- Topic depth (how comprehensive is coverage)
    topic_depth_score REAL DEFAULT 0 CHECK (topic_depth_score BETWEEN 0 AND 1),
    
    -- Related to entity
    entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
    
    -- Primary author/expert for this topic
    primary_author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clusters_slug ON public.content_clusters(slug);
CREATE INDEX idx_clusters_entity ON public.content_clusters(entity_id);

-- =============================================================================
-- CLUSTER CONTENT: Individual pieces of content within a cluster
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.cluster_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    cluster_id UUID NOT NULL REFERENCES public.content_clusters(id) ON DELETE CASCADE,
    
    -- Content details
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN (
        'pillar', 'supporting', 'faq', 'case_study', 
        'tutorial', 'comparison', 'glossary'
    )) DEFAULT 'supporting',
    
    -- Author attribution
    author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
    
    -- Content metadata
    word_count INTEGER,
    last_updated DATE,
    
    -- Internal linking (to other cluster content)
    internal_links TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cluster_content_cluster ON public.cluster_content(cluster_id);
CREATE INDEX idx_cluster_content_author ON public.cluster_content(author_id);

-- =============================================================================
-- AGGREGATE RATINGS: Schema.org AggregateRating for reviews/testimonials
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.aggregate_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    
    -- Rating data (Schema.org AggregateRating)
    rating_value REAL NOT NULL CHECK (rating_value BETWEEN 0 AND 5),
    rating_count INTEGER NOT NULL DEFAULT 0,
    best_rating REAL DEFAULT 5,
    worst_rating REAL DEFAULT 1,
    
    -- Source of ratings
    source TEXT NOT NULL, -- 'google', 'trustpilot', 'g2', 'capterra', 'manual'
    source_url TEXT,
    
    -- Last verified
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One rating per entity per source
    UNIQUE(entity_id, source)
);

CREATE INDEX idx_ratings_entity ON public.aggregate_ratings(entity_id);

-- =============================================================================
-- REVIEWS: Individual review snippets for testimonials
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
    
    -- Review content
    author_name TEXT NOT NULL,
    author_title TEXT, -- e.g., "CEO at XYZ Corp"
    review_text TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    
    -- Date
    review_date DATE,
    
    -- Source verification
    source TEXT, -- 'google', 'trustpilot', 'manual'
    source_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    
    -- Display priority
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_entity ON public.reviews(entity_id);
CREATE INDEX idx_reviews_featured ON public.reviews(is_featured) WHERE is_featured = true;

-- =============================================================================
-- JSON-LD GENERATION: Author (Person) Schema
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_author_jsonld(author_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    author_record RECORD;
    result JSONB;
    same_as_links TEXT[];
BEGIN
    SELECT * INTO author_record FROM public.authors WHERE slug = author_slug;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Build sameAs array from social links
    same_as_links := '{}';
    IF author_record.linkedin_url IS NOT NULL THEN
        same_as_links := same_as_links || author_record.linkedin_url;
    END IF;
    IF author_record.twitter_url IS NOT NULL THEN
        same_as_links := same_as_links || author_record.twitter_url;
    END IF;
    IF author_record.github_url IS NOT NULL THEN
        same_as_links := same_as_links || author_record.github_url;
    END IF;
    IF author_record.personal_website IS NOT NULL THEN
        same_as_links := same_as_links || author_record.personal_website;
    END IF;
    
    result := jsonb_build_object(
        '@context', 'https://schema.org',
        '@type', 'Person',
        'name', author_record.name,
        'jobTitle', author_record.job_title,
        'worksFor', jsonb_build_object(
            '@type', 'Organization',
            'name', author_record.organization
        ),
        'description', author_record.bio
    );
    
    IF author_record.image_url IS NOT NULL THEN
        result := result || jsonb_build_object('image', author_record.image_url);
    END IF;
    
    IF array_length(same_as_links, 1) > 0 THEN
        result := result || jsonb_build_object('sameAs', same_as_links);
    END IF;
    
    IF array_length(author_record.credentials, 1) > 0 THEN
        result := result || jsonb_build_object('hasCredential', author_record.credentials);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- JSON-LD GENERATION: Aggregate Rating Schema
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_aggregate_rating_jsonld(entity_slug TEXT)
RETURNS JSONB AS $$
DECLARE
    entity_record RECORD;
    ratings_record RECORD;
    reviews_array JSONB := '[]'::jsonb;
    review_record RECORD;
    result JSONB;
BEGIN
    SELECT * INTO entity_record FROM public.entities WHERE slug = entity_slug;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Get aggregate rating (prioritize manual, then external sources)
    SELECT * INTO ratings_record 
    FROM public.aggregate_ratings 
    WHERE entity_id = entity_record.id
    ORDER BY 
        CASE source WHEN 'manual' THEN 1 WHEN 'google' THEN 2 ELSE 3 END
    LIMIT 1;
    
    -- Get featured reviews
    FOR review_record IN 
        SELECT * FROM public.reviews 
        WHERE entity_id = entity_record.id AND is_featured = true
        LIMIT 5
    LOOP
        reviews_array := reviews_array || jsonb_build_object(
            '@type', 'Review',
            'author', jsonb_build_object('@type', 'Person', 'name', review_record.author_name),
            'reviewBody', review_record.review_text,
            'reviewRating', jsonb_build_object(
                '@type', 'Rating',
                'ratingValue', review_record.rating
            )
        );
    END LOOP;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    result := jsonb_build_object(
        '@context', 'https://schema.org',
        '@type', entity_record.entity_type,
        'name', entity_record.name,
        'aggregateRating', jsonb_build_object(
            '@type', 'AggregateRating',
            'ratingValue', ratings_record.rating_value,
            'ratingCount', ratings_record.rating_count,
            'bestRating', ratings_record.best_rating,
            'worstRating', ratings_record.worst_rating
        )
    );
    
    -- Add reviews if any
    IF jsonb_array_length(reviews_array) > 0 THEN
        result := result || jsonb_build_object('review', reviews_array);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Update timestamps
-- =============================================================================
DROP TRIGGER IF EXISTS trigger_authors_updated ON public.authors;
CREATE TRIGGER trigger_authors_updated
    BEFORE UPDATE ON public.authors
    FOR EACH ROW
    EXECUTE FUNCTION update_content_timestamp();

DROP TRIGGER IF EXISTS trigger_clusters_updated ON public.content_clusters;
CREATE TRIGGER trigger_clusters_updated
    BEFORE UPDATE ON public.content_clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_content_timestamp();

DROP TRIGGER IF EXISTS trigger_ratings_updated ON public.aggregate_ratings;
CREATE TRIGGER trigger_ratings_updated
    BEFORE UPDATE ON public.aggregate_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_content_timestamp();
