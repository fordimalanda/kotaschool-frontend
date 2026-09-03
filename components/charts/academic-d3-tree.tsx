'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TreeDataNode {
  name: string;
  category?: 'root' | 'section' | 'option' | 'classe';
  children?: TreeDataNode[];
  value?: number;
}

export function AcademicD3Tree({ data }: { data: TreeDataNode }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ name: string; category?: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = 760;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')
      .attr('transform', `translate(90, 0)`);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // D3 tree layout
    const hierarchyRoot = d3.hierarchy<TreeDataNode>(data);
    const treeLayout = d3.tree<TreeDataNode>().size([height - 60, width - 240]);
    const root = treeLayout(hierarchyRoot);

    // Category colors
    const colorMap: Record<string, { fill: string; stroke: string }> = {
      root: { fill: '#4f46e5', stroke: '#312e81' },
      section: { fill: '#0ea5e9', stroke: '#0369a1' },
      option: { fill: '#8b5cf6', stroke: '#6d28d9' },
      classe: { fill: '#10b981', stroke: '#047857' },
    };

    // Diagonal curves
    const linkGenerator = d3
      .linkHorizontal<any, any>()
      .x((d: any) => d.y)
      .y((d: any) => d.x);

    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', (d: any) => linkGenerator(d))
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.8);

    // Nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (_, d) => {
        setHoveredNode({ name: d.data.name, category: d.data.category });
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Node circles with glowing ring
    nodes.append('circle')
      .attr('r', (d) => (d.depth === 0 ? 10 : d.depth === 1 ? 8 : 6))
      .attr('fill', (d) => colorMap[d.data.category ?? 'classe']?.fill ?? '#64748b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))');

    // Node labels
    nodes.append('text')
      .attr('dy', '0.32em')
      .attr('x', (d) => (d.children ? -12 : 12))
      .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .text((d) => d.data.name)
      .style('font-size', (d) => (d.depth === 0 ? '13px' : '11px'))
      .style('font-weight', (d) => (d.depth <= 1 ? '600' : '500'))
      .style('fill', '#1e293b')
      .style('font-family', 'var(--font-sans), sans-serif');

  }, [data]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 border border-brand-200/60">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Arborescence Pédagogique Interactive (D3.js)
            </h4>
            <p className="text-xs text-slate-500">
              Exploration visuelle : Sections → Options → Classes
            </p>
          </div>
        </div>

        {hoveredNode && (
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 animate-fade-in">
            {hoveredNode.category ? (
              <span className="font-semibold text-brand-600 uppercase text-[10px] mr-1.5">
                {hoveredNode.category}:
              </span>
            ) : null}
            {hoveredNode.name}
          </div>
        )}
      </div>

      {/* D3 Canvas */}
      <div className="h-[360px] w-full bg-slate-50/40 rounded-xl border border-slate-100/80 relative overflow-hidden flex items-center justify-center">
        <svg ref={svgRef} className="h-full w-full select-none" />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0ea5e9]" /> Sections
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" /> Options
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" /> Classes
          </span>
        </div>
        <span>Glissez pour déplacer ou zoomez avec la molette</span>
      </div>
    </div>
  );
}
