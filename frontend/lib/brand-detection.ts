/**
 * Enhanced brand detection utilities for accurate brand mention matching
 * Imported from firegeo for professional AEO/GEO detection
 */

import { getBrandDetectionConfig } from './brand-detection-config';

// ============ Types ============

export interface BrandDetectionResult {
    mentioned: boolean;
    matches: {
        text: string;
        index: number;
        pattern: string;
        confidence: number;
    }[];
    confidence: number;
}

export interface BrandDetectionOptions {
    caseSensitive?: boolean;
    wholeWordOnly?: boolean;
    includeVariations?: boolean;
    customVariations?: string[];
    excludeNegativeContext?: boolean;
    includeUrlDetection?: boolean;
    brandUrls?: string[];
}

// ============ Core Functions ============

/**
 * Normalizes a brand name for consistent matching
 */
export function normalizeBrandName(name: string): string {
    const config = getBrandDetectionConfig();
    const suffixPattern = new RegExp(`\\b(${config.ignoredSuffixes.join('|')})\\b\\.?$`, 'gi');

    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/'s\b/g, '')
        .replace(suffixPattern, '')
        .trim();
}

/**
 * Generates variations of a brand name for matching
 */
export function generateBrandVariations(brandName: string): string[] {
    const normalized = normalizeBrandName(brandName);
    const variations = new Set<string>();

    variations.add(brandName.toLowerCase());
    variations.add(normalized);
    variations.add(normalized.replace(/\s+/g, ''));
    variations.add(normalized.replace(/\s+/g, '-'));
    variations.add(normalized.replace(/\s+/g, '_'));
    variations.add(normalized.replace(/\s+/g, '.'));

    // Camel case variations
    const words = normalized.split(' ');
    if (words.length > 1) {
        variations.add(words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''));
        variations.add(words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''));
        variations.add(words.join('').toLowerCase());
    }

    // Handle special characters
    if (brandName.includes('&')) {
        variations.add(normalized.replace(/&/g, 'and'));
        variations.add(normalized.replace(/&/g, 'n'));
    }

    if (brandName.includes('+')) {
        variations.add(normalized.replace(/\+/g, 'plus'));
        variations.add(normalized.replace(/\+/g, 'and'));
    }

    // Common TLDs
    if (!brandName.includes('.') && brandName.length > 2) {
        ['com', 'io', 'ai', 'dev', 'co', 'app'].forEach(tld => {
            variations.add(`${normalized.replace(/\s+/g, '')}.${tld}`);
        });
    }

    return Array.from(variations);
}

/**
 * Creates regex patterns for brand detection with word boundaries
 */
export function createBrandRegexPatterns(brandName: string, variations?: string[]): RegExp[] {
    const allVariations = new Set([
        ...generateBrandVariations(brandName),
        ...(variations || [])
    ]);

    const patterns: RegExp[] = [];

    allVariations.forEach(variation => {
        const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        patterns.push(new RegExp(`\\b${escaped}\\b`, 'i'));
        patterns.push(new RegExp(`\\b${escaped}(?:-\\w+)*\\b`, 'i'));
        patterns.push(new RegExp(`\\b${escaped}'s?\\b`, 'i'));
    });

    return patterns;
}

/**
 * Detects if a brand is mentioned in text using multiple strategies
 */
export function detectBrandMention(
    text: string,
    brandName: string,
    options: BrandDetectionOptions = {}
): BrandDetectionResult {
    const {
        caseSensitive = false,
        wholeWordOnly = true,
        includeVariations = true,
        customVariations = [],
        excludeNegativeContext = false
    } = options;

    const searchText = caseSensitive ? text : text.toLowerCase();
    const matches: BrandDetectionResult['matches'] = [];

    const patterns = wholeWordOnly
        ? createBrandRegexPatterns(brandName, customVariations)
        : [new RegExp(brandName, caseSensitive ? 'g' : 'gi')];

    patterns.forEach(pattern => {
        const regex = new RegExp(pattern.source, pattern.flags + 'g');
        let match;

        while ((match = regex.exec(searchText)) !== null) {
            const matchText = match[0];
            const matchIndex = match.index;

            if (excludeNegativeContext) {
                const contextStart = Math.max(0, matchIndex - 50);
                const contextEnd = Math.min(searchText.length, matchIndex + matchText.length + 50);
                const context = searchText.substring(contextStart, contextEnd);

                const negativePatterns = [
                    /\bnot\s+(?:recommended|good|worth|reliable)/i,
                    /\bavoid\b/i,
                    /\bworse\s+than\b/i,
                    /\bdon't\s+(?:use|recommend|like)\b/i
                ];

                if (negativePatterns.some(np => np.test(context))) continue;
            }

            // Calculate confidence
            let confidence = 0.5;
            if (matchText.toLowerCase() === brandName.toLowerCase()) {
                confidence = 1.0;
            } else if (matchText.toLowerCase().startsWith(brandName.toLowerCase() + ' ')) {
                confidence = 0.9;
            } else if (includeVariations) {
                confidence = 0.7;
            }

            matches.push({
                text: matchText,
                index: matchIndex,
                pattern: pattern.source,
                confidence
            });
        }
    });

    // Remove duplicates
    const uniqueMatches = matches.reduce((acc, match) => {
        const existing = acc.find(m => m.index === match.index);
        if (!existing || match.confidence > existing.confidence) {
            return [...acc.filter(m => m.index !== match.index), match];
        }
        return acc;
    }, [] as typeof matches);

    const overallConfidence = uniqueMatches.length > 0
        ? Math.max(...uniqueMatches.map(m => m.confidence))
        : 0;

    return {
        mentioned: uniqueMatches.length > 0,
        matches: uniqueMatches.sort((a, b) => b.confidence - a.confidence),
        confidence: overallConfidence
    };
}

/**
 * Detects multiple brands in text
 */
export function detectMultipleBrands(
    text: string,
    brands: string[],
    options: BrandDetectionOptions = {}
): Map<string, BrandDetectionResult> {
    const results = new Map<string, BrandDetectionResult>();
    brands.forEach(brand => {
        results.set(brand, detectBrandMention(text, brand, options));
    });
    return results;
}

/**
 * Extracts context around brand mentions
 */
export function extractMatchContext(
    text: string,
    match: BrandDetectionResult['matches'][0],
    contextWords: number = 10
): string {
    const words = text.split(/\s+/);
    const matchStart = text.substring(0, match.index).split(/\s+/).length - 1;
    const matchEnd = matchStart + match.text.split(/\s+/).length;

    const contextStart = Math.max(0, matchStart - contextWords);
    const contextEnd = Math.min(words.length, matchEnd + contextWords);

    const contextArr = words.slice(contextStart, contextEnd);

    const matchWordIndices = Array.from(
        { length: matchEnd - matchStart },
        (_, i) => matchStart - contextStart + i
    );

    const highlighted = contextArr.map((word, idx) => {
        if (matchWordIndices.includes(idx)) {
            return `**${word}**`;
        }
        return word;
    }).join(' ');

    const prefix = contextStart > 0 ? '...' : '';
    const suffix = contextEnd < words.length ? '...' : '';

    return `${prefix}${highlighted}${suffix}`;
}
