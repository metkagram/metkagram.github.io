# External DOI activation

Repository preparation is complete enough to define the remaining owner-authorized archive step for the existing 1.0.0 dataset release.

- [ ] Review `data/dataset-publication.json` release boundary for 1.0.0.
- [ ] Freeze exact public release files.
- [ ] Compute and record SHA-256 checksums for the frozen distributions.
- [ ] Review `data/dataset.jsonld`, licensing/provenance context and `CITATION.cff`.
- [ ] Publish the frozen 1.0.0 release in Zenodo (or another appropriate persistent archive) using the dataset owner's authorized account.
- [ ] Verify the archive record and DOI resolution.
- [ ] Write the exact issued DOI back to `data/dataset.jsonld`, `data/dataset-publication.json` and `CITATION.cff`.
- [ ] Publish a new versioned archive release instead of silently changing cited bytes when the corpus materially changes.

Do not add a placeholder DOI before issuance.
