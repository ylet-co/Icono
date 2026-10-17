/**
 * OpenAPI 3.1 description of the Icono HTTP API.
 * Served from `GET /api/v1/openapi.json`.
 */

const iconQueryParams = [
  { name: 'color', in: 'query', schema: { type: 'string', example: '#FF5C1A' }, description: 'Ink colour (hex, rgb() or a CSS colour name).' },
  { name: 'accent', in: 'query', schema: { type: 'string' }, description: 'Secondary colour used by the duotone and contrast styles.' },
  { name: 'surface', in: 'query', schema: { type: 'string' }, description: 'Background colour, only painted when background=true.' },
  { name: 'background', in: 'query', schema: { type: 'boolean', default: false }, description: 'Paint a rounded background plate behind the glyph.' },
  { name: 'radius', in: 'query', schema: { type: 'number', default: 6 }, description: 'Corner radius of the background plate, in grid units.' },
  { name: 'size', in: 'query', schema: { type: 'integer', default: 24 }, description: 'Rendered width/height in px.' },
  { name: 'padding', in: 'query', schema: { type: 'number', default: 0, maximum: 6 }, description: 'Inner padding in grid units.' },
  { name: 'stroke', in: 'query', schema: { type: 'number', default: 1 }, description: 'Multiplier applied to the variant stroke weight.' },
  { name: 'palette', in: 'query', schema: { type: 'string', enum: ['obsidian', 'graphite', 'ink', 'signal', 'cobalt', 'magenta', 'amber', 'violet', 'cyan', 'crimson'] }, description: 'Named ink/accent/surface combination.' },
  { name: 'weight', in: 'query', schema: { type: 'number', enum: [1, 1.25, 1.5, 1.75, 2] } },
  { name: 'cap', in: 'query', schema: { type: 'string', enum: ['round', 'square'] } },
  { name: 'style', in: 'query', schema: { type: 'string', enum: ['outline', 'duotone', 'dashed', 'soft', 'contrast'] } },
  { name: 'scale', in: 'query', schema: { type: 'number', enum: [0.9, 1, 1.1, 1.2] } },
  { name: 'join', in: 'query', schema: { type: 'string', enum: ['round', 'miter'] } },
  { name: 'variant', in: 'query', schema: { type: 'string', example: 'v162' }, description: 'Explicit variant id, overrides the axis params.' },
];

const errorResponse = {
  description: 'Error',
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
};

export function buildOpenApi(version) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Icono API',
      version,
      description:
        'Search, recolour, restyle and export SVG icons from a generated stash of 108,800 icons ' +
        '(272 glyphs x 400 variants) across 10 palettes — 1,088,000 renderable icons. ' +
        'Every response is deterministic: the same request always returns the same SVG.',
      license: { name: 'Apache-2.0' },
    },
    servers: [{ url: '/api/v1', description: 'Same-origin' }],
    tags: [{ name: 'meta' }, { name: 'catalog' }, { name: 'icons' }, { name: 'export' }],
    paths: {
      '/health': { get: { tags: ['meta'], summary: 'Liveness probe', responses: { 200: { description: 'Service is up' } } } },
      '/stats': {
        get: {
          tags: ['meta'],
          summary: 'Stash statistics',
          responses: { 200: { description: 'Statistics', content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } } } },
        },
      },
      '/palettes': { get: { tags: ['meta'], summary: 'List palettes', responses: { 200: { description: 'Palettes' } } } },
      '/variants': { get: { tags: ['meta'], summary: 'List the 400 style variants and their axes', responses: { 200: { description: 'Variants' } } } },
      '/tags': { get: { tags: ['meta'], summary: 'All searchable tags', responses: { 200: { description: 'Tags' } } } },
      '/categories': { get: { tags: ['meta'], summary: 'Curated categories with glyph counts', responses: { 200: { description: 'Categories' } } } },
      '/openapi.json': { get: { tags: ['meta'], summary: 'This document', responses: { 200: { description: 'OpenAPI document' } } } },
      '/glyphs': {
        get: {
          tags: ['catalog'],
          summary: 'List base glyphs',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Free-text search over slug, name and tags.' },
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 60, maximum: 500 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { 200: { description: 'Glyph list' } },
        },
      },
      '/glyphs/{slug}': {
        get: {
          tags: ['catalog'],
          summary: 'One glyph plus the id of every one of its 400 variants',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Glyph' }, 404: errorResponse },
        },
      },
      '/icons': {
        get: {
          tags: ['icons'],
          summary: 'Search icons',
          description:
            'Filters glyphs by text/tag/category and variants by style axes, then returns a page of ready-to-use icon ids. ' +
            'Default ordering is variant-major so a page shows many different glyphs in one consistent style.',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' }, example: 'send' },
            { name: 'glyph', in: 'query', schema: { type: 'string' }, description: 'Restrict to one glyph slug.' },
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            ...iconQueryParams.filter((p) => ['style', 'weight', 'cap', 'scale', 'join', 'variant', 'palette'].includes(p.name)),
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['variant', 'glyph'], default: 'variant' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 60, maximum: 500 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { 200: { description: 'Paged icon list', content: { 'application/json': { schema: { $ref: '#/components/schemas/IconPage' } } } } },
        },
      },
      '/icons/random': {
        get: {
          tags: ['icons'],
          summary: 'Random icons',
          parameters: [{ name: 'count', in: 'query', schema: { type: 'integer', default: 24, maximum: 100 } }],
          responses: { 200: { description: 'Random icons with inline SVG' } },
        },
      },
      '/icons/{id}': {
        get: {
          tags: ['icons'],
          summary: 'Icon metadata plus inline SVG',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'send--v162', description: '`<glyph-slug>--v<000-399>`; a bare slug uses the default variant.' },
            { name: 'palette', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Icon record' }, 404: errorResponse },
        },
      },
      '/icons/{id}/svg': {
        get: {
          tags: ['export'],
          summary: 'Render one icon as SVG',
          description: 'Returns `image/svg+xml` with a one-year immutable cache header. Colour, size, stroke and style are all query-controlled.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'arrow-left--v162' },
            ...iconQueryParams,
          ],
          responses: { 200: { description: 'SVG document', content: { 'image/svg+xml': {} } }, 404: errorResponse },
        },
      },
      '/icons/{id}/data-uri': {
        get: {
          tags: ['export'],
          summary: 'Icon as a data: URI',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, ...iconQueryParams],
          responses: { 200: { description: 'data URI', content: { 'text/plain': {} } } },
        },
      },
      '/icons/{id}/jsx': {
        get: {
          tags: ['export'],
          summary: 'Icon as a React component',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, ...iconQueryParams],
          responses: { 200: { description: 'JSX source', content: { 'text/plain': {} } } },
        },
      },
      '/sprite.svg': {
        get: {
          tags: ['export'],
          summary: 'Bundle up to 500 icons into one SVG sprite',
          parameters: [
            { name: 'ids', in: 'query', required: true, schema: { type: 'string' }, example: 'send--v162,arrow-left--v162,search--v162' },
            ...iconQueryParams,
          ],
          responses: { 200: { description: 'SVG sprite of <symbol> elements', content: { 'image/svg+xml': {} } }, 400: errorResponse },
        },
      },
      '/render': {
        post: {
          tags: ['export'],
          summary: 'Batch render up to 500 icons in one request',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    color: { type: 'string' },
                    accent: { type: 'string' },
                    palette: { type: 'string' },
                    size: { type: 'integer' },
                    style: { type: 'string' },
                    icons: {
                      type: 'array',
                      maxItems: 500,
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          glyph: { type: 'string' },
                          variant: { type: 'string' },
                          color: { type: 'string' },
                          size: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Rendered icons', content: { 'application/json': { schema: { $ref: '#/components/schemas/BatchResult' } } } } },
        },
      },
    },
    components: {
      schemas: {
        Error: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        Variant: {
          type: 'object',
          properties: {
            index: { type: 'integer', minimum: 0, maximum: 399 },
            id: { type: 'string', example: 'v162' },
            weight: { type: 'number' },
            cap: { type: 'string' },
            style: { type: 'string' },
            scale: { type: 'number' },
            join: { type: 'string' },
            label: { type: 'string' },
          },
        },
        Icon: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'send--v162' },
            slug: { type: 'string', example: 'send' },
            name: { type: 'string', example: 'Send' },
            tags: { type: 'array', items: { type: 'string' } },
            variant: { $ref: '#/components/schemas/Variant' },
            palette: { type: ['string', 'null'] },
            svgUrl: { type: 'string' },
            jsonUrl: { type: 'string' },
          },
        },
        IconPage: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            offset: { type: 'integer' },
            limit: { type: 'integer' },
            count: { type: 'integer' },
            order: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/Icon' } },
          },
        },
        Stats: {
          type: 'object',
          properties: {
            glyphs: { type: 'integer', example: 272 },
            variantsPerGlyph: { type: 'integer', example: 400 },
            baseIcons: { type: 'integer', example: 108800 },
            palettes: { type: 'integer', example: 10 },
            totalIcons: { type: 'integer', example: 1088000 },
            tags: { type: 'integer' },
            categories: { type: 'integer' },
          },
        },
        BatchResult: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            errors: { type: 'array', items: { type: 'object' } },
            items: { type: 'array', items: { $ref: '#/components/schemas/Icon' } },
          },
        },
      },
    },
  };
}
