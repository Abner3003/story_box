"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoragePaths = void 0;
exports.getSupabaseClient = getSupabaseClient;
const supabase_js_1 = require("@supabase/supabase-js");
// ─────────────────────────────────────────────
// Client singleton — importa em qualquer app
// ─────────────────────────────────────────────
let _client = null;
function getSupabaseClient() {
    if (_client)
        return _client;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role — só no backend
    if (!url || !key) {
        throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
    }
    _client = (0, supabase_js_1.createClient)(url, key, {
        auth: { persistSession: false }
    });
    return _client;
}
// ─────────────────────────────────────────────
// Helper: Storage — paths padronizados
// ─────────────────────────────────────────────
exports.StoragePaths = {
    childPhoto: (childId, month) => `children/${childId}/photos/${month}.jpg`,
    momentPhoto: (childId, period) => `children/${childId}/moments/${period}.jpg`,
    familyPhoto: (subscriberId) => `subscribers/${subscriberId}/family.jpg`,
    stylePreview: (childId, styleId) => `children/${childId}/style-previews/${styleId}.png`,
    bookPdf: (bookId) => `books/${bookId}/book.pdf`,
    bookCover: (bookId) => `books/${bookId}/cover.png`,
    bookPage: (bookId, n) => `books/${bookId}/pages/page_${String(n).padStart(2, '0')}.png`,
    consentPage: (subscriberId) => `consent/${subscriberId}/terms.html`,
};
//# sourceMappingURL=index.js.map