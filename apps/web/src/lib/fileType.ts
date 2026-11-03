export interface DetectedFile {
  mime: "application/pdf" | "image/jpeg" | "image/png";
  ext: "pdf" | "jpg" | "png";
}

/** Identifies a file by its first bytes, never by its name, so renamed files are caught. */
export function detectFileKind(bytes: Uint8Array): DetectedFile | null {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return { mime: "application/pdf", ext: "pdf" };
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { mime: "image/png", ext: "png" };
  if (startsWith([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  return null;
}
