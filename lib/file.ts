// lib/file.ts
export async function uriToBlob(uri: string): Promise<Blob> {
    const res = await fetch(uri);
    return await res.blob();
  }