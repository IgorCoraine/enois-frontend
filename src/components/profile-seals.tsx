import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Award, ChevronDown, ExternalLink } from "lucide-react";

import { contributorSealsApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";

/**
 * Selos oficiais de contribuição no perfil. Só chegam aqui evidências validadas; notas internas e
 * suspeitas nunca são projetadas pela API pública. O nível exibido já vem calculado do backend.
 */
export function ProfileSeals({ username }: { username: string }) {
  const { data } = useQuery({
    queryKey: ["contributor-seals", username],
    queryFn: () => contributorSealsApi.byUsername(username),
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!data || data.length === 0) return null;

  return (
    <section aria-labelledby="profile-seals-title" className="surface-card space-y-4 p-4 sm:p-5">
      <h2
        id="profile-seals-title"
        className="text-xs font-semibold uppercase tracking-widest text-text-subtle"
      >
        {texts.profile.seals.title}
      </h2>

      {data.map((seal) => (
        <article
          key={seal.type}
          className="space-y-2 border-t border-border-soft pt-3 first:border-0 first:pt-0"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              <Award className="h-5 w-5" aria-hidden />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-strong">{seal.name}</p>

              <p className="text-xs text-text-subtle">
                {seal.categoryName}
                {" · "}
                {texts.profile.seals.tierRange(seal.minCount, seal.maxCount)}
                {" · "}
                {texts.profile.seals.verified(seal.evidenceCount)}
              </p>

              <p className="text-xs text-text-subtle">
                {texts.profile.seals.grantedAt} {dataCurta(seal.grantedAt)}
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{seal.description}</p>

          {seal.evidence.length > 0 && (
            <details className="group rounded-xl border border-border-soft px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium text-text-subtle [&::-webkit-details-marker]:hidden">
                <span>
                  {texts.profile.seals.evidence} ({seal.evidence.length})
                </span>

                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>

              <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">
                {seal.evidence.map((evidence) => (
                  <li key={`${evidence.repository}-${evidence.kind}-${evidence.number}`}>
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <span className="truncate">
                        {evidence.kind === "ISSUE" ? "Issue" : "PR"} · {evidence.repository} #
                        {evidence.number} · {evidence.title}
                      </span>

                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </article>
      ))}
    </section>
  );
}
