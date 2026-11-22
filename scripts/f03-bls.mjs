/* Native Node audit path, using audited noble-curves BLS12-381 implementation.
 * NOT imported by GitHub Pages: F02 browser retains its honest relay-only checks.
 */
import {createHash} from "node:crypto";
import {bls12_381} from "@noble/curves/bls12-381.js";
export const QUICKNET_PUBKEY="83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a";
export const QUICKNET_DST="BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_";
export function verifyQuicknetSignature(signature,round){
 if(!Number.isSafeInteger(round)||round<1)throw Error("Invalid Quicknet round");
 if(typeof signature!=="string"||!/^[a-f0-9]{96}$/i.test(signature))
   throw Error("Invalid G1 signature encoding");
 const roundBytes=Buffer.alloc(8);
 roundBytes.writeBigUInt64BE(BigInt(round));
 const message=createHash("sha256").update(roundBytes).digest();
 const hashPoint=bls12_381.shortSignatures.hash(message,QUICKNET_DST);
 try{
   return bls12_381.shortSignatures.verify(
     Buffer.from(signature,"hex"),hashPoint,Buffer.from(QUICKNET_PUBKEY,"hex"))===true;
 }catch{return false;}
}
