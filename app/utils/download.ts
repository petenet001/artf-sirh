/**
 * Déclenche le téléchargement d'un `Blob` (PDF, ZIP…) côté navigateur. Utilisé
 * pour les actes / notes de service / bulletins renvoyés en binaire par l'API.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
