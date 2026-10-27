import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Award, ChevronDown } from "lucide-react";

import { contributorsApi } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { ContributionForm } from "./contribution-form";

/**
 * Convite para quem já tem contribuição verificada confirmar os dados no painel de contribuintes.
 * O formulário é o mesmo da landing; a diferença é que a aprovação já veio do GitHub — não há
 * triagem manual. Fica colapsado por padrão.
 */
export function VerifiedContributorPrompt() {
  const authenticated = useIsAuthenticated();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["contributors", "me"],
    queryFn: () => contributorsApi.me(),
    enabled: authenticated,
    retry: false,
    staleTime: 60_000,
  });

  if (!authenticated || !data?.verified || !data.applicationPending) return null;

  return (
    <section className="surface-card space-y-3 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Award className="h-5 w-5" aria-hidden />
        </span>

        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            {texts.sealsPage.verified.title}
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {texts.sealsPage.verified.description}
          </p>
        </div>
      </div>

      <Button
        variant={open ? "outline" : "default"}
        className="rounded-full gap-1.5"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? texts.sealsPage.verified.close : texts.sealsPage.verified.action}

        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </Button>

      {open && (
        <div className="space-y-3 border-t border-border-soft pt-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-strong">
              {texts.sealsPage.verified.formTitle}
            </h3>

            <p className="text-xs text-text-subtle">{texts.sealsPage.verified.formHint}</p>
          </div>

          <ContributionForm
            mode="verified"
            initial={{
              name: data.name ?? "",
              email: data.email ?? "",
              github: data.github ?? "",
            }}
            onSuccess={() => {
              setOpen(false);
              void queryClient.invalidateQueries({ queryKey: ["contributors", "me"] });
            }}
          />
        </div>
      )}
    </section>
  );
}
