import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A navegação autenticada tem um único limite: 1024px (lg).
 * Abaixo dele vale o hambúrguer/drawer; a partir dele, a sidebar.
 * Quando o hambúrguer sumia em `md` (768px) e a sidebar só nascia em `lg` (1024px),
 * a faixa 768–1023px ficava sem menu nenhum (#226).
 */
function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), "utf8");
}

describe("breakpoint da navegação autenticada", () => {
  it("o hambúrguer continua disponível em tablet e só some no desktop", () => {
    const header = fonte("src/components/authenticated-app-header.tsx");
    const botao = header.match(/<button[\s\S]*?aria-label=\{texts\.navigation\.openMenu\}/);
    expect(botao).not.toBeNull();
    expect(botao![0]).toContain("lg:hidden");
    expect(botao![0]).not.toContain("md:hidden");
  });

  it("o drawer acompanha o hambúrguer (overlay e painel)", () => {
    const drawer = fonte("src/components/navigation-drawer.tsx");
    expect(drawer).not.toContain("md:hidden");
    expect(drawer.match(/lg:hidden/g)).toHaveLength(2);
  });

  it("a sidebar só aparece no desktop, sem sobrepor o drawer", () => {
    const sidebar = fonte("src/components/app-sidebar.tsx");
    expect(sidebar).toContain("lg:block");
    expect(sidebar).not.toContain("md:block");
  });
});
