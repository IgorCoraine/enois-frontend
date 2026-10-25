import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Award, ExternalLink } from "lucide-react";

import { contributorSealsApi } from "@/lib/api";

/**
 * Selos oficiais de contribuição no perfil. Só chegam aqui evidências validadas; notas internas e
 * suspeitas nunca são projetadas pela API pública.
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
                {texts.profile.seals.grantedAt}{" "}
                {new Date(seal.grantedAt).toLocaleDateString("pt-BR")}
                {" · "}
                {texts.profile.seals.categories}: {seal.category}
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{seal.description}</p>

          {seal.evidence.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-subtle">{texts.profile.seals.evidence}</p>

              <ul className="mt-1 space-y-1">
                {seal.evidence.map((evidence) => (
                  <li key={`${evidence.repository}-${evidence.prNumber}`}>
                    <a
                      href={evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <span className="truncate">
                        {evidence.repository} #{evidence.prNumber} · {evidence.title}
                      </span>

                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
