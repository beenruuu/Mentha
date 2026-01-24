'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    ZoomIn, 
    ZoomOut, 
    Maximize2, 
    RefreshCw,
    Building2,
    User,
    FileText,
    Package,
    Lightbulb,
    Globe
} from 'lucide-react'
import { fetchAPI } from '@/lib/api-client'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(
    () => import('react-force-graph-2d').then(mod => mod.default),
    { ssr: false, loading: () => <GraphSkeleton /> }
)

interface GraphNode {
    id: string
    name: string
    type: string
    url?: string
    pagerank?: number
    val?: number // Node size
    color?: string
    // Force graph adds these dynamically
    x?: number
    y?: number
    vx?: number
    vy?: number
    fx?: number
    fy?: number
}

interface GraphLink {
    source: string
    target: string
    type: string
    weight?: number
}

interface GraphData {
    nodes: GraphNode[]
    links: GraphLink[]
}

interface KnowledgeGraphResponse {
    nodes: Array<{
        id: string
        name: string
        type: string
        url?: string
        pagerank?: number
    }>
    edges: Array<{
        source: string
        target: string
        type: string
        weight?: number
    }>
    stats: {
        total_nodes: number
        total_edges: number
        node_types: Record<string, number>
    }
}

// Node type to color mapping
const NODE_COLORS: Record<string, string> = {
    Organization: '#10b981', // emerald
    Person: '#8b5cf6',       // violet
    Article: '#3b82f6',      // blue
    Product: '#f59e0b',      // amber
    Concept: '#ec4899',      // pink
    WebPage: '#06b6d4',      // cyan
    FAQPage: '#14b8a6',      // teal
    HowTo: '#84cc16',        // lime
    Event: '#f97316',        // orange
    Place: '#6366f1',        // indigo
}

// Node type to icon mapping
const NODE_ICONS: Record<string, React.ReactNode> = {
    Organization: <Building2 className="w-3 h-3" />,
    Person: <User className="w-3 h-3" />,
    Article: <FileText className="w-3 h-3" />,
    Product: <Package className="w-3 h-3" />,
    Concept: <Lightbulb className="w-3 h-3" />,
    WebPage: <Globe className="w-3 h-3" />,
}

function GraphSkeleton() {
    return (
        <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg">
            <div className="text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Loading graph...</p>
            </div>
        </div>
    )
}

interface KnowledgeGraphViewerProps {
    brandId: string
    height?: number
}

export function KnowledgeGraphViewer({ brandId, height = 400 }: KnowledgeGraphViewerProps) {
    const graphRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
    const [stats, setStats] = useState<KnowledgeGraphResponse['stats'] | null>(null)

    // Fetch graph data
    const fetchGraphData = useCallback(async () => {
        if (!brandId) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetchAPI<KnowledgeGraphResponse>(
                `/knowledge-graph/${brandId}`
            )

            // Transform data for force graph
            const nodes: GraphNode[] = response.nodes.map(node => ({
                id: node.id,
                name: node.name,
                type: node.type,
                url: node.url,
                pagerank: node.pagerank || 0,
                val: Math.max(3, (node.pagerank || 0) * 100), // Size based on PageRank
                color: NODE_COLORS[node.type] || '#6b7280'
            }))

            const links: GraphLink[] = response.edges.map(edge => ({
                source: edge.source,
                target: edge.target,
                type: edge.type,
                weight: edge.weight || 1
            }))

            setGraphData({ nodes, links })
            setStats(response.stats)
        } catch (err: any) {
            console.error('Failed to fetch knowledge graph:', err)
            setError(err.message || 'Failed to load graph')
        } finally {
            setLoading(false)
        }
    }, [brandId])

    useEffect(() => {
        fetchGraphData()
    }, [fetchGraphData])

    // Graph controls
    const handleZoomIn = () => {
        if (graphRef.current) {
            graphRef.current.zoom(graphRef.current.zoom() * 1.5, 400)
        }
    }

    const handleZoomOut = () => {
        if (graphRef.current) {
            graphRef.current.zoom(graphRef.current.zoom() / 1.5, 400)
        }
    }

    const handleFitView = () => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(400)
        }
    }

    const handleNodeClick = useCallback((node: any, event: MouseEvent) => {
        setSelectedNode(node as GraphNode)
        // Center on node
        if (graphRef.current && node.x !== undefined && node.y !== undefined) {
            graphRef.current.centerAt(node.x, node.y, 400)
            graphRef.current.zoom(2, 400)
        }
    }, [])

    // Custom node rendering
    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name || node.id
        const fontSize = 12 / globalScale
        const nodeSize = node.val || 5
        
        // Draw node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
        ctx.fillStyle = node.color || '#6b7280'
        ctx.fill()
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.lineWidth = 1 / globalScale
        ctx.stroke()
        
        // Draw label if zoomed in enough
        if (globalScale > 0.8) {
            ctx.font = `${fontSize}px Sans-Serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillText(label.substring(0, 20), node.x, node.y + nodeSize + fontSize)
        }
    }, [])

    // Link rendering
    const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
        const start = link.source
        const end = link.target
        
        if (!start.x || !end.x) return
        
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.strokeStyle = 'rgba(107, 114, 128, 0.3)'
        ctx.lineWidth = Math.sqrt(link.weight || 1) * 0.5
        ctx.stroke()
    }, [])

    // Memoize graph config
    const graphConfig = useMemo(() => ({
        nodeRelSize: 6,
        linkDirectionalArrowLength: 3,
        linkDirectionalArrowRelPos: 1,
        cooldownTicks: 100,
        d3AlphaDecay: 0.02,
        d3VelocityDecay: 0.3,
    }), [])

    if (loading) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Knowledge Graph</CardTitle>
                    <CardDescription>Entity relationships and authority structure</CardDescription>
                </CardHeader>
                <CardContent>
                    <GraphSkeleton />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Knowledge Graph</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg">
                        <p className="text-sm text-red-500 mb-4">{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchGraphData}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (graphData.nodes.length === 0) {
        return (
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Knowledge Graph</CardTitle>
                    <CardDescription>Entity relationships and authority structure</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-[400px] flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg">
                        <Lightbulb className="w-10 h-10 mb-3 text-gray-300" />
                        <p className="text-sm text-gray-500 mb-2">No graph data yet</p>
                        <p className="text-xs text-gray-400 text-center max-w-sm">
                            Run a content analysis to populate the Knowledge Graph with entities and relationships.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold">Knowledge Graph</CardTitle>
                        <CardDescription>
                            {stats ? `${stats.total_nodes} entities, ${stats.total_edges} relationships` : 'Entity relationships'}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleFitView} className="h-8 w-8">
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={fetchGraphData} className="h-8 w-8">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Legend */}
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {stats?.node_types && Object.entries(stats.node_types).map(([type, count]) => (
                        <Badge 
                            key={type} 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                                backgroundColor: `${NODE_COLORS[type]}20`,
                                color: NODE_COLORS[type],
                                borderColor: NODE_COLORS[type]
                            }}
                        >
                            {NODE_ICONS[type]} {type}: {count}
                        </Badge>
                    ))}
                </div>

                {/* Graph Container */}
                <div 
                    ref={containerRef} 
                    className="w-full bg-gray-50 dark:bg-zinc-900 rounded-b-lg overflow-hidden"
                    style={{ height }}
                >
                    <ForceGraph2D
                        ref={graphRef}
                        graphData={graphData}
                        nodeCanvasObject={nodeCanvasObject}
                        linkCanvasObject={linkCanvasObject}
                        onNodeClick={handleNodeClick}
                        nodeLabel={(node: any) => `${node.name} (${node.type})`}
                        linkLabel={(link: any) => link.type}
                        backgroundColor="transparent"
                        {...graphConfig}
                    />
                </div>

                {/* Selected Node Info */}
                {selectedNode && (
                    <div className="p-4 border-t border-border/50 bg-background">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-medium text-sm">{selectedNode.name}</p>
                                <Badge 
                                    variant="secondary" 
                                    className="mt-1"
                                    style={{ backgroundColor: `${selectedNode.color}20`, color: selectedNode.color }}
                                >
                                    {selectedNode.type}
                                </Badge>
                            </div>
                            {selectedNode.pagerank !== undefined && (
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">PageRank</p>
                                    <p className="text-sm font-mono font-medium">
                                        {(selectedNode.pagerank * 100).toFixed(2)}%
                                    </p>
                                </div>
                            )}
                        </div>
                        {selectedNode.url && (
                            <a 
                                href={selectedNode.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline mt-2 block truncate"
                            >
                                {selectedNode.url}
                            </a>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
