#!/usr/bin/env python3
"""Read-only EN/DE/RU corpus inventory and optional local LanguageTool audit.

No suggestions are applied automatically. Formulas and labelled wrong examples
are inventoried separately; legacy translations without a known locale are not
silently treated as Russian. Requires Python 3.10+, no third-party packages.
"""
from __future__ import annotations
import argparse
import bisect
import collections
import concurrent.futures
import hashlib
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKIP_KEYS = {
    'id', 'slug', 'path', 'url', 'schema', 'record_schema', 'schema_version',
    'schemaVersion', 'group_id', 'set_id', 'pattern_id', 'source_ids', 'related',
    'related_patterns', 'gen', 'provenance', 'progress', 'text_span', 'legacy',
    'spans', 'validation', 'translations', 'metadata', 'source', 'research',
    'sources', 'source_url', 'href', 'refId', 'user', 'version', 'language', 'lang',
    'status', 'review_status', 'evidence_state', 'record_type', 'type', 'kind',
    'reasoning_move', 'move', 'level', 'cefr', 'logic', 'difficulty', 'date',
    'created_at', 'updated_at', 'changedOn', 'repeatedOn', 'reviewed_on', 'tags',
}
FORMULA_KEYS = {'formula', 'formulas', 'frame', 'frame_en', 'frame_de', 'frame_ru'}
WRONG = re.compile(r'^(wrong|incorrect|distractor|bad_example)(_|$)')
TRANSLATIONS = {'translation', 'translation_ru', 'translated_text'}
SOURCES = [
    *sorted((ROOT / 'data/patterns').glob('*.json')),
    *sorted((ROOT / 'data/reasoning-frames').glob('*.json')),
    *sorted((ROOT / 'data/method-guides').glob('*.json')),
    *sorted((ROOT / 'data/metkagram-export').glob('*/*/documents.json')),
    *sorted((ROOT / 'data/metkagram-export').glob('*/*/data.json')),
    *[ROOT / 'data' / name for name in (
        'study-sets.json', 'choice-drills.json', 'contrasts.json',
        'contrast-extensions.json', 'discovery-topics.json',
        'discovery-topics-extension.json',
        'discovery-topics-extension-thinking-2.json', 'reasoning-packs.json',
        'russian-speaker-errors.json', 'practice-quality-overrides.json',
        'practice-extensions.json')],
]


def pointer_escape(value: str) -> str:
    return value.replace('~', '~0').replace('/', '~1')


def locale_of(value: str | None) -> str | None:
    return {'en': 'en', 'enGram': 'en', 'en-GB': 'en', 'en-US': 'en',
            'de': 'de', 'deGram': 'de', 'ru': 'ru'}.get(value)


def plain(value: str) -> str:
    value = re.sub(r'\*\*(.+?)\*\*', r'\1', value, flags=re.S)
    value = re.sub(r'\[([^\]]+)\]\(https?://[^)]+\)', r'\1', value)
    value = re.sub(r'<[^>]+>', '', value)
    return value.replace('\\n', '\n').strip()


def inventory() -> tuple[list[dict], dict]:
    records, skipped = [], collections.Counter()
    for file in SOURCES:
        if not file.exists():
            raise FileNotFoundError(file)
        relative = file.relative_to(ROOT).as_posix()
        initial = 'de' if '/deGram/' in relative else 'en'

        def visit(value, pointer='', lang=initial, kind='prose', key=''):
            if isinstance(value, dict):
                lang = locale_of(value.get('lang') or value.get('language')) or lang
                for child_key, child in value.items():
                    if child_key in SKIP_KEYS:
                        continue
                    child_lang = locale_of(child_key) or lang
                    match = re.search(r'_(en|de|ru)$', child_key)
                    if match:
                        child_lang = match.group(1)
                    child_kind = kind
                    if child_key in FORMULA_KEYS:
                        child_kind = 'formula'
                    elif WRONG.match(child_key):
                        child_kind = 'intentional-error'
                    elif child_key in TRANSLATIONS:
                        child_kind = 'translation'
                        child_lang = 'ru'
                    elif child_key in {'example', 'original_text'}:
                        child_kind = 'sentence'
                    visit(child, pointer + '/' + pointer_escape(child_key), child_lang, child_kind, child_key)
            elif isinstance(value, list):
                for index, child in enumerate(value):
                    visit(child, pointer + '/' + str(index), lang, kind, key)
            elif isinstance(value, str):
                text = plain(value)
                if not text or not re.search(r'[A-Za-zА-Яа-яЁёÄÖÜäöüß]', text):
                    return
                if key == 'translated_text' and not re.search(r'[А-Яа-яЁё]', text):
                    skipped['legacy-translation-locale-unknown'] += 1
                    return
                letters = re.findall(r'[^\W\d_]', text, re.U)
                if letters and sum(bool(re.match(r'[А-Яа-яЁё]', c)) for c in letters) / len(letters) > 0.45:
                    lang = 'ru'
                if text.startswith(('http://', 'https://', '/', '#')) or key.endswith(('_id', '_ids', '_slug', '_url', '_path')):
                    return
                if len(text.split()) < 2:
                    skipped['single-token-label'] += 1
                    return
                if kind == 'formula':
                    skipped['formula-not-prose'] += 1
                if kind == 'intentional-error':
                    skipped['labelled-incorrect-example'] += 1
                records.append({'file': relative, 'pointer': pointer, 'language': lang,
                                'kind': kind, 'raw': value, 'text': text})
        visit(json.loads(file.read_text('utf-8')))
    counts = collections.Counter(r['language'] for r in records if r['kind'] not in {'formula', 'intentional-error'})
    return records, {'files': len(SOURCES), 'fields_by_language': dict(counts),
                     'exclusions': dict(skipped)}


def utf16len(value: str) -> int:
    return len(value.encode('utf-16-le')) // 2


def audit(records: list[dict], endpoint: str) -> dict:
    unique = {}
    for record in records:
        if record['kind'] in {'formula', 'intentional-error'}:
            continue
        key = (record['language'], record['text'])
        unique.setdefault(key, []).append({k: record[k] for k in ('file', 'pointer', 'kind')})
    jobs = []
    for language in ('en', 'de', 'ru'):
        batch, length = [], 0
        for (lang, text), refs in unique.items():
            if lang != language:
                continue
            size = utf16len(text) + 2
            if batch and length + size > 12000:
                jobs.append((language, batch)); batch, length = [], 0
            batch.append((text, refs)); length += size
        if batch:
            jobs.append((language, batch))

    def check(job):
        language, batch = job
        combined = '\n\n'.join(text for text, _ in batch)
        starts, offset = [], 0
        for text, _ in batch:
            starts.append(offset); offset += utf16len(text) + 2
        data = urllib.parse.urlencode({'language': {'en': 'en-GB', 'de': 'de-DE', 'ru': 'ru-RU'}[language],
                                       'text': combined}).encode('utf-8')
        request = urllib.request.Request(endpoint.rstrip('/') + '/v2/check', data=data)
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.load(response)
        matches = []
        for match in result['matches']:
            index = bisect.bisect_right(starts, match['offset']) - 1
            text, refs = batch[index]
            local_offset = match['offset'] - starts[index]
            if local_offset + match['length'] > utf16len(text):
                continue
            matches.append({'language': language, 'text': text, 'references': refs,
                            'offset_utf16': local_offset, 'length_utf16': match['length'],
                            'message': match['message'], 'rule': match['rule']['id'],
                            'issue_type': match['rule'].get('issueType'),
                            'replacements': [r['value'] for r in match.get('replacements', [])][:8]})
        return matches, result.get('software', {})

    findings, software = [], {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for i, (matches, info) in enumerate(pool.map(check, jobs), 1):
            findings.extend(matches); software = info
            print(f'Checked batch {i}/{len(jobs)}; {len(findings)} suggestions (not automatic corrections)', flush=True)
    findings.sort(key=lambda r: (r['language'], r['rule'], r['text'], r['offset_utf16']))
    return {'engine': software, 'unique_texts_by_language': dict(collections.Counter(k[0] for k in unique)),
            'matches_by_language': dict(collections.Counter(r['language'] for r in findings)),
            'findings': findings}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--endpoint', help='Explicit local LanguageTool endpoint; no remote public API is used by default')
    parser.add_argument('--output', default='reports/corpus-language-inventory.json')
    args = parser.parse_args()
    records, summary = inventory()
    result = {'schema_version': 1, 'scope': 'EN/DE/RU learner corpus; formulas and intentional errors are not prose',
              'summary': summary, 'source_digest': hashlib.sha256(json.dumps(records, ensure_ascii=False, sort_keys=True).encode()).hexdigest()}
    if args.endpoint:
        if urllib.parse.urlparse(args.endpoint).hostname not in {'localhost', '127.0.0.1', '::1'}:
            raise ValueError('Only an explicitly local LanguageTool service is supported')
        result.update(audit(records, args.endpoint))
    else:
        result['records'] = records
    destination = ROOT / args.output
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k not in {'records', 'findings'}}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
