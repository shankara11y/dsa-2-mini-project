/**
 * Canvas Chart visualizer for the DSA Comparison & Benchmark panel.
 * Draws comparison bar charts (Heap vs Sort vs Lazy) and theoretical Big-O curves.
 */
export class BenchmarkChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    }

    render(results) {
        if (!this.canvas) {
            this.canvas = document.getElementById('benchmark-chart-canvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
            } else {
                return;
            }
        }
        if (!this.ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = (rect.width || 480) * dpr;
        this.canvas.height = (rect.height || 260) * dpr;
        this.ctx.scale(dpr, dpr);

        const width = rect.width || 480;
        const height = rect.height || 260;

        this.ctx.clearRect(0, 0, width, height);

        if (!results) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.font = '13px "Inter", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Click "Run Benchmark" below to generate live metrics', width / 2, height / 2);
            return;
        }

        const data = [
            { label: 'Indexed Min-Heap', value: results.heapMs, color: '#00ff87', complexity: 'O(log K) / event' },
            { label: 'Full Sort', value: results.sortMs, color: '#ff007f', complexity: 'O(U log U)' },
            { label: 'Lazy Deletion', value: results.lazyMs, color: '#00f5ff', complexity: 'O(N log N)' }
        ];

        const maxVal = Math.max(...data.map(d => d.value), 0.1) * 1.25;

        // Draw axes and grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = height - 40 - (i / 4) * (height - 70);
            this.ctx.beginPath();
            this.ctx.moveTo(50, y);
            this.ctx.lineTo(width - 20, y);
            this.ctx.stroke();

            const labelVal = ((i / 4) * maxVal).toFixed(1);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.font = '10px "Orbitron", monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${labelVal}ms`, 45, y + 4);
        }

        // Draw bars
        const barWidth = 65;
        const gap = (width - 70 - barWidth * 3) / 4;

        data.forEach((d, idx) => {
            const x = 60 + gap + idx * (barWidth + gap);
            const barHeight = Math.max(4, (d.value / maxVal) * (height - 70));
            const y = height - 40 - barHeight;

            // Bar background shadow / glow
            this.ctx.fillStyle = d.color;
            this.ctx.shadowColor = d.color;
            this.ctx.shadowBlur = 12;

            // Rounded bar top
            this.ctx.beginPath();
            this.ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Value text on top of bar
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 11px "Orbitron", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${d.value.toFixed(2)}ms`, x + barWidth / 2, y - 8);

            // Label text below bar
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '11px "Inter", sans-serif';
            this.ctx.fillText(d.label, x + barWidth / 2, height - 24);

            // Complexity label below
            this.ctx.fillStyle = d.color;
            this.ctx.font = '9px "Orbitron", monospace';
            this.ctx.fillText(d.complexity, x + barWidth / 2, height - 10);
        });
    }
}
