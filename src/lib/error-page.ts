export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #0b1220; color: #f8fafc; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; border: 1px solid rgb(148 163 184 / 16%); border-radius: 1rem; background: #162338; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #a8b5c7; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #3b82f6; color: #fff; }
      .secondary { background: #1b2b42; color: #f8fafc; border-color: rgb(148 163 184 / 30%); }
      @media (prefers-color-scheme: light) {
        body { background: #f8fafc; color: #0f172a; }
        .card { background: #fff; border-color: #e2e8f0; }
        p { color: #64748b; }
        .primary { background: #2563eb; }
        .secondary { background: #f1f5f9; color: #0f172a; border-color: #e2e8f0; }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
