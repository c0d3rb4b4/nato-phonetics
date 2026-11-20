package com.natophonetics.fonttest;

import android.content.pm.ApplicationInfo;
import android.os.Process;
import android.system.Os;
import android.system.OsConstants;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

/** Record mappings from the running test target after its RN views have mounted. */
final class RuntimeLibraries {
  static void write(File directory, ApplicationInfo app) throws Exception {
    JSONArray mappings = new JSONArray();
    Set<String> archives = new HashSet<>();
    Set<String> extracted = new HashSet<>();
    archives.add(app.sourceDir);
    JSONArray splits = new JSONArray();
    if (app.splitSourceDirs != null) {
      archives.addAll(Arrays.asList(app.splitSourceDirs));
      for (String split : app.splitSourceDirs) splits.put(split);
    }
    try (BufferedReader reader = new BufferedReader(new FileReader("/proc/self/maps"))) {
      String line;
      while ((line = reader.readLine()) != null) {
        String[] fields = line.trim().split("\\s+", 6);
        if (fields.length != 6) continue;
        String path = fields[5];
        if (path.startsWith(app.nativeLibraryDir + "/")) extracted.add(path);
        if (archives.contains(path) || path.startsWith(app.nativeLibraryDir + "/")
            || path.contains("libndk_translation") || path.contains("libhoudini")) {
          mappings.put(new JSONObject().put("path", path).put("permissions", fields[1])
              .put("offset", Long.parseLong(fields[2], 16)));
        }
      }
    }
    JSONObject digests = new JSONObject();
    for (String library : Arrays.asList("libreactnative.so", "libhermes.so", "libjsi.so")) {
      String path = new File(app.nativeLibraryDir, library).getAbsolutePath();
      if (extracted.contains(path)) digests.put(path, sha256(path));
    }
    JSONObject result = new JSONObject().put("pid", Process.myPid()).put("is64Bit", Process.is64Bit())
        .put("pageSize", Os.sysconf(OsConstants._SC_PAGESIZE)).put("extractedLibrarySha256", digests)
        .put("sourceApk", app.sourceDir).put("splitApks", splits).put("nativeLibraryDir", app.nativeLibraryDir)
        .put("mappings", mappings);
    try (FileOutputStream file = new FileOutputStream(new File(directory, "runtime-libraries.json"))) {
      file.write(result.toString().getBytes(StandardCharsets.UTF_8));
    }
  }

  private static String sha256(String path) throws Exception {
    MessageDigest hash = MessageDigest.getInstance("SHA-256");
    try (FileInputStream stream = new FileInputStream(path)) {
      byte[] bytes = new byte[65536];
      int count;
      while ((count = stream.read(bytes)) != -1) hash.update(bytes, 0, count);
    }
    StringBuilder hex = new StringBuilder();
    for (byte value : hash.digest()) hex.append(String.format("%02x", value));
    return hex.toString();
  }

  private RuntimeLibraries() {}
}
