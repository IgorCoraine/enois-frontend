import { useEffect, useMemo, useState } from "react";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { MonitoringSection as MonitoringSectionView } from "@rede-enois/design-system/domain";

import { monitoringApi } from "@/lib/api";
import { hora, valorDeDataLocal } from "@/lib/date/format";
import { formatFaisca } from "@/lib/faisca";

const LEVELS = ["ERROR", "WARN", "INFO", "DEBUG"];

/**
 * Monitorabilidade do painel admin: KPIs, séries por minuto e a lista de eventos/logs/erros.
 * O backend já entrega tudo pronto; aqui só desenhamos os gráficos em SVG (sem lib) e atualizamos
 * por polling curto, que é o "tempo real" sem manter uma conexão SSE aberta por admin.
 */
export function MonitoringSection() {
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  // Intervalo de tempo dos eventos: guardamos o valor cru do campo datetime-local
  // e convertemos para ISO só na consulta.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const overview = useQuery({
    queryKey: ["monitoring", "overview"],
    queryFn: () => monitoringApi.overview(),
    refetchInterval: paused ? false : 2_500,
    retry: false,
  });

  // Supply da moeda: só administração tem acesso; para os demais o cartão simplesmente não aparece.
  const supply = useQuery({
    queryKey: ["monitoring", "supply"],
    queryFn: () => monitoringApi.supply(),
    refetchInterval: paused ? false : 30_000,
    retry: false,
  });

  const filtered = Boolean(level || type || debounced || from || to);
  const events = useInfiniteQuery({
    queryKey: ["monitoring", "events", level, type, debounced, from, to],
    queryFn: ({ pageParam }) =>
      monitoringApi.events({
        level: level || undefined,
        type: type || undefined,
        q: debounced || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        before: pageParam || undefined,
        limit: 100,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length >= 100 ? (lastPage[lastPage.length - 1]?.createdAt ?? undefined) : undefined,
    enabled: filtered,
    refetchInterval: paused ? false : 3_000,
    retry: false,
  });

  const data = overview.data;
  const rows = (filtered ? (events.data?.pages.flat() ?? []) : (data?.recent ?? [])).map(
    (event) => ({ ...event, timeLabel: hora(event.createdAt) }),
  );
  const types = useMemo(() => data?.types24h.map((item) => item.label) ?? [], [data]);

  return (
    <MonitoringSectionView
      loading={overview.isLoading}
      overview={data}
      fetching={overview.isFetching}
      onRefresh={() => void overview.refetch()}
      generatedAtLabel={data ? hora(data.generatedAt) : ""}
      supply={
        supply.data && {
          totalLabel: formatFaisca(supply.data.total),
          cofreLabel: formatFaisca(supply.data.cofre),
          circulacaoLabel: formatFaisca(supply.data.circulacao),
          coerente: supply.data.coerente,
        }
      }
      paused={paused}
      onTogglePaused={() => setPaused((value) => !value)}
      levels={LEVELS}
      level={level}
      onLevelChange={setLevel}
      types={types}
      type={type}
      onTypeChange={setType}
      search={search}
      onSearchChange={setSearch}
      from={from}
      to={to}
      onFromChange={setFrom}
      onToChange={setTo}
      onLastHour={() => {
        setFrom(valorDeDataLocal(new Date(Date.now() - 3_600_000)));
        setTo("");
      }}
      onClearDates={() => {
        setFrom("");
        setTo("");
      }}
      onlyFailures={level === "ERROR"}
      onOnlyFailures={() => {
        setLevel("ERROR");
        setType("");
        setSearch("");
      }}
      filtered={filtered}
      rows={rows}
      hasNextPage={events.hasNextPage}
      fetchingNextPage={events.isFetchingNextPage}
      onLoadMore={() => void events.fetchNextPage()}
    />
  );
}
