# Dataset publication status

Metkagram has a genuine reusable language-pattern and annotation corpus and treats it as a separately citable data product.

Current state: **version 1.0.0 prepared; DOI not issued**.

Canonical preparation artifacts:

- `data/dataset.jsonld` — Schema.org Dataset metadata and selected public distributions.
- `data/dataset-publication.json` — release boundary, DOI lifecycle and integrity requirements.
- `CITATION.cff` — dataset citation metadata.
- `ARCHITECTURE.md` and `LICENSING.md` — current provenance/licensing context.

Before archival publication, review the 1.0.0 release boundary, freeze exact public distributions and compute SHA-256 checksums. Then publish that frozen release through Zenodo or another appropriate persistent archive using owner-authorized access.

Only after the archive issues and resolves a DOI should that DOI be added to `data/dataset.jsonld`, `data/dataset-publication.json` and `CITATION.cff`.

Later material corpus changes should produce a new versioned archival release rather than silently changing the bytes behind a citation.

The DOI is a persistent citation/reproducibility mechanism, not a Search ranking factor or guarantee of AI citation.
