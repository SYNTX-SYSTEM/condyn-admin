import crypto from "crypto";

export function canonicalSerialize(obj: any): string {
  if (obj === undefined) return "";
  
  const sortKeys = (o: any): any => {
    if (o === null || typeof o !== "object") return o;
    if (Array.isArray(o)) return o.map(sortKeys);
    
    return Object.keys(o)
      .sort()
      .reduce((acc: any, key) => {
        if (o[key] !== undefined) {
          acc[key] = sortKeys(o[key]);
        }
        return acc;
      }, {});
  };
  
  return JSON.stringify(sortKeys(obj));
}

export function generatePayloadHash(obj: any): string {
  const serialized = canonicalSerialize(obj);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}
