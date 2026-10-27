import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ContributionFormProps } from "@/types/components/contribution-form-props";
import { CheckCircle2, Loader2 } from "lucide-react";

import { ApiError, contributorsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AREAS = [
  ["ENGENHARIA", texts.landing.contribute.areas.engineering],
  ["DESIGN", texts.landing.contribute.areas.design],
  ["PRODUTO", texts.landing.contribute.areas.product],
  ["DADOS", texts.landing.contribute.areas.data],
  ["INFRA", texts.landing.contribute.areas.infra],
  ["DOCUMENTACAO", texts.landing.contribute.areas.docs],
  ["COMUNIDADE", texts.landing.contribute.areas.community],
  ["OUTRO", texts.landing.contribute.areas.other],
] as const;

const EXPERIENCES = [
  ["INICIANTE", texts.landing.contribute.experiences.beginner],
  ["INTERMEDIARIO", texts.landing.contribute.experiences.intermediate],
  ["AVANCADO", texts.landing.contribute.experiences.advanced],
  ["MANTENEDOR", texts.landing.contribute.experiences.maintainer],
] as const;

/**
 * Formulário público de contribuição. A landing é aberta, então ele não pede conta: grava a
 * candidatura e o aceite dos termos para a fila interna de documentação do projeto.
 */
export function ContributionForm({
  mode = "landing",
  initial,
  onSuccess,
}: ContributionFormProps = {}) {
  const verified = mode === "verified";
  const [name, setName] = useState(initial?.name ?? "");
  const [github, setGithub] = useState(initial?.github ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [area, setArea] = useState("");
  const [experience, setExperience] = useState("");
  const [message, setMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setName("");
    setGithub("");
    setEmail("");
    setArea("");
    setExperience("");
    setMessage("");
    setAcceptedTerms(false);
    setErrors({});
    setFormError(null);
    setSent(false);
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = texts.landing.contribute.validationName;
    if (!github.trim()) next.github = texts.landing.contribute.validationGithub;
    if (!EMAIL_PATTERN.test(email.trim())) next.email = texts.landing.contribute.validationEmail;
    if (!acceptedTerms) next.acceptedTerms = texts.landing.contribute.validationTerms;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSending(true);
    try {
      const payload = {
        name: name.trim(),
        github: github.trim(),
        email: email.trim(),
        area: area || undefined,
        experience: experience || undefined,
        message: message.trim() || undefined,
        acceptedTerms,
      };
      if (verified) {
        await contributorsApi.applyVerified(payload);
      } else {
        await contributorsApi.apply(payload);
      }
      setSent(true);
      onSuccess?.();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : texts.landing.contribute.error);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="py-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />

        <h3 className="mt-3 text-lg font-semibold tracking-tight">
          {verified
            ? texts.landing.contribute.verifiedSuccessTitle
            : texts.landing.contribute.successTitle}
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {verified
            ? texts.landing.contribute.verifiedSuccessDescription
            : texts.landing.contribute.successDescription}
        </p>

        {!verified && (
          <Button variant="outline" className="mt-6 rounded-full" onClick={reset}>
            {texts.landing.contribute.again}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contributor-name">{texts.landing.contribute.fields.name}</Label>

          <Input
            id="contributor-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={texts.landing.contribute.fields.namePlaceholder}
            maxLength={120}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contributor-github">{texts.landing.contribute.fields.github}</Label>

          <Input
            id="contributor-github"
            value={github}
            onChange={(event) => setGithub(event.target.value)}
            placeholder={texts.landing.contribute.fields.githubPlaceholder}
            maxLength={120}
            readOnly={verified}
            aria-readonly={verified}
          />
          {verified && (
            <p className="text-xs text-text-subtle">
              {texts.landing.contribute.verifiedGithubHint}
            </p>
          )}
          {errors.github && <p className="text-xs text-destructive">{errors.github}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contributor-email">{texts.landing.contribute.fields.email}</Label>

          <Input
            id="contributor-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={texts.landing.contribute.fields.emailPlaceholder}
            maxLength={180}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contributor-area">{texts.landing.contribute.fields.area}</Label>

          <select
            id="contributor-area"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
          >
            <option value="">{texts.landing.contribute.fields.areaPlaceholder}</option>

            {AREAS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contributor-experience">
            {texts.landing.contribute.fields.experience}
          </Label>

          <select
            id="contributor-experience"
            value={experience}
            onChange={(event) => setExperience(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
          >
            <option value="">{texts.landing.contribute.fields.experiencePlaceholder}</option>

            {EXPERIENCES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contributor-message">{texts.landing.contribute.fields.message}</Label>

        <Textarea
          id="contributor-message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={texts.landing.contribute.fields.messagePlaceholder}
          maxLength={2000}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-primary"
        />

        <span>
          {texts.landing.contribute.termsPrefix}

          <Link to="/termos" className="text-primary hover:underline">
            {texts.landing.contribute.termsLink}
          </Link>

          {texts.landing.contribute.termsSuffix}
        </span>
      </label>
      {errors.acceptedTerms && <p className="text-xs text-destructive">{errors.acceptedTerms}</p>}

      {formError && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button className="w-full rounded-full" disabled={sending} onClick={submit}>
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            <>{texts.landing.contribute.sending}</>
          </>
        ) : verified ? (
          texts.landing.contribute.confirm
        ) : (
          texts.landing.contribute.submit
        )}
      </Button>
    </div>
  );
}
