import { useStatsStore } from "@/stores/useStatStore";
import { Library, ListMusic, PlayCircle } from "lucide-react";
import StatsCard from "./StatsCard";

const DashboardStats = ({ artistId }: { artistId: string }) => {
  const { artistStats } = useStatsStore();
  console.log(artistStats);
  const statsData = artistStats[artistId]
    ? [
        {
          icon: ListMusic,
          label: "Total Songs",
          value:
            artistStats[artistId].totalSongs !== undefined
              ? artistStats[artistId].totalSongs.toString()
              : "0",
          bgColor: "bg-emerald-500/10",
          iconColor: "text-emerald-500",
        },
        {
          icon: Library,
          label: "Total Albums",
          value:
            artistStats[artistId].totalAlbums !== undefined
              ? artistStats[artistId].totalAlbums.toString()
              : "0",
          bgColor: "bg-violet-500/10",
          iconColor: "text-violet-500",
        },
        {
          icon: PlayCircle,
          label: "Total Singles",
          value:
            artistStats[artistId].totalSingles !== undefined
              ? artistStats[artistId].totalSingles.toString()
              : "0",
          bgColor: "bg-pink-500/10",
          iconColor: "text-pink-500",
        },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {statsData.map((stat) => (
        <StatsCard
          key={stat.label}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          bgColor={stat.bgColor}
          iconColor={stat.iconColor}
        />
      ))}
    </div>
  );
};

export default DashboardStats;
