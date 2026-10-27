/** Sessão do canal de aplicação: a chave derivada e o prazo que o servidor informou. */
export type ChannelSession = {
  id: string;
  key: CryptoKey;
  expiresAt: number;
};
