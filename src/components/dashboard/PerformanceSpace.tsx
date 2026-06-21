"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, BarChart2, Target, Award, ArrowUpRight, 
  Sparkles, CheckCircle, Zap, RefreshCw
} from "lucide-react";
import { analyticsApi, recommendationsApi, flattenAnalyticsMetric, flattenRecommendation, AnalyticsMetric, AIRecommendation } from "@/lib/services/pulseforge-service";

function calcChange(data: AnalyticsMetric[], key: keyof AnalyticsMetric): number {
  if (data.length < 4) return 0;
  const mid = Math.floor(data.length / 2);
  const first = data.slice(0, mid);
  const second = data.slice(mid);
  const sumFirst = first.reduce((a, d) => a + (d[key] as number), 0);
  const sumSecond = second.reduce((a, d) => a + (d[key] as number), 0);
  if (sumFirst === 0) return 0;
  return parseFloat((((sumSecond - sumFirst) / sumFirst) * 100).toFixed(1));
}

export default function PerformanceSpace() {
  const [daysCount, setDaysCount] = useState<7 | 30>(7);
  const [data, setData] = useState<AnalyticsMetric[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [appliedRecs, setAppliedRecs] = useState<string[]>([]);
  const [activeMetric, setActiveMetric] = useState<'impressions' | 'clicks' | 'engagement'>('impressions');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [analyticsRes, recs] = await Promise.all([
          analyticsApi.get(daysCount),
          recommendationsApi.list(),
        ]);
        if (!cancelled) {
          setData(analyticsRes.timeseries.map(flattenAnalyticsMetric));
          setRecommendations(recs.map(flattenRecommendation));
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur lors du chargement des données");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [daysCount, refreshKey]);

  const totalImpressions = data.reduce((acc, curr) => acc + curr.impressions, 0);
  const totalClicks = data.reduce((acc, curr) => acc + curr.clicks, 0);
  const totalEngagement = data.reduce((acc, curr) => acc + curr.engagement, 0);
  const avgCtr = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;
  const changeImpressions = calcChange(data, "impressions");
  const changeClicks = calcChange(data, "clicks");
  const changeEngagement = calcChange(data, "engagement");
  const changeCtr = calcChange(data, "ctr");

  const maxVal = Math.max(...data.map(d => d[activeMetric]), 1);
  const minVal = Math.min(...data.map(d => d[activeMetric]), 0);
  const valRange = maxVal - minVal || 1;
  const width = 600;
  const height = 200;
  const padding = 20;

  const points = data.map((d, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((d[activeMetric] - minVal) / valRange) * (height - padding * 2);
    return { x, y, label: d.date, value: d[activeMetric] };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : "";

  const handleApplyRecommendation = async (id: string) => {
    setApplying(id);
    try {
      await recommendationsApi.apply(id);
      setAppliedRecs(prev => [...prev, id]);
      setTimeout(() => {
        setRecommendations(prev => prev.filter(r => r.id !== id));
      }, 1000);
    } catch {
    } finally {
      setApplying(null);
    }
  };

  const formatChange = (val: number) => {
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val}%`;
  };

  const changeColor = (val: number) => val >= 0 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Analytics & Optimisations IA</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Suivez les performances de diffusion de votre marque et appliquez les recommandations de la boucle d&apos;apprentissage PulseForge.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setDaysCount(7)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${daysCount === 7 ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              7 derniers jours
            </button>
            <button
              type="button"
              onClick={() => setDaysCount(30)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${daysCount === 30 ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              30 derniers jours
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Chargement des données...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setActiveMetric('impressions')}
              className={`glass-panel p-5 rounded-2xl text-left border transition cursor-pointer ${activeMetric === 'impressions' ? 'border-primary bg-primary/5' : 'border-zinc-800/80 hover:border-zinc-700'}`}
            >
              <div className="flex justify-between items-center text-zinc-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Impressions</span>
                <BarChart2 className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalImpressions.toLocaleString('fr-FR')}</span>
                <span className={`text-[11px] font-semibold flex items-center ${changeColor(changeImpressions)}`}>
                  <TrendingUp className="h-3 w-3 mr-0.5" /> {formatChange(changeImpressions)}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">reach organique cumulé</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric('clicks')}
              className={`glass-panel p-5 rounded-2xl text-left border transition cursor-pointer ${activeMetric === 'clicks' ? 'border-primary bg-primary/5' : 'border-zinc-800/80 hover:border-zinc-700'}`}
            >
              <div className="flex justify-between items-center text-zinc-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Clics</span>
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalClicks.toLocaleString('fr-FR')}</span>
                <span className={`text-[11px] font-semibold flex items-center ${changeColor(changeClicks)}`}>
                  <TrendingUp className="h-3 w-3 mr-0.5" /> {formatChange(changeClicks)}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">visites vers vos tunnels</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveMetric('engagement')}
              className={`glass-panel p-5 rounded-2xl text-left border transition cursor-pointer ${activeMetric === 'engagement' ? 'border-primary bg-primary/5' : 'border-zinc-800/80 hover:border-zinc-700'}`}
            >
              <div className="flex justify-between items-center text-zinc-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Engagement</span>
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalEngagement.toLocaleString('fr-FR')}</span>
                <span className={`text-[11px] font-semibold flex items-center ${changeColor(changeEngagement)}`}>
                  <TrendingUp className="h-3 w-3 mr-0.5" /> {formatChange(changeEngagement)}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">likes, shares et commentaires</p>
            </button>

            <div className="glass-panel p-5 rounded-2xl text-left">
              <div className="flex justify-between items-center text-zinc-500">
                <span className="text-xs font-semibold uppercase tracking-wider">CTR Moyen</span>
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{avgCtr}%</span>
                <span className={`text-[11px] font-semibold flex items-center ${changeColor(changeCtr)}`}>
                  <TrendingUp className="h-3 w-3 mr-0.5" /> {formatChange(changeCtr)}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">taux de clics par impression</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white capitalize">
                  Courbe d'évolution : {activeMetric}
                </h3>
                <p className="text-xs text-zinc-500">Flux chronologique par jour</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="capitalize">{activeMetric}</span>
              </div>
            </div>

            {data.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                Aucune donnée analytics pour cette période.
              </div>
            ) : (
              <div className="relative w-full aspect-[3/1] min-h-[180px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const y = padding + (idx / 3) * (height - padding * 2);
                    return (
                      <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y}
                        stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    );
                  })}
                  {areaD && <path d={areaD} fill="url(#chartGradient)" />}
                  {pathD && (
                    <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  {points.map((p, idx) => (
                    <g key={idx} className="group cursor-pointer">
                      <circle cx={p.x} cy={p.y} r="4" fill="hsl(240, 10%, 4%)"
                        stroke="var(--color-primary)" strokeWidth="2" />
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <rect x={p.x - 40} y={p.y - 32} width="80" height="22" rx="4"
                          fill="rgba(15, 15, 20, 0.9)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
                        <text x={p.x} y={p.y - 17} fill="white" fontSize="10" fontFamily="monospace"
                          textAnchor="middle">{p.value.toLocaleString('fr-FR')}</text>
                      </g>
                      <text x={p.x} y={height - 2} fill="rgba(255, 255, 255, 0.3)" fontSize="9"
                        fontFamily="sans-serif" textAnchor="middle">{p.label}</text>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="h-48 w-48 text-primary" />
            </div>
            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Boucle d&apos;apprentissage IA
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Notre moteur IA analyse continuellement l'engagement de vos publications pour affiner automatiquement la voix de votre marque.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-xs text-zinc-500">
                    Toutes les recommandations IA ont été appliquées ! Le moteur recalcule lors de vos prochaines diffusions.
                  </div>
                ) : (
                  recommendations.map(rec => {
                    const isApplied = appliedRecs.includes(rec.id);
                    const isApplying = applying === rec.id;
                    return (
                      <div key={rec.id}
                        className={`bg-zinc-950/40 border p-5 rounded-xl flex flex-col justify-between space-y-4 transition-all duration-300 ${isApplied ? 'border-green-500/50 bg-green-500/5 opacity-80' : 'border-zinc-800/80 hover:border-zinc-700/80'}`}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${rec.impact === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                              Impact {rec.impact === 'high' ? 'Fort' : 'Moyen'}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono capitalize">{rec.type}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-white leading-tight">{rec.title}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{rec.description}</p>
                        </div>
                        <button
                          type="button"
                          disabled={isApplied || isApplying}
                          onClick={() => handleApplyRecommendation(rec.id)}
                          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${isApplied ? 'bg-green-500/20 text-green-400 cursor-default' : isApplying ? 'bg-primary/50 text-white cursor-wait' : 'bg-primary hover:bg-opacity-90 text-white'}`}
                        >
                          {isApplied ? (
                            <><CheckCircle className="h-4.5 w-4.5" /> Appliqué avec succès</>
                          ) : isApplying ? (
                            <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Application...</>
                          ) : (
                            <><Zap className="h-3.5 w-3.5" /> {rec.actionLabel}</>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
