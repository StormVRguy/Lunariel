import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

const CHANNEL_NAME = "lunariel:vigil";
const SESSION_KEY = "lunariel.vigil.session";

function getTabSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function countActiveSingers(presenceState: Record<string, unknown[]>): number {
  let count = 0;
  for (const presences of Object.values(presenceState)) {
    for (const meta of presences) {
      if ((meta as { singing?: boolean }).singing === true) count++;
    }
  }
  return count;
}

export function useVigilPresence(isKeepingVigil: boolean): number {
  const [activeSingerCount, setActiveSingerCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionIdRef = useRef(getTabSessionId());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    const sessionId = sessionIdRef.current;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: sessionId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      setActiveSingerCount(countActiveSingers(channel.presenceState()));
    });

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      if (isKeepingVigil) {
        await channel.track({ singing: true });
      }
    });

    channelRef.current = channel;

    const onPageHide = () => {
      void channel.untrack();
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      void channel.untrack();
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    if (isKeepingVigil) {
      void channel.track({ singing: true });
    } else {
      void channel.untrack();
    }
  }, [isKeepingVigil]);

  return activeSingerCount;
}
