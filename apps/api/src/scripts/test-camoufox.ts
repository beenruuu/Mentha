/**
 * Test visible Camoufox capture against stepwise.es
 * Runs headful so you can see the Firefox window.
 */
import { runCamoufoxUiCapture } from '../core/ui-capture/camoufox-provider';

async function main() {
    console.log('🚀 Starting Camoufox headful capture...');
    console.log('   Firefox window should open shortly.');
    console.log('   Target: Perplexity AI -> ask about stepwise.es');
    console.log('');

    const result = await runCamoufoxUiCapture({
        provider: 'perplexity',
        prompt: 'What is stepwise.es? Tell me about this company, what they do, their main competitors, and what people search for related to them.',
    });

    console.log('');
    console.log('=== CAPTURE RESULT ===');
    console.log('Status:', result.status);
    console.log('Provider:', result.provider);
    console.log('URL:', result.url);
    console.log('Title:', result.title);
    console.log('Latency:', result.latencyMs, 'ms');
    console.log('');
    console.log('=== RESPONSE (first 2000 chars) ===');
    console.log(result.responseMarkdown?.slice(0, 2000));
    console.log('');
    console.log('=== SOURCES ===');
    if (result.sources && result.sources.length > 0) {
        for (const source of result.sources) {
            console.log(`  - ${source.title} (${source.url})`);
        }
    } else {
        console.log('  (none found)');
    }
    console.log('');
    console.log('=== FAILURE REASON ===');
    console.log(result.failureReason || 'None');
}

main().catch((err) => {
    console.error('❌ Test failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
});
