addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response(JSON.stringify({ error: 'No URL provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const response = await fetch(url);
    const html = await response.text();
    const metadata = extractMetadata(html,url);

    return new Response(JSON.stringify(metadata), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error fetching metadata', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}
function decodeHtmlEntities(str) {
  const textarea = new TextDecoder().decode(new Uint8Array([
    0x26, 0x23, 0x33, 0x39, 0x3b // this is just an example for encoding, actual implementation may vary
  ]));
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractMetadata(html, url) {
  const metadata = {
      title: '',
      description: '',
      siteName: ''
  };

  // Define a helper function to extract metadata with fallback
  function extractWithFallback(patterns, defaultKey, fallbackKey) {
      for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) {
              return decodeHtmlEntities(match[1]);
          }
      }
      return metadata[defaultKey] || metadata[fallbackKey] || '';
  }

  const titlePatterns = [
      /<title>([^<]*)<\/title>/i,
      /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i,
      /<meta\s+name=["']twitter:title["']\s+content=["']([^"']*)["']/i,
      /<meta\s+itemprop=["']name["']\s+content=["']([^"']*)["']/i
  ];
  metadata.title = extractWithFallback(titlePatterns, 'title', 'siteName');

  // Extract description with fallbacks
  const descriptionPatterns = [
      /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i,
      /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i,
      /<meta\s+name=["']twitter:description["']\s+content=["']([^"']*)["']/i,
      /<meta\s+itemprop=["']description["']\s+content=["']([^"']*)["']/i
  ];
  metadata.description = extractWithFallback(descriptionPatterns, 'description', 'title');

  // Extract siteName with fallback
  const siteNamePatterns = [
      /<meta\s+property=["']og:site_name["']\s+content=["']([^"']*)["']/i
  ];
  metadata.siteName = extractWithFallback(siteNamePatterns, 'title', 'Unknown Site');

  return metadata;
}
