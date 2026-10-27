/** Servidor de mentira do teste do canal: guarda a chave pública do cliente e o que respondeu. */
export type FakeServer = {
  privateKey: CryptoKey;
  publicKeySpki: Uint8Array;
  clientPublicKey?: Uint8Array<ArrayBuffer>;
  calls: number;
};
