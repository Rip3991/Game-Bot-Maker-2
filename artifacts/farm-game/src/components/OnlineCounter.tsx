import React from 'react';
import { motion } from 'framer-motion';
import { useGetOnlineStats, getGetOnlineStatsQueryKey } from '@workspace/api-client-react';

export function OnlineCounter() {
  const { data } = useGetOnlineStats({
    query: {
      queryKey: getGetOnlineStatsQueryKey(),
      refetchInterval: 30_000,
    },
  });

  // Small pulse dot to indicate live data
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1.5 border border-white/10"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span className="text-[11px] font-black text-green-300 tabular-nums">
        {data?.onlineCount ?? '...'} çevrimiçi
      </span>
    </motion.div>
  );
}
