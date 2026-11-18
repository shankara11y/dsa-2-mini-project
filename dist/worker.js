/**
 * Web Worker for PODIUM RUSH.
 * Runs Emscripten WebAssembly logic on a background thread so 100k+ events/sec never drop UI frames.
 */
import createCoreModule from './core.js';

let Module = null;
let tracker = null;
let autoStreamTimer = null;
let autoStreamSpeed = 50; // events/sec
let autoDistribution = 'zipf'; // 'uniform', 'zipf', 'spike'
let autoProducts = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
let viralTarget = 'A';

// Helper to convert C++ embind vectors or native arrays
function vectorToArray(vec) {
    if (!vec) return [];
    if (Array.isArray(vec)) return vec;
    const arr = [];
    const sz = typeof vec.size === 'function' ? vec.size() : vec.length;
    for (let i = 0; i < sz; i++) {
        arr.push(typeof vec.get === 'function' ? vec.get(i) : vec[i]);
    }
    return arr;
}

function getFullStateSnapshot() {
    if (!tracker) return null;

    const topK = vectorToArray(tracker.getTopK());
    const heapSnapshot = vectorToArray(tracker.getHeapSnapshot());
    const lastTrace = vectorToArray(tracker.getLastOperationTrace());
    const allCounts = vectorToArray(tracker.getAllCounts());

    return {
        topK,
        heapSnapshot,
        lastTrace,
        allCounts,
        totalSales: tracker.getTotalSales(),
        comparisons: tracker.getComparisons(),
        swaps: tracker.getSwaps(),
        heapOps: tracker.getHeapOps(),
        k: tracker.getK()
    };
}

// Fast random choice generators
function getNextProduct() {
    if (autoDistribution === 'uniform') {
        const idx = Math.floor(Math.random() * autoProducts.length);
        return autoProducts[idx];
    } else if (autoDistribution === 'spike') {
        // 75% viral product, 25% others
        if (Math.random() < 0.75) return viralTarget;
        const remaining = autoProducts.filter(p => p !== viralTarget);
        return remaining[Math.floor(Math.random() * remaining.length)] || viralTarget;
    } else {
        // Zipf / Pareto 80/20 power law
        const r = Math.random();
        if (r < 0.50) return autoProducts[0] || 'A';
        if (r < 0.75) return autoProducts[1] || 'B';
        if (r < 0.88) return autoProducts[2] || 'C';
        if (r < 0.95) return autoProducts[3] || 'D';
        const idx = Math.floor(Math.random() * autoProducts.length);
        return autoProducts[idx];
    }
}

self.onmessage = async (e) => {
    const { action, payload, msgId } = e.data;

    try {
        if (action === 'INIT') {
            if (!Module) {
                Module = await createCoreModule();
            }
            const initialK = payload && payload.k ? payload.k : 3;
            tracker = new Module.TrendingTracker(initialK);
            self.postMessage({ action: 'INIT_DONE', msgId, payload: getFullStateSnapshot() });
            return;
        }

        if (!tracker) {
            self.postMessage({ action: 'ERROR', msgId, error: 'WASM tracker not initialized' });
            return;
        }

        switch (action) {
            case 'SET_K': {
                tracker.setK(payload.k);
                self.postMessage({ action: 'STATE_UPDATE', msgId, payload: getFullStateSnapshot() });
                break;
            }

            case 'RECORD_SALE': {
                tracker.recordSale(payload.id);
                self.postMessage({
                    action: 'SALE_RECORDED',
                    msgId,
                    saleId: payload.id,
                    payload: getFullStateSnapshot()
                });
                break;
            }

            case 'RECORD_BATCH': {
                tracker.recordBatch(payload.batch);
                self.postMessage({
                    action: 'BATCH_RECORDED',
                    msgId,
                    payload: getFullStateSnapshot()
                });
                break;
            }

            case 'GET_SNAPSHOT': {
                self.postMessage({ action: 'STATE_UPDATE', msgId, payload: getFullStateSnapshot() });
                break;
            }

            case 'RESET': {
                if (autoStreamTimer) {
                    clearInterval(autoStreamTimer);
                    autoStreamTimer = null;
                }
                tracker.reset();
                self.postMessage({ action: 'RESET_DONE', msgId, payload: getFullStateSnapshot() });
                break;
            }

            case 'START_AUTO_STREAM': {
                autoStreamSpeed = Math.max(1, payload.speed || 50);
                autoDistribution = payload.distribution || 'zipf';
                if (payload.products && payload.products.length > 0) {
                    autoProducts = payload.products;
                }
                if (payload.viralTarget) {
                    viralTarget = payload.viralTarget;
                }

                if (autoStreamTimer) clearInterval(autoStreamTimer);

                // Run auto stream with throttled UI posts (every 33ms ~ 30fps postMessage)
                let pendingBatch = [];
                const intervalMs = Math.max(1, Math.floor(1000 / autoStreamSpeed));
                const salesPerTick = autoStreamSpeed > 500 ? Math.ceil(autoStreamSpeed / 60) : 1;

                autoStreamTimer = setInterval(() => {
                    for (let s = 0; s < salesPerTick; s++) {
                        const pid = getNextProduct();
                        tracker.recordSale(pid);
                        pendingBatch.push(pid);
                    }

                    if (pendingBatch.length >= (autoStreamSpeed > 100 ? 10 : 1)) {
                        self.postMessage({
                            action: 'AUTO_STREAM_TICK',
                            latestSales: pendingBatch.slice(-5),
                            payload: getFullStateSnapshot()
                        });
                        pendingBatch = [];
                    }
                }, Math.max(16, intervalMs));

                self.postMessage({ action: 'AUTO_STREAM_STARTED', msgId });
                break;
            }

            case 'STOP_AUTO_STREAM': {
                if (autoStreamTimer) {
                    clearInterval(autoStreamTimer);
                    autoStreamTimer = null;
                }
                self.postMessage({ action: 'AUTO_STREAM_STOPPED', msgId, payload: getFullStateSnapshot() });
                break;
            }

            case 'RUN_BENCHMARK': {
                const U = payload.u || 200;
                const K = payload.k || tracker.getK();
                const res = tracker.benchmark(U, K);
                self.postMessage({
                    action: 'BENCHMARK_RESULT',
                    msgId,
                    payload: {
                        heapMs: res.heapMs,
                        sortMs: res.sortMs,
                        lazyMs: res.lazyMs,
                        totalEvents: res.totalEvents,
                        uniqueCount: res.uniqueCount
                    }
                });
                break;
            }

            case 'RUN_ALTERNATIVES': {
                const heapTop = vectorToArray(tracker.getTopKHeap());
                const sortTop = vectorToArray(tracker.getTopKSort());
                const lazyTop = vectorToArray(tracker.getTopKLazy());
                self.postMessage({
                    action: 'ALTERNATIVES_RESULT',
                    msgId,
                    payload: { heapTop, sortTop, lazyTop }
                });
                break;
            }

            default:
                break;
        }
    } catch (err) {
        self.postMessage({ action: 'ERROR', msgId, error: err.message || String(err) });
    }
};
