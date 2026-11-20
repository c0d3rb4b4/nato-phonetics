"""Validate Android display evidence and reject repeated frames across distinct visible states."""
from hashlib import sha256
import struct
import zlib


def raster_bytes(header):
    width, height, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', header)
    formats = {0: (1, (1, 2, 4, 8, 16)), 2: (3, (8, 16)), 3: (1, (1, 2, 4, 8)),
               4: (2, (8, 16)), 6: (4, (8, 16))}
    channels, depths = formats.get(color, (0, ()))
    if not width or not height or depth not in depths or compression or filtering or interlace not in (0, 1):
        raise ValueError('Invalid PNG raster header')
    # Each nonempty scanline has a filter byte. Interlaced PNGs store seven Adam7 passes.
    passes = ((0, 0, 1, 1),) if not interlace else (
        (0, 0, 8, 8), (4, 0, 8, 8), (0, 4, 4, 8), (2, 0, 4, 4),
        (0, 2, 2, 4), (1, 0, 2, 2), (0, 1, 1, 2))
    size = 0
    for x, y, dx, dy in passes:
        if x < width and y < height:
            cols, rows = (width - x + dx - 1) // dx, (height - y + dy - 1) // dy
            size += rows * (1 + (cols * channels * depth + 7) // 8)
    return size


def validate_png(data):
    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('Missing PNG signature')
    index = 8
    expected = None
    decoded = 0
    stream = zlib.decompressobj()
    while index + 12 <= len(data):
        length, kind = struct.unpack_from('>I4s', data, index)
        start = index + 8
        end = start + length
        if end + 4 > len(data):
            raise ValueError('Truncated PNG chunk')
        if zlib.crc32(data[index+4:end]) != int.from_bytes(data[end:end+4], 'big'):
            raise ValueError('PNG chunk checksum mismatch')
        if index == 8:
            if kind != b'IHDR' or length != 13:
                raise ValueError('Invalid PNG header')
            expected = raster_bytes(data[start:end])
        if kind == b'IDAT':
            decoded += len(stream.decompress(data[start:end]))
        index = end + 4
        if kind == b'IEND':
            if length != 0 or index != len(data) or not stream.eof or stream.unused_data or decoded != expected:
                raise ValueError('Incomplete or invalid PNG image stream')
            return
    raise ValueError('Missing PNG end')


def pull_png(call, path, *, package=None):
    context = ('run-as', package) if package else ()
    exported = call('exec-out', *context, 'cat', path)
    device_hash = call('exec-out', *context, 'sha256sum', path).split(maxsplit=1)[0]
    if sha256(exported).hexdigest().encode('ascii') != device_hash:
        raise ValueError(f'Display export differs from device file: {path}')
    validate_png(exported)
    return exported


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
