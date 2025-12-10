interface DashboardStatsProps {
  stats: {
    totalTrades?: number;
    activeTrades?: number;
    totalPnL?: number;
    winRate?: number;
    activeStrategies?: number;
  } | null;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  if (!stats) {
    return null;
  }

  const totalPnL = stats.totalPnL ?? 0;
  const winRate = stats.winRate ?? 0;

  const statCards = [
    {
      label: 'Total Trades',
      value: stats.totalTrades ?? 0,
      color: 'text-blue-400',
    },
    {
      label: 'Active Trades',
      value: stats.activeTrades ?? 0,
      color: 'text-yellow-400',
    },
    {
      label: 'Total PnL',
      value: `${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} USDT`,
      color: totalPnL >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      color: winRate >= 50 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Active Strategies',
      value: stats.activeStrategies ?? 0,
      color: 'text-mexc-primary',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-mexc-secondary rounded-lg p-6 border border-gray-700"
        >
          <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
