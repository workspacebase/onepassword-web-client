import { JWK } from "./Interfaces";

const base64url = require("base64url");

const baseURL = "https://cors-anywhere.herokuapp.com/my.1password.com:443/api/";
export const request = async (
  endpoint: string,
  method: any,
  payload?: any,
  headers?: any
) => {
  headers = {
    "x-requested-with": "XMLHttpRequest",
    "x-agilebits-client": "1Password for Web/636",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
    ...(method !== "GET" && { "Content-Type": "application/json" }),
    ...(headers && headers)
  };
  const body = { body: JSON.stringify(payload) };
  const path = encodeURI(baseURL + endpoint);
  const response = await fetch(path, {
    headers,
    method,
    ...(method !== "GET" && body)
  });
  return await response.json();
};

export const random = (length: number) => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  return bufferToHex(randomBytes).slice(0, length);
};

export const importKey = async (
  key: any,
  algorithm: string = "PBKDF2",
  usage: Array<string> = ["deriveKey", "deriveBits"],
  keyType: string = "raw"
) => {
  return crypto.subtle.importKey(
    keyType,
    keyType === "raw" ? new TextEncoder().encode(key) : key,
    //@ts-ignore
    { name: algorithm },
    false,
    usage
  );
};

export const exportKey = async (cryptoKey: CryptoKey, type: string = "jwk") => {
  return crypto.subtle.exportKey(type, cryptoKey);
};

export const deriveKey = async (
  rawKey: string,
  salt: Uint8Array,
  iterations: number,
  length: number,
  format: string = "PBKDF2",
  info?: string
) => {
  const key = await importKey(rawKey, format);
  const derivedKey = await crypto.subtle.deriveKey(
    //@ts-ignore
    {
      name: format,
      salt,
      ...(format === "PBKDF2" && { iterations }),
      ...(format === "HKDF" && {
        info: info ? new TextEncoder().encode(info) : new Uint8Array([])
      }),
      hash: "SHA-256"
    },
    key,
    {
      name: "AES-GCM",
      length: length * 8 //in bits
    },
    true,
    ["encrypt", "decrypt"]
  );
  return exportKey(derivedKey, "raw") as Promise<ArrayBuffer>;
};

export const encrypt = async (iv: string, data: string, key: JWK) => {
  const cipherText = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new TextEncoder().encode(iv) },
    await importKey(key, "AES-GCM", ["encrypt", "decrypt"], "jwk"),
    new TextEncoder().encode(data)
  );
  console.log(cipherText);
  return base64url(cipherText);
};

export const decrypt = async (iv: string, data: string, key: JWK) => {
  return new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new TextEncoder().encode(iv) },
      await importKey(key, "AES-GCM", ["encrypt", "decrypt"], "jwk"),
      new TextEncoder().encode(data)
    )
  );
};

export const N =
  "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199FFFFFFFFFFFFFFFF";
export const g = "5";

export const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x: number) =>
      ("00" + x.toString(16)).slice(-2)
    )
    .join("");
};

export const hexToBuffer = (hex: string): ArrayBuffer => {
  const matches = hex.match(/[\da-f]{2}/gi) as Array<any>;
  let buff: any = [];
  if (matches)
    buff = matches.map(function(h) {
      return parseInt(h, 16);
    });
  return new Uint8Array(buff);
};

export const mergeArrayBuffers = (keys: Array<Uint8Array>): Uint8Array => {
  let mergedArray: Array<number> = [];
  let length = 0;
  keys.map((key: any) => {
    for (let i = 0; i < key.byteLength; i++) {
      mergedArray[length + i] = key[i];
    }
    length += key.byteLength;
  });
  return new Uint8Array(mergedArray);
};