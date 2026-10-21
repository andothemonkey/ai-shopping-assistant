# Morrow Supply

A local-first shopping assistant prototype for a Machine Learning course project. It currently includes a multi-page storefront, a synthetic three-item catalog, product details, keyword search, category filters, a browser-local demo bag, a simulated checkout, an approach page, and a contact preview.

## Run locally

Use Python 3.11 or 3.12 if available. The app should stay bound to `127.0.0.1`; do not expose this prototype to the public internet.

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.lock
uvicorn src.app.main:app --reload --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000> in your browser. Stop the server with `Ctrl+C`.

`requirements.txt` lists direct dependencies. `requirements.lock` pins the resolved dependency set used for the local prototype.

## Project status

- Home, shop, product detail, bag, demo checkout, approach, contact, and privacy pages.
- Product search and category filtering are backed by the local API.
- Bag contents are stored in browser local storage; checkout is simulated and creates no order.
- Contact form preview clears its fields and sends or stores no message.
- The shop-guide endpoint is a placeholder; it is not connected to a model or agent yet.
- There is no user authentication, real order storage, or payment handling.

## Source layout

- `src/app/main.py` — FastAPI application, page routes, API routes, and response security headers.
- `src/app/catalog.py` — immutable synthetic product records, schema, lookup, and keyword search.
- `src/app/templates/` — shared Jinja layout and server-rendered pages.
- `src/app/static/` — external browser JavaScript and CSS.
- `docs/engineering/working-agreement.md` — current coding conventions, change workflow, and known engineering gaps.
- `docs/ai-disclosure/log.md` — record of generative-AI assistance and verification.

The engineering agreement is a baseline, not a claim that course security evidence is complete. Requirements, threat model, tests, reviews, scans, SBOM, and CI are still to be added.

Do not enter real personal, account, order, or payment data. Review and understand generated code before extending it. Dynamic catalog and assistant text is inserted with `textContent`, not interpreted as HTML.

## AI use disclosure

Record substantial generative-AI use in [`docs/ai-disclosure/log.md`](docs/ai-disclosure/log.md): tool, purpose, prompt summary, material used, and how you verified it. Add an entry when you use AI for this project and follow the Machine Learning course policy.
