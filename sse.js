// Cloudflare Worker code

addEventListener('fetch', event => {
  event.respondWith(fetchAndApply(event.request));
})

async function fetchAndApply(request) {

  const { readable, writable } = new TransformStream()
  let headers = new Headers();
  headers.append('Content-Type', 'text/event-stream');
  headers.append('Cache-Control', 'no-cache');
  headers.append('Connection', 'keep-alive');
  headers.append('Access-Control-Allow-Origin', '*');
  headers.append('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  const init = { "status": 200, "statusText": "ok", "headers": headers };

  writeToStream(writable);
  return new Response(readable, init);
}

async function writeToStream(writable) {
  const writer = writable.getWriter();

  let count = 0;
  let eventId = `id-${++count}`;
  let msgBody = `{status: ${true}, text: "Hello to SSE message", time: "${new Date().toISOString()}"}`;

  await constructSSE(writer, eventId, "userConnected", msgBody);

  setInterval(function () {
    eventId = `id-${++count}`;
    msgBody = `{status: ${true}, text: "Repeat message: ${++count}", time: "${new Date().toISOString()}"}`;
    constructSSE(writer, eventId, "userMessage", msgBody);
  }, 5000);

}

async function constructSSE(writer, eventId, eventType, msgBody) {
  const encoder = new TextEncoder();

  await writer.write(encoder.encode(`id: ${eventId}` + '\n'));
  if (eventType) {
    await writer.write(encoder.encode(`event: ${eventType}` + '\n'));
  }
  await writer.write(encoder.encode(`data: ${msgBody}`+ '\n\n'));
}
