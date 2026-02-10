import { createSupabaseAdmin } from "../../api/src/infrastructure/database";

export const readLlmsTxt = async (uri: URL) => {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase.rpc('generate_llms_txt');
    return {
        contents: [{
            uri: uri.href,
            mimeType: 'text/plain',
            text: data ?? '',
        }],
    };
};

export const readEntity = async (uri: URL) => {
    const supabase = createSupabaseAdmin();
    const slug = uri.pathname.replace('/entity/', '');
    const { data } = await supabase.rpc('generate_entity_jsonld', { entity_slug: slug });
    return {
        contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
        }],
    };
};
