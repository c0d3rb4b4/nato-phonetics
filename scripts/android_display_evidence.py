"""Reject duplicate captured frames across states that must visibly differ."""
from hashlib import sha256


def repeated_display_transitions(directory, states):
    failures = []
    previous = None
    for stage, visible_state in states:
        digest = sha256((directory / (stage + '.png')).read_bytes()).hexdigest()
        if previous is not None:
            old_stage, old_state, old_digest = previous
            if old_state != visible_state and old_digest == digest:
                failures.append({'from': old_stage, 'to': stage, 'sha256': digest})
        previous = (stage, visible_state, digest)
    return failures
