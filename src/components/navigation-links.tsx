import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";

import { COMMUNITY_FAVORITES_KEY } from "@/constants/community-favorites";
import { texts } from "@/texts";
import type { NavigationLinksProps } from "@/types/components/navigation/navigation-links-props";
import { Star } from "lucide-react";

import { communitiesApi } from "@/lib/api";
import { hasSessionFlag } from "@/lib/session";
import { useDisabledModules } from "@/lib/use-personalization";
import { cn } from "@/lib/utils";

import { navigationItems } from "./navigation-items";

export function NavigationLinks({
  collapsed = false,
  onNavigate,
  className,
}: NavigationLinksProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  // Módulos desativados nas preferências: a entrada some do menu (fonte única no backend).
  const disabledModules = useDisabledModules();

  // Comunidades do usuário no menu: sem isso a pessoa só encontrava as suas indo em /comunidades
  // e procurando na lista.
  const { data: mine } = useQuery({
    queryKey: ["my-communities"],
    queryFn: () => communitiesApi.mine(8),
    enabled: hasSessionFlag(),
    staleTime: 30_000,
  });
  const myCommunities = mine?.items ?? [];

  const { data: favorites } = useQuery({
    queryKey: COMMUNITY_FAVORITES_KEY,
    queryFn: () => communitiesApi.favorites(),
    enabled: hasSessionFlag(),
    staleTime: 30_000,
  });
  const favoriteCommunities = favorites?.items ?? [];

  return (
    <nav
      data-collapsed={collapsed}
      className={cn("group/navigation flex flex-col gap-1", className)}
    >
      {navigationItems
        .filter((item) => !item.module || !disabledModules.has(item.module))
        .map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                // py-3 no toque (gaveta do celular); no desktop o menu inteiro precisa caber sem rolar.
                "flex items-center gap-3 rounded-xl border-l-2 px-3 py-3 text-sm font-normal transition lg:py-2",
                "group-data-[collapsed=true]/navigation:justify-center group-data-[collapsed=true]/navigation:gap-0 group-data-[collapsed=true]/navigation:px-0",
                active
                  ? "border-primary bg-surface-2 text-primary"
                  : "border-transparent text-text-subtle hover:bg-surface-3 hover:text-text-strong",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors lg:h-4 lg:w-4",
                  active && "text-primary",
                )}
              />

              <span className="whitespace-nowrap transition-all duration-300 group-data-[collapsed=true]/navigation:w-0 group-data-[collapsed=true]/navigation:overflow-hidden group-data-[collapsed=true]/navigation:opacity-0">
                {item.label}
              </span>
            </Link>
          );
        })}

      {!collapsed && myCommunities.length > 0 && (
        <div className="mt-1 space-y-0.5">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-text-subtle">
            {texts.communities.myTitle}
          </p>

          {myCommunities.map((community) => (
            <Link
              key={community.id}
              to="/comunidades/$communityId"
              params={{ communityId: community.id }}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-normal text-text-subtle transition hover:bg-surface-3 hover:text-text-strong"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />

              <span className="truncate">{community.name}</span>
            </Link>
          ))}
        </div>
      )}

      {!collapsed && favoriteCommunities.length > 0 && (
        <div className="mt-1 space-y-0.5">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-text-subtle">
            {texts.communities.favoritesTitle}
          </p>

          {favoriteCommunities.map((community) => (
            <Link
              key={community.id}
              to="/comunidades/$communityId"
              params={{ communityId: community.id }}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-normal text-text-subtle transition hover:bg-surface-3 hover:text-text-strong"
            >
              <Star className="h-3.5 w-3.5 shrink-0 text-primary" />

              <span className="truncate">{community.name}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
