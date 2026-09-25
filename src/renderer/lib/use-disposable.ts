import { useEffect, useState } from "react";

// GPU resources (geometries, materials, textures) are not garbage-collected by
// three.js; they must be disposed explicitly when replaced or unmounted.
export function useDisposable<T extends { dispose(): void }>(
  create: () => T | null,
  deps: readonly unknown[],
): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    const created = create();
    setValue(created);
    return () => created?.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}
