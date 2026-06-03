export function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Something went wrong — ValuRight.ai</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #1f2937; }
      main { width: min(92vw, 28rem); text-align: center; }
      .mark { width: 4rem; height: 4rem; margin: 0 auto 1.5rem; border-radius: 999px; display: grid; place-items: center; background: #fee2e2; color: #b91c1c; font-size: 2rem; font-weight: 700; }
      h1 { margin: 0; font-size: 1.5rem; line-height: 2rem; }
      p { margin: .75rem 0 0; color: #64748b; line-height: 1.6; }
      .actions { margin-top: 1.5rem; display: flex; justify-content: center; gap: .75rem; flex-wrap: wrap; }
      a, button { border: 1px solid #cbd5e1; border-radius: .5rem; padding: .65rem 1rem; font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
      button { background: #166a4f; color: white; border-color: #166a4f; }
      a { background: white; color: #1f2937; }
    </style>
  </head>
  <body>
    <main>
      <div class="mark">!</div>
      <h1>Something went wrong</h1>
      <p>The app hit a rendering issue. Refresh the page, or return home and try again.</p>
      <div class="actions">
        <button onclick="location.reload()">Refresh</button>
        <a href="/">Go home</a>
      </div>
    </main>
  </body>
</html>`;
}