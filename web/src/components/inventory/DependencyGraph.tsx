import { useMemo } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, MarkerType,
  type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface AssetLite { id: string; asset_name: string; asset_type: string; service_name: string | null; }
interface DepLite {
  id: string;
  source_id: string | null;
  source_label: string;
  target_id: string | null;
  target_label: string;
}

interface Props {
  assets: AssetLite[];
  deps: DepLite[];
  de: boolean;
}

export default function DependencyGraph({ assets, deps, de }: Props) {
  const { nodes, edges } = useMemo(() => {
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

    const inboundCount: Record<string, number> = {};
    deps.forEach((d) => {
      if (d.target_id) inboundCount[d.target_id] = (inboundCount[d.target_id] ?? 0) + 1;
    });

    const visibleAssetIds = new Set<string>();
    deps.forEach((d) => {
      if (d.source_id) visibleAssetIds.add(d.source_id);
      if (d.target_id) visibleAssetIds.add(d.target_id);
    });

    const assetNodes: Node[] = assets
      .filter((asset) => visibleAssetIds.has(asset.id))
      .map((asset, index) => {
        const inbound = inboundCount[asset.id] ?? 0;
        const highlight = inbound >= 3;
        const column = index % 3;
        const row = Math.floor(index / 3);
      return {
        id: `a:${asset.id}`,
        type: "default",
        position: { x: 60 + column * 280, y: 50 + row * 130 },
        data: {
          label: (
            <div className="text-left">
              <div className="font-semibold text-xs">{asset.asset_name}</div>
              <div className="text-[10px] opacity-70">
                {asset.asset_type}{asset.service_name ? ` · ${asset.service_name}` : ""}
                {inbound > 1 ? ` · ${inbound}×` : ""}
              </div>
              {highlight && (
                <div className="text-[10px] font-bold" style={{ color: "hsl(var(--destructive))" }}>
                  {de ? "Konzentration" : "Concentration"}
                </div>
              )}
            </div>
          ) as any,
        },
        style: {
          background: "hsl(var(--card))",
          border: `2px solid ${highlight ? "hsl(var(--destructive))" : "hsl(var(--primary))"}`,
          borderRadius: 10,
          padding: 10,
          width: 220,
          color: "hsl(var(--foreground))",
          boxShadow: highlight ? "0 0 0 3px hsl(var(--destructive) / 0.15)" : undefined,
        },
        sourcePosition: "right" as any,
        targetPosition: "left" as any,
      };
    });

    const flowEdges: Edge[] = deps
      .filter((d) => d.source_id && d.target_id && assetMap.has(d.source_id) && assetMap.has(d.target_id))
      .map((d) => {
        const color = "hsl(var(--accent))";
        return {
          id: d.id,
          source: `a:${d.source_id}`,
          target: `a:${d.target_id}`,
          animated: false,
          style: { stroke: color, strokeWidth: 1.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        };
      });

    return { nodes: assetNodes, edges: flowEdges };
  }, [assets, deps, de]);

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        {de
          ? "Keine Asset-Abhängigkeiten mit Quell- und Ziel-Asset vorhanden."
          : "No asset dependencies with source and target assets yet."}
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg border bg-card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          className="!bg-background border border-border rounded"
          nodeColor={(n) => (String(n.id).startsWith("s:") ? "hsl(var(--primary))" : "hsl(var(--accent))")}
        />
      </ReactFlow>
    </div>
  );
}
