const PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const EXTENSION_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() || "";
}

export function validatePhotoUpload(file: File) {
  const extension = extensionOf(file.name);
  if (!PHOTO_EXTENSIONS.has(extension) || !PHOTO_TYPES.has(file.type) || EXTENSION_TYPES[extension] !== file.type) {
    return "Envie uma imagem JPG, PNG ou WEBP com extensão e tipo compatíveis.";
  }
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) return "Cada foto deve ter no máximo 10 MB.";
  return null;
}

export function validateDocumentUpload(file: File) {
  const extension = extensionOf(file.name);
  if (!DOCUMENT_EXTENSIONS.has(extension) || !DOCUMENT_TYPES.has(file.type) || EXTENSION_TYPES[extension] !== file.type) {
    return "Envie um PDF ou uma imagem JPG, PNG ou WEBP com extensão e tipo compatíveis.";
  }
  if (file.size <= 0 || file.size > 20 * 1024 * 1024) return "O documento deve ter no máximo 20 MB.";
  return null;
}
