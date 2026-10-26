// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmbedPlayer } from "./embed-player";

/**
 * O quadro do provedor precisa ser pedido COM referência: o YouTube recusa a reprodução sem
 * `Referer` (erro 153), e a página manda `Referrer-Policy: no-referrer` para todas as respostas
 * (header de segurança em `src/server.ts`). Quem abre a exceção é o próprio quadro.
 */
describe("EmbedPlayer", () => {
  let root: Root | null = null;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    document.body.replaceChildren();
  });

  it("monta o quadro com a política de referência que o provedor exige", async () => {
    await act(async () => root!.render(<EmbedPlayer type="youtube" id="dQw4w9WgXcQ" />));

    // Antes do clique só existe a capa: nenhum player de terceiro carrega junto com o feed.
    expect(container.querySelector("iframe")).toBeNull();

    const capa = container.querySelector("button");
    expect(capa).not.toBeNull();

    await act(async () => capa!.click());

    const frame = container.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame!.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
    expect(frame!.getAttribute("src")).toContain("youtube.com/embed/dQw4w9WgXcQ");
  });
});
