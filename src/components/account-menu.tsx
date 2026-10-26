import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { AccountMenuProps } from "@/types/components/account/account-menu-props";
import type { ActiveIdentity } from "@/types/lib/active-identity";
import {
  Flag,
  Gavel,
  Heart,
  HeartPulse,
  KeyRound,
  LifeBuoy,
  Link2,
  LogOut,
  Mail,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Store,
  Trash2,
  User,
  Zap,
} from "lucide-react";

import {
  effectiveIdentity,
  readActiveIdentity,
  subscribeActiveIdentity,
  writeActiveIdentity,
} from "@/lib/active-identity";
import { corporateApi, profileApi } from "@/lib/api";
import { logout } from "@/lib/logout";
import { cn } from "@/lib/utils";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";

import { ChangeEmailDialog } from "./change-email-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { HealthyUsageDialog } from "./healthy-usage/healthy-usage-dialog";
import { LinkedAccountsDialog } from "./linked-accounts-dialog";
import { PushToggle } from "./push-toggle";
import { UserAvatar } from "./user-avatar";

const ITEM_CLASS =
  "flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-normal text-text-strong transition hover:bg-surface-2 disabled:opacity-50";

export function AccountMenu({ profile }: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showLinkedAccounts, setShowLinkedAccounts] = useState(false);
  const [showHealthyUsage, setShowHealthyUsage] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast } = useToast();
  const [chosenIdentity, setChosenIdentity] = useState<ActiveIdentity>(() => readActiveIdentity());

  useEffect(() => subscribeActiveIdentity(() => setChosenIdentity(readActiveIdentity())), []);

  // O perfil profissional define se a troca de identidade existe e vale.
  const { data: corporate } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => corporateApi.me(),
    enabled: menuOpen,
  });
  // Algumas sessões antigas mantêm no cache um `/me` anterior às molduras. A consulta pública
  // do próprio @ preenche somente esse detalhe visual até o cache ser renovado.
  const { data: publicProfile } = useQuery({
    queryKey: ["profile", profile.username],
    queryFn: () => profileApi.get(profile.username),
    enabled: !profile.avatarFrame,
    staleTime: 60_000,
  });
  const avatarFrame = profile.avatarFrame ?? publicProfile?.avatarFrame;
  const identity = effectiveIdentity(chosenIdentity, corporate);
  const chooseIdentity = (next: ActiveIdentity) => {
    writeActiveIdentity(next);
    setChosenIdentity(next);
  };

  const openChangeEmail = () => {
    setMenuOpen(false);
    setShowChangeEmail(true);
  };

  const openChangePassword = () => {
    setMenuOpen(false);
    setShowChangePassword(true);
  };

  const openLinkedAccounts = () => {
    setMenuOpen(false);
    setShowLinkedAccounts(true);
  };

  const openHealthyUsage = () => {
    setMenuOpen(false);
    setShowHealthyUsage(true);
  };

  const openDeleteAccount = () => {
    setMenuOpen(false);
    setShowDeleteAccount(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    if (await logout()) return;
    setLoggingOut(false);
    toast(texts.account.menu.logoutFailed, "error", {
      label: texts.account.menu.logoutRetry,
      onClick: () => void handleLogout(),
    });
  };

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full pr-3 transition hover:bg-surface-2"
            aria-label={texts.account.menu.trigger}
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-visible">
              <UserAvatar
                frame={avatarFrame}
                src={profile.avatar}
                alt={profile.name}
                className="h-8 w-8"
              />
            </span>

            <span className="hidden text-sm font-normal text-text-strong sm:inline">
              {texts.common.profile}
            </span>
          </button>
        </PopoverTrigger>

        {/* A aba já tem MUITAS opções: a lista rola por dentro (flex + min-h-0), com o cabeçalho
            e as ações destrutivas sempre à vista. Sem isso o fim do menu ficava fora da tela. */}
        <PopoverContent
          align="end"
          className="flex max-h-[min(80dvh,44rem)] w-[min(calc(100vw-2rem),17rem)] flex-col overflow-hidden rounded-2xl border-border-soft bg-surface-card p-0 shadow-card"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-border-soft px-4 py-3">
            <UserAvatar
              frame={avatarFrame}
              src={profile.avatar}
              alt={profile.name}
              className="h-9 w-9"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-strong">{profile.name}</p>

              <p className="truncate text-xs text-text-subtle">{profile.email}</p>
            </div>
          </div>

          {/* Identidade ativa: só aparece quando há perfil profissional (a escolha é de
              interface; o backend decide a autoria de cada publicação). */}
          {corporate?.exists && (
            <div className="border-b border-border-soft px-4 py-2">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-subtle">
                {texts.account.menu.identity}
              </p>

              <div className="flex rounded-full border border-border-soft p-0.5">
                {(["SOCIAL", "CORPORATE"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={option === "CORPORATE" && corporate.status !== "ACTIVE"}
                    onClick={() => chooseIdentity(option)}
                    className={cn(
                      "flex-1 rounded-full px-2 py-1 text-xs font-medium transition disabled:opacity-40",
                      identity === option
                        ? "bg-primary text-primary-foreground"
                        : "text-text-subtle hover:text-text-strong",
                    )}
                  >
                    {option === "SOCIAL"
                      ? texts.account.menu.socialIdentity
                      : texts.account.menu.corporateIdentity}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
            <Link
              to="/perfil/$username"
              params={{ username: profile.username }}
              onClick={() => setMenuOpen(false)}
              className={ITEM_CLASS}
            >
              <User className="h-4 w-4" />

              <>{texts.account.menu.profile}</>
            </Link>

            <Link to="/profissional" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <User className="h-4 w-4" />

              <>{texts.account.menu.corporateProfile}</>
            </Link>

            <Link to="/carteira" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <Zap className="h-4 w-4" />

              <>{texts.account.menu.wallet}</>
            </Link>

            <Link to="/marketplace" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <Store className="h-4 w-4" />

              <>Marketplace</>
            </Link>

            <button type="button" onClick={openChangeEmail} className={ITEM_CLASS}>
              <Mail className="h-4 w-4" />

              <>{texts.account.menu.changeEmail}</>
            </button>

            <Link to="/suporte" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <LifeBuoy className="h-4 w-4" />

              <>{texts.account.menu.support}</>
            </Link>

            <Link to="/seguranca" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <ShieldCheck className="h-4 w-4" />

              <>{texts.account.menu.security}</>
            </Link>

            <Link to="/bloqueados" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <ShieldOff className="h-4 w-4" />

              <>{texts.account.menu.blockedUsers}</>
            </Link>

            <Link to="/denuncias" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <Flag className="h-4 w-4" />

              <>{texts.account.menu.myReports}</>
            </Link>

            <Link to="/penalidades" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <ShieldAlert className="h-4 w-4" />

              <>{texts.account.menu.sanctions}</>
            </Link>

            <button type="button" onClick={openChangePassword} className={ITEM_CLASS}>
              <KeyRound className="h-4 w-4" />

              <>{texts.account.menu.changePassword}</>
            </button>

            <button type="button" onClick={openLinkedAccounts} className={ITEM_CLASS}>
              <Link2 className="h-4 w-4" />

              <>{texts.account.menu.linkedAccounts}</>
            </button>

            <button type="button" onClick={openHealthyUsage} className={ITEM_CLASS}>
              <HeartPulse className="h-4 w-4" />

              <>{texts.account.menu.healthyUsage}</>
            </button>

            <Link to="/responsavel" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <ShieldCheck className="h-4 w-4" />

              <>{texts.account.menu.guardian}</>
            </Link>

            <Link to="/moderador" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <Gavel className="h-4 w-4" />

              <>{texts.account.menu.moderator}</>
            </Link>

            <PushToggle onClose={() => setMenuOpen(false)} />

            <Link to="/apoiar" onClick={() => setMenuOpen(false)} className={ITEM_CLASS}>
              <Heart className="h-4 w-4 text-primary" />

              <span className="text-primary">{texts.account.menu.apoie}</span>
            </Link>
          </div>

          <div className="shrink-0 border-t border-border-soft py-1">
            <button
              type="button"
              onClick={openDeleteAccount}
              className={cn(ITEM_CLASS, "text-destructive hover:text-destructive")}
            >
              <Trash2 className="h-4 w-4" />

              <>{texts.account.menu.deleteAccount}</>
            </button>
          </div>

          <div className="shrink-0 border-t border-border-soft py-1">
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className={cn(ITEM_CLASS, "text-destructive hover:text-destructive")}
            >
              <LogOut className="h-4 w-4" />

              <>{loggingOut ? texts.account.menu.loggingOut : texts.account.menu.logout}</>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <ChangeEmailDialog
        open={showChangeEmail}
        onOpenChange={setShowChangeEmail}
        currentEmail={profile.email}
      />
      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
      <DeleteAccountDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount} />
      <LinkedAccountsDialog open={showLinkedAccounts} onOpenChange={setShowLinkedAccounts} />
      <HealthyUsageDialog open={showHealthyUsage} onOpenChange={setShowHealthyUsage} />
    </>
  );
}
