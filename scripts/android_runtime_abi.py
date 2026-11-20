"""Bind an observed Android app process to native entries of the installed APK."""
from pathlib import Path
import hashlib
import re
import struct
import zipfile

ABIS = {
    "armeabi-v7a": ("arm", 40, 1), "arm64-v8a": ("arm64", 183, 2),
    "x86": ("x86", 3, 1), "x86_64": ("x86_64", 62, 2),
}


def installed_abi(package_dump):
    matches = set(re.findall(r"^\s*primaryCpuAbi=(\S+)\s*$", package_dump, re.MULTILINE))
    if len(matches) != 1:
        raise ValueError(f"Expected one PackageManager primaryCpuAbi, found {sorted(matches)}")
    return matches.pop()


def executable_segments(data, elf_class, page_size):
    """File offsets backing executable PT_LOAD segments, including a separate RX segment."""
    if elf_class == 1:
        phoff, = struct.unpack_from('<I', data, 28)
        entsize, count = struct.unpack_from('<HH', data, 42)
        layout = struct.Struct('<IIIIIIII')
    else:
        phoff, = struct.unpack_from('<Q', data, 32)
        entsize, count = struct.unpack_from('<HH', data, 54)
        layout = struct.Struct('<IIQQQQQQ')
    if entsize < layout.size or phoff + entsize * count > len(data):
        raise ValueError('Invalid ELF program headers')
    if page_size is not None and (not isinstance(page_size, int) or page_size <= 0 or page_size & (page_size - 1)):
        raise ValueError('Invalid process page size')
    offsets = set()
    for i in range(count):
        header = layout.unpack_from(data, phoff + i * entsize)
        kind, flags, offset = (header[0], header[6], header[1]) if elf_class == 1 else header[:3]
        size = header[4] if elf_class == 1 else header[5]
        if kind == 1 and flags & 1 and size:
            if offset + size > len(data):
                raise ValueError('Executable segment exceeds ELF size')
            # Older observations did not record the kernel page size. In that
            # case only accept an exact segment start, never a guessed rounding.
            offsets.add(offset if page_size is None else offset - offset % page_size)
    if not offsets:
        raise ValueError('ELF has no executable load segment')
    return offsets


def check_runtime(apk, installed_path, installed_sha256, primary_abi, requested_abi, observation, reported_pid,
                  *, base_path=None):
    directory, machine, elf_class = ABIS[requested_abi]
    if primary_abi != requested_abi:
        raise ValueError(f"Requested ABI {requested_abi}, PackageManager selected {primary_abi}")
    digest = hashlib.sha256(Path(apk).read_bytes()).hexdigest()
    if digest != installed_sha256 or (base_path or installed_path) != observation["sourceApk"]:
        raise ValueError("Running process source path or installed APK digest differs")
    if base_path is not None and installed_path not in observation.get("splitApks", []):
        raise ValueError("The installed native split does not belong to this process")
    if not isinstance(reported_pid, int) or reported_pid <= 0 or reported_pid != observation["pid"]:
        raise ValueError("Library mappings belong to a different measurement process")
    lib_dir = observation["nativeLibraryDir"]
    if not lib_dir.endswith("/" + directory) or observation["is64Bit"] != (elf_class == 2):
        raise ValueError(f"Unexpected running process library directory or ELF class: {lib_dir}")
    mappings = observation["mappings"]
    verified = {}
    with zipfile.ZipFile(apk) as archive, Path(apk).open("rb") as stream:
        for library in ["libreactnative.so", "libhermes.so", "libjsi.so"]:
            entry = archive.getinfo(f"lib/{requested_abi}/{library}")
            data = archive.read(entry)
            if (data[:4] != b"\x7fELF" or data[4:6] != bytes([elf_class, 1])
                    or struct.unpack_from("<H", data, 18)[0] != machine):
                raise ValueError(f"Wrong ELF architecture: {entry.filename}")
            stream.seek(entry.header_offset + 26)
            name_bytes, extra_bytes = struct.unpack("<HH", stream.read(4))
            offset = entry.header_offset + 30 + name_bytes + extra_bytes
            segments = executable_segments(data, elf_class, observation.get("pageSize"))
            library_sha = hashlib.sha256(data).hexdigest()
            extracted_path = lib_dir + "/" + library
            direct = [row for row in mappings if row["path"] == installed_path]
            extracted = [row for row in mappings if row["path"] == extracted_path]
            executable = [row for row in direct if row['permissions'][2:3] == 'x' and row['offset'] - offset in segments]
            if (entry.compress_type == zipfile.ZIP_STORED and any(row['offset'] == offset for row in direct)
                    and executable):
                backing = 'installed APK'
            else:
                executable = [row for row in extracted if row['permissions'][2:3] == 'x' and row['offset'] in segments]
                if not any(row['offset'] == 0 for row in extracted) or not executable:
                    raise ValueError(f"No executable mapping and ELF header for {entry.filename} at offset {offset}")
                if observation.get('extractedLibrarySha256', {}).get(extracted_path) != library_sha:
                    raise ValueError(f"Mapped extracted library digest differs or is missing: {extracted_path}")
                backing = 'verified extracted file'
            verified[library] = {"entry": entry.filename, "sha256": library_sha, "backing": backing,
                                 "zipDataOffset": offset, "mappings": executable}
    return {"pid": observation["pid"], "apkSha256": digest, "primaryCpuAbi": primary_abi,
            "nativeLibraryDir": lib_dir, "verifiedLibraries": verified, "passed": True}
