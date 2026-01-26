import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const messages = {
    es: {
        welcome: '\n🌿 BIENVENIDO A LA CONFIGURACIÓN DE MENTHA CLI',
        exists: '⚠️  Ya existe un archivo .env. ¿Quieres sobreescribirlo? (s/n): ',
        openai_key: '🔑 Introduce tu OPENAI_API_KEY (obligatorio): ',
        supabase_url: '🗄️  Introduce tu SUPABASE_URL (obligatorio): ',
        supabase_key: '🗝️  Introduce tu SUPABASE_SERVICE_ROLE_KEY (obligatorio): ',
        perplexity_key: '🧠 Introduce tu PERPLEXITY_API_KEY (opcional, enter para saltar): ',
        gemini_key: '💎 Introduce tu GOOGLE_API_KEY (Gemini) (opcional, enter para saltar): ',
        anthropic_key: '🤖 Introduce tu ANTHROPIC_API_KEY (Claude) (opcional, enter para saltar): ',
        success: '\n✅ ¡Configuración completada! Archivo .env creado.',
        run: '👉 Ahora ejecuta: npm run cli'
    },
    en: {
        welcome: '\n🌿 WELCOME TO MENTHA CLI SETUP',
        exists: '⚠️  .env file already exists. Overwrite? (y/n): ',
        openai_key: '🔑 Enter your OPENAI_API_KEY (required): ',
        supabase_url: '🗄️  Enter your SUPABASE_URL (required): ',
        supabase_key: '🗝️  Enter your SUPABASE_SERVICE_ROLE_KEY (required): ',
        perplexity_key: '🧠 Enter your PERPLEXITY_API_KEY (optional, enter to skip): ',
        gemini_key: '💎 Enter your GOOGLE_API_KEY (Gemini) (optional, enter to skip): ',
        anthropic_key: '🤖 Enter your ANTHROPIC_API_KEY (Claude) (optional, enter to skip): ',
        success: '\n✅ Setup complete! .env file created.',
        run: '👉 Now run: npm run cli'
    }
};

let lang: 'es' | 'en' = 'es';

function prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

async function main() {
    console.clear();
    console.log('\n🌿 Mentha CLI Setup');
    console.log('------------------');

    const langChoice = await prompt('Language / Idioma [es/en] (default: es): ');
    lang = langChoice.toLowerCase().startsWith('e') ? 'en' : 'es';
    const t = messages[lang];

    console.log(t.welcome);

    if (fs.existsSync(envPath)) {
        const overwrite = await prompt(t.exists);
        if (overwrite.toLowerCase() !== 's' && overwrite.toLowerCase() !== 'y') {
            console.log(lang === 'es' ? 'Cancelado.' : 'Cancelled.');
            process.exit(0);
        }
    }

    const openaiKey = await prompt(t.openai_key);
    if (!openaiKey) {
        console.log('❌ OpenAI Key is required.');
        process.exit(1);
    }

    const supabaseUrl = await prompt(t.supabase_url);
    const supabaseKey = await prompt(t.supabase_key);
    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Supabase credentials are required.');
        process.exit(1);
    }

    const perplexityKey = await prompt(t.perplexity_key);
    const geminiKey = await prompt(t.gemini_key);
    const anthropicKey = await prompt(t.anthropic_key);

    const envContent = `
# Core
OPENAI_API_KEY=${openaiKey}
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${supabaseKey}

# Providers (Optional)
PERPLEXITY_API_KEY=${perplexityKey}
GOOGLE_API_KEY=${geminiKey}
ANTHROPIC_API_KEY=${anthropicKey}

# System
LOG_LEVEL=info
`.trim();

    fs.writeFileSync(envPath, envContent);
    console.log(t.success);
    console.log(t.run);
    console.log('\n');
    process.exit(0);
}

main().catch(console.error);
