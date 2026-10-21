# Engineering working agreement

This is a local student prototype. These rules describe the current baseline and the evidence still to add as features are built.

## Project conventions

- Keep HTTP routes and app setup in `src/app/main.py`; keep synthetic catalog data, its schema, and catalog search in `src/app/catalog.py`.
- Validate data at the API boundary with Pydantic. Keep product records immutable and use explicit response models for API output.
- Keep browser code in external JavaScript and CSS files. Render untrusted text with DOM text APIs; do not use `innerHTML` or inline scripts.
- Keep demo data synthetic. Do not add real payment processing, account details, or real order records to this prototype.
- Bind the development server to `127.0.0.1`. Do not expose intentionally vulnerable project components to the public internet.
- Pin direct dependencies in `requirements.txt` and keep the resolved local environment in `requirements.lock`. Revisit the Python version before producing the course submission lock file.
- Record substantial generative-AI assistance in `docs/ai-disclosure/log.md`. The student reviews and explains generated changes before treating them as project work.

## Change workflow

1. State the requirement and its acceptance criteria before implementing a security-relevant feature.
2. Identify affected assets, threats, and trust boundaries in the threat model before adding agent or order functionality.
3. Make a focused change and review the diff for unrelated files, unsafe rendering, secrets, and generated artifacts.
4. Verify behavior with a documented method. Add automated checks when the course verification plan is established; this prototype does not yet have an automated test suite or CI pipeline.
5. Record findings, fixes, and remaining risk in the relevant project documentation.

## Current limitations

The catalog is in-memory synthetic data. The chat endpoint is a fixed placeholder. There is no authentication, authorization, database, real checkout, agent, model, automated test suite, scanner configuration, SBOM, or CI workflow yet. These are planned evidence items, not implemented controls.
