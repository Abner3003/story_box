"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoragePaths = void 0;
exports.getSupabaseClient = getSupabaseClient;
var supabase_js_1 = require("@supabase/supabase-js");
// ─────────────────────────────────────────────
// Client singleton — importa em qualquer app
// ─────────────────────────────────────────────
var _client = null;
function getSupabaseClient() {
    if (_client)
        return _client;
    var url = process.env.SUPABASE_URL;
    var key = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role — só no backend
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
    childPhoto: function (childId, month) { return "children/".concat(childId, "/photos/").concat(month, ".jpg"); },
    bookPdf: function (bookId) { return "books/".concat(bookId, "/book.pdf"); },
    bookCover: function (bookId) { return "books/".concat(bookId, "/cover.png"); },
    bookPage: function (bookId, n) { return "books/".concat(bookId, "/pages/page_").concat(String(n).padStart(2, '0'), ".png"); },
    consentPage: function (subscriberId) { return "consent/".concat(subscriberId, "/terms.html"); },
};
