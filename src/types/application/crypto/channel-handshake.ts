/** Resposta do `POST /crypto/session` no formato em que o servidor a envia. */
export type ChannelHandshake = {
  sessionId?: string;
  serverPublicKey?: string;
  expiresAt?: string | number;
};
