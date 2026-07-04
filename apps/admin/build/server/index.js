import { jsx, jsxs } from "react/jsx-runtime";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useNavigation, Link, Form } from "@remix-run/react";
import { renderToReadableStream } from "react-dom/server";
import { json, redirect } from "@remix-run/cloudflare";
async function handleRequest(request, statusCode, headers, remixContext, _loadContext) {
  const body = await renderToReadableStream(
    /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url }),
    {
      signal: request.signal,
      onError(error) {
        console.error(error);
      }
    }
  );
  headers.set("Content-Type", "text/html");
  return new Response(body, {
    headers,
    status: statusCode
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const stylesheet = "/assets/global-CEwjau2G.css";
const links = () => [{ rel: "stylesheet", href: stylesheet }];
const meta = () => [
  { title: "StoryBox Admin" },
  {
    name: "description",
    content: "Portal administrativo para revisar livros gerados e aprovar entregas."
  }
];
function App() {
  return /* @__PURE__ */ jsxs("html", { lang: "pt-BR", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App,
  links,
  meta
}, Symbol.toStringTag, { value: "Module" }));
function getEnvValue(context) {
  var _a;
  const runtimeEnv = ((_a = context == null ? void 0 : context.cloudflare) == null ? void 0 : _a.env) ?? {};
  return {
    apiBaseUrl: runtimeEnv.API_PUBLIC_URL ?? runtimeEnv.PUBLIC_API_URL ?? process.env.API_PUBLIC_URL ?? process.env.PUBLIC_API_URL ?? "http://localhost:3001",
    adminApiKey: runtimeEnv.ADMIN_API_KEY ?? process.env.ADMIN_API_KEY ?? "",
    reviewerName: runtimeEnv.ADMIN_REVIEWER_NAME ?? process.env.ADMIN_REVIEWER_NAME ?? "Admin Portal"
  };
}
async function apiFetch(path, init = {}, context) {
  const { apiBaseUrl, adminApiKey } = getEnvValue(context);
  if (!adminApiKey) {
    throw new Error("ADMIN_API_KEY is required for the admin portal");
  }
  const headers = new Headers(init.headers);
  headers.set("x-admin-key", adminApiKey);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(new URL(path, apiBaseUrl).toString(), {
    ...init,
    headers
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Response(message || "Request failed", { status: response.status });
  }
  return response.json();
}
function getReviewerName(context) {
  return getEnvValue(context).reviewerName;
}
async function listBooks(page, limit, context) {
  return apiFetch(`/admin/books?page=${page}&limit=${limit}`, {}, context);
}
async function getBook(bookId, context) {
  return apiFetch(`/admin/books/${bookId}`, {}, context);
}
async function getPdfUrl(bookId, context) {
  const payload = await apiFetch(`/admin/books/${bookId}/pdf-url`, {}, context);
  return payload.url;
}
async function reviewBook(bookId, input, context) {
  return apiFetch(`/admin/books/${bookId}/review`, {
    method: "POST",
    body: JSON.stringify(input)
  }, context);
}
function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
function formatStatus(value) {
  return value.replaceAll("_", " ");
}
async function loader$1({ context, params }) {
  const bookId = params.bookId;
  if (!bookId) {
    throw new Response("Book id is required", { status: 400 });
  }
  const book = await getBook(bookId, context);
  const pdfUrl = book.pdfUrl ?? await getPdfUrl(bookId, context);
  return json({
    book: {
      ...book,
      pdfUrl
    },
    reviewerName: getReviewerName(context)
  });
}
async function action$1({ context, params, request }) {
  const bookId = params.bookId;
  if (!bookId) {
    throw new Response("Book id is required", { status: 400 });
  }
  const formData = await request.formData();
  const action2 = String(formData.get("action") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const reviewedBy = String(formData.get("reviewedBy") ?? getReviewerName(context));
  if (action2 !== "approve" && action2 !== "reject") {
    return json({ error: "action inválida" }, { status: 400 });
  }
  await reviewBook(bookId, { action: action2, reviewed_by: reviewedBy, notes: notes || void 0 }, context);
  return redirect(`/books/${bookId}`);
}
function BookReviewRoute() {
  var _a;
  const { book, reviewerName } = useLoaderData();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";
  const pages = ((_a = book.storyJson) == null ? void 0 : _a.pages) ?? [];
  return /* @__PURE__ */ jsxs("main", { className: "shell", children: [
    /* @__PURE__ */ jsx("section", { className: "hero", children: /* @__PURE__ */ jsxs("div", { className: "toolbar", children: [
      /* @__PURE__ */ jsxs("div", { className: "stack", children: [
        /* @__PURE__ */ jsx("div", { className: "eyebrow", children: "Revisão de Livro" }),
        /* @__PURE__ */ jsx("h1", { className: "title", children: book.title ?? "Livro sem título" }),
        /* @__PURE__ */ jsxs("p", { className: "subtitle", children: [
          book.childName ?? "Cliente não identificado",
          " · ",
          /* @__PURE__ */ jsx("span", { className: `status ${book.status}`, children: formatStatus(book.status) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "actions", children: [
        /* @__PURE__ */ jsx(Link, { className: "button secondary", to: "/", children: "Voltar para a tabela" }),
        book.pdfUrl ? /* @__PURE__ */ jsx("a", { className: "button secondary", href: book.pdfUrl, target: "_blank", rel: "noreferrer", children: "Download PDF" }) : null
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid two", children: [
      /* @__PURE__ */ jsxs("section", { className: "panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Páginas" }),
        /* @__PURE__ */ jsx("div", { className: "pages", children: pages.length ? pages.map((page) => /* @__PURE__ */ jsxs("article", { className: "page-card", children: [
          /* @__PURE__ */ jsxs("div", { className: "page-meta", children: [
            /* @__PURE__ */ jsxs("strong", { children: [
              "Página ",
              page.page_number
            ] }),
            /* @__PURE__ */ jsx("span", { className: "muted", children: page.image_storage_path ? "Imagem gerada" : "Sem imagem" })
          ] }),
          /* @__PURE__ */ jsx("p", { children: page.text }),
          /* @__PURE__ */ jsx("p", { className: "muted", children: page.illustration_prompt })
        ] }, page.page_number)) : /* @__PURE__ */ jsx("p", { className: "muted", children: "Este livro ainda não tem páginas estruturadas." }) })
      ] }),
      /* @__PURE__ */ jsxs("aside", { className: "panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Ação de curadoria" }),
        /* @__PURE__ */ jsxs("p", { className: "muted", children: [
          "Reviewer atual: ",
          reviewerName
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "stack", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Status atual" }),
            /* @__PURE__ */ jsx("p", { children: formatStatus(book.status) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Criado em" }),
            /* @__PURE__ */ jsx("p", { children: formatDate(book.createdAt) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Atualizado em" }),
            /* @__PURE__ */ jsx("p", { children: formatDate(book.updatedAt) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "separator" }),
        /* @__PURE__ */ jsxs(Form, { method: "post", className: "stack", children: [
          /* @__PURE__ */ jsx("input", { type: "hidden", name: "reviewedBy", value: reviewerName }),
          /* @__PURE__ */ jsxs("label", { className: "stack", children: [
            /* @__PURE__ */ jsx("span", { children: "Notas de revisão" }),
            /* @__PURE__ */ jsx("textarea", { className: "textarea", name: "notes", placeholder: "Escreva observações para o time, se houver." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsx("button", { className: "button", type: "submit", name: "action", value: "approve", disabled: isBusy, children: "Aprovar" }),
            /* @__PURE__ */ jsx("button", { className: "button danger", type: "submit", name: "action", value: "reject", disabled: isBusy, children: "Rejeitar" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "separator" }),
        /* @__PURE__ */ jsxs("div", { className: "stack", children: [
          /* @__PURE__ */ jsx("strong", { children: "Metadados" }),
          /* @__PURE__ */ jsxs("span", { className: "muted", children: [
            "Collection: ",
            book.collectionId
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "muted", children: [
            "Child: ",
            book.childId
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "muted", children: [
            "Revisado por: ",
            book.reviewedBy ?? "—"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "muted", children: [
            "Revisado em: ",
            formatDate(book.reviewedAt)
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "muted", children: [
            "Notas: ",
            book.reviewNotes ?? "—"
          ] })
        ] })
      ] })
    ] })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: BookReviewRoute,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const PAGE_SIZE = 10;
async function loader({ context, request }) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const books = await listBooks(page, PAGE_SIZE + 1, context);
  const visibleBooks = books.slice(0, PAGE_SIZE);
  return json({
    books: visibleBooks,
    page,
    reviewerName: getReviewerName(context),
    hasPrev: page > 1,
    hasNext: books.length > PAGE_SIZE
  });
}
async function action({ context, request }) {
  const formData = await request.formData();
  const bookId = String(formData.get("bookId") ?? "");
  const action2 = String(formData.get("action") ?? "");
  const reviewedBy = String(formData.get("reviewedBy") ?? getReviewerName(context));
  const notes = String(formData.get("notes") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "/");
  if (!bookId || !action2) {
    return json({ error: "bookId e action são obrigatórios" }, { status: 400 });
  }
  if (action2 !== "approve" && action2 !== "reject") {
    return json({ error: "action inválida" }, { status: 400 });
  }
  await reviewBook(bookId, { action: action2, reviewed_by: reviewedBy, notes: notes || void 0 }, context);
  return redirect(redirectTo);
}
function AdminDashboard() {
  const { books, page, hasPrev, hasNext, reviewerName } = useLoaderData();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";
  return /* @__PURE__ */ jsxs("main", { className: "shell", children: [
    /* @__PURE__ */ jsxs("section", { className: "hero", children: [
      /* @__PURE__ */ jsx("div", { className: "eyebrow", children: "StoryBox Admin" }),
      /* @__PURE__ */ jsx("h1", { className: "title", children: "Livros gerados para revisão" }),
      /* @__PURE__ */ jsxs("p", { className: "subtitle", children: [
        "Tabela paginada com nome do cliente, status do livro e ações de aprovar, abrir página de revisão e baixar o PDF. O reviewer atual é ",
        /* @__PURE__ */ jsx("strong", { children: reviewerName }),
        "."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "toolbar", children: [
        /* @__PURE__ */ jsxs("span", { className: "pill", children: [
          "Página ",
          /* @__PURE__ */ jsx("strong", { children: page }),
          isBusy ? " atualizando..." : ""
        ] }),
        /* @__PURE__ */ jsxs("nav", { "aria-label": "Paginação", children: [
          /* @__PURE__ */ jsx(Link, { className: `button secondary ${!hasPrev ? "disabled" : ""}`, to: hasPrev ? `/?page=${page - 1}` : "#", children: "Anterior" }),
          /* @__PURE__ */ jsx(Link, { className: `button secondary ${!hasNext ? "disabled" : ""}`, to: hasNext ? `/?page=${page + 1}` : "#", children: "Próxima" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "card table-wrap", children: /* @__PURE__ */ jsxs("table", { children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "Cliente" }),
        /* @__PURE__ */ jsx("th", { children: "Livro" }),
        /* @__PURE__ */ jsx("th", { children: "Status" }),
        /* @__PURE__ */ jsx("th", { children: "Atualizado" }),
        /* @__PURE__ */ jsx("th", { children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        books.map((book) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "stack", children: [
            /* @__PURE__ */ jsx("strong", { children: book.childName ?? "Sem nome" }),
            /* @__PURE__ */ jsxs("span", { className: "muted", children: [
              "Livro #",
              book.id.slice(0, 8)
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "stack", children: [
            /* @__PURE__ */ jsx("strong", { children: book.title ?? "Título não definido" }),
            /* @__PURE__ */ jsx("span", { className: "muted", children: book.referenceMonth ?? "Coleção sem referência" })
          ] }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: `status ${book.status}`, children: formatStatus(book.status) }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "stack", children: [
            /* @__PURE__ */ jsx("span", { children: formatDate(book.updatedAt) }),
            /* @__PURE__ */ jsx("span", { className: "muted", children: formatDate(book.createdAt) })
          ] }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsxs(Form, { method: "post", children: [
              /* @__PURE__ */ jsx("input", { type: "hidden", name: "bookId", value: book.id }),
              /* @__PURE__ */ jsx("input", { type: "hidden", name: "action", value: "approve" }),
              /* @__PURE__ */ jsx("input", { type: "hidden", name: "reviewedBy", value: reviewerName }),
              /* @__PURE__ */ jsx("input", { type: "hidden", name: "redirectTo", value: `/?page=${page}` }),
              /* @__PURE__ */ jsx("button", { className: "button", type: "submit", children: "Aprovar" })
            ] }),
            /* @__PURE__ */ jsx(Link, { className: "button secondary", to: `/books/${book.id}`, children: "Revisar página" }),
            book.pdfUrl ? /* @__PURE__ */ jsx("a", { className: "button secondary", href: book.pdfUrl, target: "_blank", rel: "noreferrer", children: "Download PDF" }) : /* @__PURE__ */ jsx("span", { className: "pill", children: "PDF indisponível" })
          ] }) })
        ] }, book.id)),
        !books.length ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, children: /* @__PURE__ */ jsx("p", { className: "muted", children: "Nenhum livro encontrado para esta página." }) }) }) : null
      ] })
    ] }) })
  ] });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: AdminDashboard,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BIgxpMSo.js", "imports": ["/assets/components-CAlMRUE5.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-4Kg8ZYyD.js", "imports": ["/assets/components-CAlMRUE5.js"], "css": [] }, "routes/books.$bookId": { "id": "routes/books.$bookId", "parentId": "root", "path": "books/:bookId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/books._bookId-BrmfdoBG.js", "imports": ["/assets/components-CAlMRUE5.js", "/assets/format-CN-a4j3h.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-CNSsPgBL.js", "imports": ["/assets/components-CAlMRUE5.js", "/assets/format-CN-a4j3h.js"], "css": [] } }, "url": "/assets/manifest-bc3c3cd5.js", "version": "bc3c3cd5" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": false, "v3_relativeSplatPath": false, "v3_throwAbortReason": false, "v3_routeConfig": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/books.$bookId": {
    id: "routes/books.$bookId",
    parentId: "root",
    path: "books/:bookId",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route2
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
