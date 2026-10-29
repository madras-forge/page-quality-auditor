import { analyzePage } from './analyze';
export const DEMO_HTML = `<!doctype html><html lang="en-GB"><head>
<title>Knee replacement: your treatment guide | Northstar Health</title>
<meta name="description" content="Understand knee replacement, recovery, risks and the questions to discuss with your care team.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"MedicalWebPage","name":"Knee replacement","author":{"@type":"Person","name":"Northstar editorial team"}}</script>
</head><body><header><a href="/">Northstar Health</a><a href="/about">About us</a></header>
<main><article><h1>Knee replacement: a guide to your treatment</h1>
<p>Knee replacement is an operation to replace a damaged knee joint. This fictional page demonstrates the auditor, and is not medical advice.</p>
<p class="byline">Written by the Northstar editorial team</p>
<h2>Understanding your options</h2><p>Discuss your individual care needs with a qualified clinician.</p>
<img src="/knee-illustration.svg">
<h2>Preparing for a consultation</h2><p>Ask about benefits, risks and alternatives, and what recovery might involve.</p>
<a href="/appointments">Book a consultation</a><a href="/contact">Contact our team</a>
<form><input type="email" name="email" placeholder="Your email"><button>Request information</button></form>
</article></main><footer><a href="/privacy">Privacy policy</a></footer></body></html>`;
export function createDemoReport() {
  return analyzePage(
    {
      requestedUrl: 'https://northstar-health.example/treatments/knee-replacement',
      finalUrl: 'https://northstar-health.example/treatments/knee-replacement',
      html: DEMO_HTML,
      status: 200,
      bytes: Buffer.byteLength(DEMO_HTML),
      redirects: 0,
      robots: 'demo',
    },
    'demo',
  );
}
