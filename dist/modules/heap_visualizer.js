/**
 * SVG Binary Tree Visualizer for the Custom Indexed Min-Heap.
 * Visualizes the exact heap array [0..K-1], parent-child edges,
 * and highlights active compare/swap/insert/evict steps.
 */
import { getMascot } from './mascots.js';

export class HeapVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentTrace = [];
        this.traceIndex = 0;
        this.isPlaying = false;
        this.playTimer = null;
        this.heapSnapshot = [];
        this.stepCallback = null;
    }

    setSnapshot(nodes, trace = []) {
        this.heapSnapshot = nodes || [];
        this.currentTrace = trace || [];
        this.traceIndex = 0;
        this.render();
    }

    calculateNodeCoords(index, totalNodes, width = 500, height = 300) {
        const level = Math.floor(Math.log2(index + 1));
        const indexInLevel = index - ((1 << level) - 1);
        const countInLevel = 1 << level;

        const x = (width / (countInLevel + 1)) * (indexInLevel + 1);
        const y = 50 + level * 70;
        return { x, y, level };
    }

    render(activeStep = null) {
        if (!this.container) return;

        const width = this.container.clientWidth || 500;
        const height = 320;
        const n = this.heapSnapshot.length;

        if (n === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌳</div>
                    <div class="empty-text">Heap is currently empty.</div>
                    <div class="empty-sub">Trigger sales or start auto-stream to populate the Size-K Min-Heap!</div>
                </div>
            `;
            return;
        }

        // Generate lines (edges)
        let edgesSvg = '';
        for (let i = 1; i < n; i++) {
            const parent = Math.floor((i - 1) / 2);
            const pCoord = this.calculateNodeCoords(parent, n, width, height);
            const cCoord = this.calculateNodeCoords(i, n, width, height);

            const isHighlighted = activeStep && (
                (activeStep.index1 === i && activeStep.index2 === parent) ||
                (activeStep.index2 === i && activeStep.index1 === parent)
            );

            edgesSvg += `
                <line x1="${pCoord.x}" y1="${pCoord.y}" x2="${cCoord.x}" y2="${cCoord.y}"
                      stroke="${isHighlighted ? '#ffd700' : 'rgba(255, 255, 255, 0.2)'}"
                      stroke-width="${isHighlighted ? '3' : '1.5'}"
                      stroke-dasharray="${isHighlighted ? '4,4' : 'none'}"
                      class="${isHighlighted ? 'edge-highlight' : ''}"/>
            `;
        }

        // Generate nodes
        let nodesSvg = '';
        for (let i = 0; i < n; i++) {
            const item = this.heapSnapshot[i];
            const coord = this.calculateNodeCoords(i, n, width, height);
            const mascot = getMascot(item.id);

            let nodeClass = 'heap-tree-node';
            let strokeColor = 'rgba(255, 255, 255, 0.3)';
            let strokeWidth = '2';

            if (i === 0) {
                nodeClass += ' is-root';
                strokeColor = '#ff007f';
                strokeWidth = '3';
            }

            if (activeStep) {
                if (activeStep.index1 === i || activeStep.index2 === i) {
                    if (activeStep.action === 'compare') {
                        strokeColor = '#ffd700';
                        strokeWidth = '4';
                        nodeClass += ' active-compare';
                    } else if (activeStep.action === 'swap') {
                        strokeColor = '#00f5ff';
                        strokeWidth = '4';
                        nodeClass += ' active-swap';
                    } else if (activeStep.action === 'insert') {
                        strokeColor = '#00ff87';
                        strokeWidth = '4';
                        nodeClass += ' active-insert';
                    } else if (activeStep.action === 'evict') {
                        strokeColor = '#ff0055';
                        strokeWidth = '4';
                        nodeClass += ' active-evict';
                    }
                }
            }

            nodesSvg += `
                <g class="${nodeClass}" transform="translate(${coord.x}, ${coord.y})" data-index="${i}">
                    <circle r="22" fill="#121828" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
                    <text y="-3" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold" font-family="'Inter', sans-serif">
                        ${mascot.emoji} ${item.id}
                    </text>
                    <text y="12" text-anchor="middle" fill="#00f5ff" font-size="10" font-family="'Orbitron', monospace">
                        ${item.count}
                    </text>
                    <text y="32" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="9" font-family="'Orbitron', monospace">
                        [${i}]${i === 0 ? ' ROOT' : ''}
                    </text>
                </g>
            `;
        }

        // Root explanatory badge
        const rootItem = this.heapSnapshot[0];
        const rootBadge = `
            <div class="heap-root-callout">
                <span class="callout-pill">Heap Root [Index 0]</span>
                <strong>${rootItem ? rootItem.id : '-'} (Count: ${rootItem ? rootItem.count : 0})</strong>
                <span class="callout-desc">Worst among current Top-K (Rank ${n}). Incoming products compare with this in O(1)!</span>
            </div>
        `;

        this.container.innerHTML = `
            ${rootBadge}
            <svg class="heap-svg-canvas" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                <g class="edges-layer">${edgesSvg}</g>
                <g class="nodes-layer">${nodesSvg}</g>
            </svg>
        `;
    }

    playTrace() {
        if (this.currentTrace.length === 0) return;
        this.isPlaying = true;
        this.stepTrace();
    }

    pauseTrace() {
        this.isPlaying = false;
        if (this.playTimer) {
            clearTimeout(this.playTimer);
            this.playTimer = null;
        }
    }

    stepTrace() {
        if (this.traceIndex >= this.currentTrace.length) {
            this.traceIndex = 0;
            this.isPlaying = false;
            this.render();
            if (this.stepCallback) this.stepCallback(null, this.traceIndex, this.currentTrace.length);
            return;
        }

        const step = this.currentTrace[this.traceIndex];
        this.render(step);
        if (this.stepCallback) {
            this.stepCallback(step, this.traceIndex + 1, this.currentTrace.length);
        }

        this.traceIndex++;
        if (this.isPlaying) {
            this.playTimer = setTimeout(() => this.stepTrace(), 650);
        }
    }
}

