import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowRight, Award, GitPullRequest, ShieldCheck } from "lucide-react";

import { contributorSealsApi } from "@/lib/api";
import { ogMetas } from "@/lib/seo";

import { Button } from "@/components/ui/button";

import { AppContainer } from "@/components/app-container";
import { GithubIcon } from "@/components/icons/github";

export const Route = createFileRoute("/selos")({
  head: () => ({
    meta: [
      { title: texts.sealsPage.seoTitle },
      { name: "description", content: texts.sealsPage.seoDescription },
      ...ogMetas(texts.sealsPage.seoTitle, texts.sealsPage.seoDescription),
    ],
  }),
  component: Selos,
});

/**
 * Critérios públicos dos selos. A página lê os repositórios elegíveis da API (fonte única) e
 * explica o processo; não promete categorias que ainda não têm fonte verificável.
 */
function Selos() {
  const { data } = useQuery({
    queryKey: ["seal-criteria"],
    queryFn: () => contributorSealsApi.criteria(),
    staleTime: 10 * 60_000,
    retry: false,
  });

  const criteria = data?.criteria ?? texts.sealsPage.criteria;
  const repositories = data?.repositories ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppContainer>
        <div className="mx-auto max-w-3xl space-y-8 py-10 sm:py-14">
          <header className="space-y-3">
            <Link to="/" className="text-xs font-medium text-primary hover:underline">
              {texts.profile.backHome}
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Award className="h-4 w-4" aria-hidden />
              {texts.sealsPage.badgeTitle}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {texts.sealsPage.title}
            </h1>

            <p className="text-base leading-relaxed text-muted-foreground">
              {texts.sealsPage.intro}
            </p>
          </header>

          <section className="surface-card space-y-2 p-5">
            <h2 className="text-lg font-semibold tracking-tight">{texts.sealsPage.badgeTitle}</h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {texts.sealsPage.badgeDescription}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
              {texts.sealsPage.criteriaTitle}
            </h2>

            <ul className="space-y-2">
              {criteria.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <GitPullRequest className="h-5 w-5 text-primary" aria-hidden />
              {texts.sealsPage.reposTitle}
            </h2>

            {repositories.length === 0 ? (
              <p className="text-sm text-muted-foreground">{texts.sealsPage.reposEmpty}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {repositories.map((repo) => (
                  <li key={repo}>
                    <a
                      href={`https://github.com/${repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border-soft px-3 py-1 text-xs font-medium text-text-strong hover:border-primary/50 hover:text-primary"
                    >
                      <GithubIcon className="h-3.5 w-3.5" />
                      {repo}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">{texts.sealsPage.linkTitle}</h2>

            <ol className="space-y-2">
              {texts.sealsPage.linkSteps.map((step, index) => (
                <li key={step} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {index + 1}
                  </span>

                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">{texts.sealsPage.statesTitle}</h2>

            <dl className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              {Object.entries(texts.sealsPage.states).map(([state, description]) => (
                <div key={state} className="flex gap-2">
                  <dt className="w-24 shrink-0 font-mono text-xs text-text-subtle">{state}</dt>

                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="surface-card space-y-2 p-5">
            <h2 className="text-lg font-semibold tracking-tight">{texts.sealsPage.privacyTitle}</h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {texts.sealsPage.privacy}
            </p>
          </section>

          <footer className="flex flex-col items-start gap-2 border-t border-border pt-6">
            <Button asChild className="gap-2 rounded-full">
              <Link to="/seguranca">
                {texts.sealsPage.cta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>

            <p className="text-xs text-text-subtle">{texts.sealsPage.ctaHint}</p>
          </footer>
        </div>
      </AppContainer>
    </div>
  );
}
