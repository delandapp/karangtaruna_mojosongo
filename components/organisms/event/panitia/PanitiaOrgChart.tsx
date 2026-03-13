"use client";

import { useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  Handle,
  Position,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
// @ts-ignore
import dagre from "dagre";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  Trash2,
  MoreHorizontal,
  UserCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  type AnggotaPanitia,
  type DivisiPanitia,
} from "@/features/api/panitiaApi";

// ── Types ────────────────────────────────────────────────────────────────────
interface PanitiaNodeData extends Record<string, unknown> {
  id: number;
  user_id: number;
  event_id: number;
  divisi: DivisiPanitia;
  posisi: string;
  is_aktif: boolean;
  deskripsi_tugas?: string | null;
  bergabung_pada: string;
  user?: { id: number; nama_lengkap: string; username: string };
  jabatan?: { id: number; nama_jabatan: string } | null;
  m_jabatan_id?: number | null;
  onEdit: (member: AnggotaPanitia) => void;
  onDelete: (member: AnggotaPanitia) => void;
}

interface DivisiHeaderData extends Record<string, unknown> {
  label: string;
  color: string;
  count: number;
}

interface PanitiaOrgChartProps {
  panitia: AnggotaPanitia[];
  onEdit: (member: AnggotaPanitia) => void;
  onDelete: (member: AnggotaPanitia) => void;
}

// ── Divisi Config ────────────────────────────────────────────────────────────
const DIVISI_CONFIG: Record<
  DivisiPanitia,
  { label: string; color: string; gradient: string }
> = {
  acara: {
    label: "Acara",
    color: "#6366f1",
    gradient: "from-indigo-500/20 to-indigo-600/10",
  },
  logistik: {
    label: "Logistik",
    color: "#f59e0b",
    gradient: "from-amber-500/20 to-amber-600/10",
  },
  humas: {
    label: "Humas",
    color: "#10b981",
    gradient: "from-emerald-500/20 to-emerald-600/10",
  },
  konsumsi: {
    label: "Konsumsi",
    color: "#ec4899",
    gradient: "from-pink-500/20 to-pink-600/10",
  },
  keamanan: {
    label: "Keamanan",
    color: "#ef4444",
    gradient: "from-red-500/20 to-red-600/10",
  },
  dokumentasi: {
    label: "Dokumentasi",
    color: "#8b5cf6",
    gradient: "from-violet-500/20 to-violet-600/10",
  },
  dekorasi: {
    label: "Dekorasi",
    color: "#14b8a6",
    gradient: "from-teal-500/20 to-teal-600/10",
  },
  transportasi: {
    label: "Transportasi",
    color: "#3b82f6",
    gradient: "from-blue-500/20 to-blue-600/10",
  },
  lainnya: {
    label: "Lainnya",
    color: "#6b7280",
    gradient: "from-gray-500/20 to-gray-600/10",
  },
};

// ── Custom: Divisi Header Node ────────────────────────────────────────────────
function DivisiNode({ data }: { data: DivisiHeaderData }) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl border-2 px-5 py-3 shadow-lg backdrop-blur-sm w-[280px]"
      style={{
        borderColor: data.color,
        background: `linear-gradient(135deg, ${data.color}22, ${data.color}0a)`,
      }}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: data.color, width: 8, height: 8 }}
      />
      <span
        className="text-sm font-bold tracking-wide"
        style={{ color: data.color }}
      >
        {data.label}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {data.count} anggota
      </span>
    </div>
  );
}

// ── Custom: Panitia Member Node ───────────────────────────────────────────────
function PanitiaNode({ data }: { data: PanitiaNodeData }) {
  const divisiConf = DIVISI_CONFIG[data.divisi] ?? DIVISI_CONFIG.lainnya;
  const isKoordinator = data.posisi === "Koordinator";
  const isAktif = data.is_aktif;

  const toAnggota = (): AnggotaPanitia => ({
    id: data.id,
    event_id: data.event_id,
    user_id: data.user_id,
    m_jabatan_id: data.m_jabatan_id as number | null | undefined,
    divisi: data.divisi,
    posisi: data.posisi as "Koordinator" | "Anggota",
    deskripsi_tugas: data.deskripsi_tugas,
    is_aktif: data.is_aktif,
    bergabung_pada: data.bergabung_pada,
    user: data.user,
    jabatan: data.jabatan,
  });

  return (
    <div
      className={`relative rounded-xl shadow-md transition-all hover:shadow-lg ${
        isAktif ? "bg-card/90" : "bg-muted/50 opacity-70"
      } ${isKoordinator ? "border-2" : "border"}`}
      style={{
        borderColor: isKoordinator ? divisiConf.color : undefined,
        minWidth: 200,
        maxWidth: 220,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: divisiConf.color, width: 8, height: 8 }}
      />
      {isKoordinator && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: divisiConf.color, width: 8, height: 8 }}
        />
      )}

      {/* Header bar */}
      <div
        className={`rounded-t-[11px] bg-linear-to-r ${divisiConf.gradient} px-3 py-2 flex items-center justify-between`}
      >
        <div className="flex items-center gap-1.5">
          {isKoordinator ? (
            <ShieldCheck
              className="h-3.5 w-3.5"
              style={{ color: divisiConf.color }}
            />
          ) : (
            <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <Badge
            variant={isKoordinator ? "default" : "secondary"}
            className="h-5 text-[10px] px-1.5"
            style={isKoordinator ? { backgroundColor: divisiConf.color } : {}}
          >
            {data.posisi}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                data.onEdit(toAnggota());
              }}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete(toAnggota());
              }}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-1">
        <p className="text-sm font-semibold leading-tight truncate text-foreground">
          {data.user?.nama_lengkap ?? `User #${data.user_id}`}
        </p>
        {data.jabatan && (
          <p className="text-[11px] text-muted-foreground truncate">
            {data.jabatan.nama_jabatan}
          </p>
        )}
        {data.deskripsi_tugas && (
          <p className="text-[10px] text-muted-foreground/70 line-clamp-2 mt-1 leading-relaxed">
            {data.deskripsi_tugas}
          </p>
        )}
        {!isAktif && (
          <span className="inline-block text-[10px] font-medium text-amber-600 bg-amber-100/60 dark:bg-amber-900/20 rounded px-1.5 py-0.5">
            Tidak Aktif
          </span>
        )}
      </div>
    </div>
  );
}

// ── Custom: Spacer Node (Invisible Hub) ──────────────────────────────────────
function SpacerNode({ data }: { data: any }) {
  return (
    <div
      style={{
        width: 2,
        height: 2,
        backgroundColor: data?.color || "transparent",
      }}
      className="pointer-events-none relative"
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ top: 0, width: 0, height: 0, border: "none", minWidth: 0, minHeight: 0 }}
        className="opacity-0 bg-transparent p-0! m-0!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ bottom: 0, width: 0, height: 0, border: "none", minWidth: 0, minHeight: 0 }}
        className="opacity-0 bg-transparent p-0! m-0!"
      />
    </div>
  );
}

// ── Node Types ────────────────────────────────────────────────────────────────
const nodeTypes: NodeTypes = {
  divisi: DivisiNode as any,
  panitia: PanitiaNode as any,
  spacer: SpacerNode as any,
};

// ── Layout Algorithm using Dagre ──────────────────────────────────────────────
const nodeWidth = 280;
const nodeHeight = 130;
const headerWidth = 280;
const headerHeight = 80;

function buildGraph(
  panitia: AnggotaPanitia[],
  onEdit: (m: AnggotaPanitia) => void,
  onDelete: (m: AnggotaPanitia) => void,
): { nodes: Node[]; edges: Edge[] } {
  // 1. Setup Dagre Graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const divisiMap = new Map<DivisiPanitia, AnggotaPanitia[]>();
  for (const member of panitia) {
    const list = divisiMap.get(member.divisi) ?? [];
    list.push(member);
    divisiMap.set(member.divisi, list);
  }

  // 2. Build Nodes & Edges logically
  for (const [divisi, members] of divisiMap.entries()) {
    const conf = DIVISI_CONFIG[divisi] ?? DIVISI_CONFIG.lainnya;
    const headerId = `divisi-${divisi}`;

    // Add Header Node
    initialNodes.push({
      id: headerId,
      type: "divisi",
      position: { x: 0, y: 0 },
      data: {
        label: conf.label,
        color: conf.color,
        count: members.length,
      } as DivisiHeaderData,
    });

    // Sort: Koordinator first, then Anggota
    const sorted = [...members].sort((a, b) => {
      if (a.posisi === "Koordinator" && b.posisi !== "Koordinator") return -1;
      if (a.posisi !== "Koordinator" && b.posisi === "Koordinator") return 1;
      return 0;
    });

    const koordinators = sorted.filter((m) => m.posisi === "Koordinator");
    const anggotas = sorted.filter((m) => m.posisi !== "Koordinator");

    // Add Panitia Nodes
    for (const member of sorted) {
      const nodeId = `panitia-${member.id}`;
      const nodeData: PanitiaNodeData = { ...member, onEdit, onDelete };
      initialNodes.push({
        id: nodeId,
        type: "panitia",
        position: { x: 0, y: 0 },
        data: nodeData,
      });
    }

    // Connect Header -> Koordinators (or directly to Anggota if no koordinators)
    if (koordinators.length > 0) {
      // 1. Header -> Koordinators
      for (const koord of koordinators) {
        initialEdges.push({
          id: `e-${headerId}-${koord.id}`,
          source: headerId,
          target: `panitia-${koord.id}`,
          type: "step",
          animated: false,
          style: { stroke: conf.color, strokeWidth: 2 },
        });
      }

      // 2. Koordinators -> Anggota
      if (anggotas.length > 0) {
        if (koordinators.length === 1) {
          // Single koordinator -> All anggota
          const koord = koordinators[0];
          for (const ang of anggotas) {
            initialEdges.push({
              id: `e-${koord.id}-${ang.id}`,
              source: `panitia-${koord.id}`,
              target: `panitia-${ang.id}`,
              type: "step",
              animated: false,
              style: { stroke: `${conf.color}80`, strokeWidth: 1.5 },
            });
          }
        } else {
          // Multiple koordinators -> Spacer -> All anggota
          const spacerId = `spacer-${divisi}`;
          initialNodes.push({
            id: spacerId,
            type: "spacer",
            position: { x: 0, y: 0 },
            data: { color: `${conf.color}80` },
          });

          // All koordinators -> Spacer
          for (const koord of koordinators) {
            initialEdges.push({
              id: `e-koord-${koord.id}-spacer`,
              source: `panitia-${koord.id}`,
              target: spacerId,
              type: "step", // Use 'step' for orthogonal lines merging into a single point
              animated: false,
              style: { stroke: `${conf.color}80`, strokeWidth: 1.5 },
            });
          }

          // Spacer -> All anggotas
          for (const ang of anggotas) {
            initialEdges.push({
              id: `e-spacer-${ang.id}`,
              source: spacerId,
              target: `panitia-${ang.id}`,
              type: "step", // Use 'step' for the branches going down
              animated: false,
              style: { stroke: `${conf.color}80`, strokeWidth: 1.5 },
            });
          }
        }
      }
    } else {
      // Connect Header -> Anggotas directly if no koordinator exists
      for (const ang of anggotas) {
        initialEdges.push({
          id: `e-${headerId}-${ang.id}`,
          source: headerId,
          target: `panitia-${ang.id}`,
          type: "step",
          animated: false,
          style: { stroke: `${conf.color}80`, strokeWidth: 1.5 },
        });
      }
    }
  }

  // 3. Apply Dagre Layout
  initialNodes.forEach((node) => {
    let w = nodeWidth;
    let h = nodeHeight;
    if (node.type === "divisi") {
      w = headerWidth;
      h = headerHeight;
    } else if (node.id.startsWith("spacer-")) {
      w = 1;
      h = 1;
    }
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  initialEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // 4. Map calculated positions back to React Flow nodes
  const layoutedNodes = initialNodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    let w = nodeWidth;
    let h = nodeHeight;
    if (node.type === "divisi") {
      w = headerWidth;
      h = headerHeight;
    } else if (node.id.startsWith("spacer-")) {
      w = 1;
      h = 1;
    }

    return {
      ...node,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches React Flow node anchor point (top left)
      targetPosition: "top" as any,
      sourcePosition: "bottom" as any,
      position: {
        x: nodeWithPosition.x - w / 2,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges: initialEdges };
}

// ── Main Component ────────────────────────────────────────────────────────────
export function PanitiaOrgChart({
  panitia,
  onEdit,
  onDelete,
}: PanitiaOrgChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Rebuild graph whenever panitia data changes
  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(panitia, onEdit, onDelete);
    setNodes(n);
    setEdges(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panitia]);

  if (panitia.length === 0) return null;

  return (
    <div
      className="w-full rounded-xl border border-border/50 overflow-hidden bg-background/50"
      style={{ height: 560 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as (changes: NodeChange<Node>[]) => void}
        onEdgesChange={onEdgesChange as (changes: EdgeChange<Edge>[]) => void}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{ type: "step" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="opacity-30"
        />
        <Controls className="bg-card/80! border-border/50! backdrop-blur!" />
      </ReactFlow>
    </div>
  );
}
