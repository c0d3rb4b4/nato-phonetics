"""Inspect the single loopback origin in a disposable Firefox 159 test profile."""
import hashlib
import json
from pathlib import Path
import shutil
import sqlite3
import sys
import tempfile


def snapshot(profile):
    raw = (profile / 'serviceworker.txt').read_bytes()
    rows = raw.decode().splitlines()
    # Mozilla's version-12 registrar format stores scope, script and script cache name.
    assert rows[0] == '12' and rows[2].startswith('http://127.0.0.1:')
    script_url = rows[3]
    cache_name = rows[5]
    origin = rows[2].rstrip('/').replace(':', '+').replace('/', '+')
    database = profile / 'storage' / 'default' / origin / 'cache' / 'caches.sqlite'
    assert database.is_file()
    wal = database.with_name('caches.sqlite-wal')
    # Firefox holds the live DB exclusively. Read a private copy of the DB and
    # its WAL after verifying the source bytes stayed stable across the copy.
    files = [database, wal] if wal.exists() else [database]
    def digest_inputs():
        return [hashlib.sha256(file.read_bytes()).hexdigest() for file in files]
    with tempfile.TemporaryDirectory() as tmp:
        before = digest_inputs()
        for file in files:
            shutil.copyfile(file, Path(tmp) / file.name)
        assert before == digest_inputs() and wal.exists() == (wal in files)
        connection = sqlite3.connect((Path(tmp) / database.name).as_uri() + '?mode=ro', uri=True)
        caches = [
            {'namespace': namespace, 'key': key.decode('utf-16-le'), 'id': cache_id,
             'workerScriptEntries': entries}
            for namespace, key, cache_id, entries in connection.execute(
                'SELECT s.namespace, s.key, s.cache_id, '
                '(SELECT COUNT(*) FROM entries e WHERE e.cache_id = s.cache_id AND e.request_url_no_query = ?) '
                'FROM storage s ORDER BY s.namespace, s.cache_id', (script_url,))
        ]
        connection.close()
    assert raw == (profile / 'serviceworker.txt').read_bytes()
    return {'registrationSha256': hashlib.sha256(raw).hexdigest(), 'scriptURL': script_url,
            'registeredScriptCache': cache_name, 'caches': caches,
            'registeredScriptInNamedCache': any(entry['key'] == cache_name and entry['workerScriptEntries'] > 0 for entry in caches),
            'walBytesAtRead': wal.stat().st_size if wal.exists() else None}


if __name__ == '__main__':
    print(json.dumps(snapshot(Path(sys.argv[1]).resolve()), indent=2))
