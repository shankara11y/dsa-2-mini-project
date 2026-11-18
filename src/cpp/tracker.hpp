#pragma once

#include "indexed_heap.hpp"
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <queue>
#include <chrono>
#include <random>

struct ProductRank {
    std::string id;
    int count;
    int rank;
};

struct ProductCount {
    std::string id;
    int count;
};

struct HeapSnapshotNode {
    std::string id;
    int count;
    int index;
};

struct BenchmarkResult {
    double heapMs;
    double sortMs;
    double lazyMs;
    int totalEvents;
    int uniqueCount;
};

class TrendingTracker {
private:
    int K;
    std::unordered_map<std::string, int> counts;
    IndexedMinHeap heap;
    std::vector<TraceStep> lastTrace;

    // Global counters
    uint64_t totalSalesRecorded = 0;

    void rebuildHeap() {
        heap.clear();
        // Rebuild from counts: insert top K
        std::vector<HeapNode> allProducts;
        allProducts.reserve(counts.size());
        for (const auto& pair : counts) {
            allProducts.push_back({pair.first, pair.second});
        }

        // Fresh size-K min-heap insertion
        for (const auto& p : allProducts) {
            if (heap.size() < K) {
                heap.insert(p.id, p.count);
            } else if (isBetter(p, heap.getRoot())) {
                heap.replaceRoot(p.id, p.count);
            }
        }
    }

public:
    explicit TrendingTracker(int k = 3) : K(k > 0 ? k : 1), heap(k > 0 ? k : 1) {}

    void setK(int newK) {
        if (newK < 1) newK = 1;
        K = newK;
        heap.setCapacity(newK);
        // If K grew and counts have more items, rebuild to pull in newly qualified items
        if ((int)counts.size() > heap.size() && heap.size() < K) {
            rebuildHeap();
        }
    }

    int getK() const { return K; }

    /**
     * Core DSA Update Strategy:
     * 1. counts[id]++
     * 2. If id is in heap: updateKey -> siftDown/siftUp, O(log K)
     * 3. Else if heap.size() < K: insert, O(log K)
     * 4. Else if id is better than heap root: replace root, siftDown, O(log K)
     * 5. Else: do nothing, O(1)
     */
    void recordSale(const std::string& id) {
        if (id.empty()) return;

        heap.clearTrace();
        totalSalesRecorded++;

        counts[id]++;
        int currentCount = counts[id];

        heap.clearTrace(); // Track steps specifically for this event

        TraceStep incStep;
        incStep.action = "count_inc";
        incStep.index1 = heap.getPos(id);
        incStep.index2 = -1;
        incStep.id1 = id;
        incStep.id2 = "";
        incStep.details = "Incremented counts['" + id + "'] to " + std::to_string(currentCount);

        if (heap.contains(id)) {
            // Case 1: In Heap. Update key in O(log K)
            heap.updateKey(id, currentCount);
        } else if (heap.size() < K) {
            // Case 2: Heap not full yet. Insert in O(log K)
            heap.insert(id, currentCount);
        } else {
            // Case 3: Heap full. Compare with root in O(1)
            const HeapNode& root = heap.getRoot();
            HeapNode candidate{id, currentCount};

            TraceStep compStep;
            compStep.action = "compare";
            compStep.index1 = -1;
            compStep.index2 = 0;
            compStep.id1 = id;
            compStep.id2 = root.id;
            compStep.details = "Comparing candidate " + id + " (count " + std::to_string(currentCount) +
                               ") against heap root " + root.id + " (count " + std::to_string(root.count) + ")";

            if (isBetter(candidate, root)) {
                // Better than root: evict root & siftDown in O(log K)
                heap.replaceRoot(id, currentCount);
            } else {
                // Not better: Do nothing in O(1)
                TraceStep noopStep;
                noopStep.action = "noop";
                noopStep.index1 = -1;
                noopStep.index2 = 0;
                noopStep.id1 = id;
                noopStep.id2 = root.id;
                noopStep.details = "Candidate " + id + " does not exceed root threshold (" +
                                   root.id + ": " + std::to_string(root.count) + "). Ignored.";
                lastTrace.clear();
                lastTrace.push_back(incStep);
                lastTrace.push_back(compStep);
                lastTrace.push_back(noopStep);
                return;
            }
        }

        lastTrace = heap.getTrace();
        lastTrace.insert(lastTrace.begin(), incStep);
    }

    void recordBatch(const std::vector<std::string>& batch) {
        for (const auto& id : batch) {
            recordSale(id);
        }
    }

    /**
     * getTopK(): returns sorted list of top-K products, rank 1 = best.
     */
    std::vector<ProductRank> getTopK() const {
        std::vector<HeapNode> nodes = heap.getNodes();
        std::sort(nodes.begin(), nodes.end(), isBetter);

        std::vector<ProductRank> result;
        result.reserve(nodes.size());
        for (size_t i = 0; i < nodes.size(); ++i) {
            result.push_back({nodes[i].id, nodes[i].count, (int)(i + 1)});
        }
        return result;
    }

    /**
     * getAllCounts(): returns all products and counts for Hash Map tab.
     */
    std::vector<ProductCount> getAllCounts() const {
        std::vector<ProductCount> list;
        list.reserve(counts.size());
        for (const auto& pair : counts) {
            list.push_back({pair.first, pair.second});
        }
        // Sort for neat deterministic UI display
        std::sort(list.begin(), list.end(), [](const ProductCount& a, const ProductCount& b) {
            if (a.count != b.count) return a.count > b.count;
            return a.id < b.id;
        });
        return list;
    }

    std::vector<HeapSnapshotNode> getHeapSnapshot() const {
        std::vector<HeapSnapshotNode> snapshot;
        const auto& nodes = heap.getNodes();
        snapshot.reserve(nodes.size());
        for (size_t i = 0; i < nodes.size(); ++i) {
            snapshot.push_back({nodes[i].id, nodes[i].count, (int)i});
        }
        return snapshot;
    }

    std::vector<TraceStep> getLastOperationTrace() const {
        return lastTrace;
    }

    void reset() {
        counts.clear();
        heap.clear();
        lastTrace.clear();
        totalSalesRecorded = 0;
        heap.resetMetrics();
    }

    uint64_t getTotalSales() const { return totalSalesRecorded; }
    uint64_t getComparisons() const { return heap.getComparisonCount(); }
    uint64_t getSwaps() const { return heap.getSwapCount(); }
    uint64_t getHeapOps() const { return heap.getHeapOpCount(); }

    // ============================================================
    // ALTERNATIVE STRATEGIES (For DSA Lab / Comparison Panel)
    // ============================================================

    /**
     * Strategy 1 (Baseline offline): getTopKHeap()
     * Fresh Size-K Min-Heap from counts map.
     * Complexity: O(U log K)
     */
    std::vector<ProductRank> getTopKHeap() const {
        IndexedMinHeap tempHeap(K);
        for (const auto& pair : counts) {
            HeapNode node{pair.first, pair.second};
            if (tempHeap.size() < K) {
                tempHeap.insert(node.id, node.count);
            } else if (isBetter(node, tempHeap.getRoot())) {
                tempHeap.replaceRoot(node.id, node.count);
            }
        }
        auto nodes = tempHeap.getNodes();
        std::sort(nodes.begin(), nodes.end(), isBetter);

        std::vector<ProductRank> result;
        for (size_t i = 0; i < nodes.size(); ++i) {
            result.push_back({nodes[i].id, nodes[i].count, (int)(i + 1)});
        }
        return result;
    }

    /**
     * Strategy 2 (Baseline offline): getTopKSort()
     * Full sort of all U elements with same comparator.
     * Complexity: O(U log U)
     */
    std::vector<ProductRank> getTopKSort() const {
        std::vector<HeapNode> all;
        all.reserve(counts.size());
        for (const auto& pair : counts) {
            all.push_back({pair.first, pair.second});
        }
        std::sort(all.begin(), all.end(), isBetter);

        int count = std::min((int)all.size(), K);
        std::vector<ProductRank> result;
        result.reserve(count);
        for (int i = 0; i < count; ++i) {
            result.push_back({all[i].id, all[i].count, i + 1});
        }
        return result;
    }

    /**
     * Strategy 3: Lazy-Deletion Heap
     * Push every sale (or periodic update) into priority_queue without updating keys.
     * Stale entries discarded on pop.
     */
    std::vector<ProductRank> getTopKLazy() const {
        struct LazyCmp {
            bool operator()(const HeapNode& a, const HeapNode& b) const {
                // For max-heap in priority_queue: 'a' has lower priority than 'b' if 'b' is better
                return isBetter(b, a);
            }
        };

        std::priority_queue<HeapNode, std::vector<HeapNode>, LazyCmp> pq;
        // In lazy approach, we push all entries
        for (const auto& pair : counts) {
            pq.push({pair.first, pair.second});
        }

        std::unordered_map<std::string, bool> visited;
        std::vector<ProductRank> result;
        int rank = 1;

        while (!pq.empty() && (int)result.size() < K) {
            HeapNode top = pq.top();
            pq.pop();

            // Check if entry is stale or already picked
            auto it = counts.find(top.id);
            if (it == counts.end() || it->second != top.count || visited[top.id]) {
                continue; // Stale entry discarded lazily!
            }

            visited[top.id] = true;
            result.push_back({top.id, top.count, rank++});
        }

        return result;
    }

    /**
     * benchmark(U, K): Runs a realistic benchmark comparing:
     * - Indexed Min-Heap (our real-time strategy)
     * - Full Sort: O(U log U)
     * - Lazy-Deletion Max-Heap
     * Returns {heapMs, sortMs, lazyMs, totalEvents, uniqueCount}
     */
    BenchmarkResult benchmark(int U, int testK) {
        if (U < 1) U = 100;
        if (testK < 1) testK = 5;

        int numEvents = std::max(U * 5, 20000); // 20k-100k events for clear timing

        // Generate synthetic skewed stream (Zipf-like distribution)
        std::vector<std::string> stream;
        stream.reserve(numEvents);

        std::vector<std::string> productIds;
        productIds.reserve(U);
        for (int i = 0; i < U; ++i) {
            productIds.push_back("PROD_" + std::to_string(i));
        }

        std::mt19937 rng(42);
        // Exponential distribution for realistic heavy-tail / trending skew
        std::exponential_distribution<double> expDist(3.0);

        for (int i = 0; i < numEvents; ++i) {
            double v = expDist(rng);
            int idx = std::min((int)(v * (U / 4.0)), U - 1);
            stream.push_back(productIds[idx]);
        }

        // 1. Benchmark Indexed Min-Heap (Stream Processing)
        auto start1 = std::chrono::high_resolution_clock::now();
        {
            TrendingTracker testTracker(testK);
            for (const auto& id : stream) {
                testTracker.recordSale(id);
            }
            volatile auto top = testTracker.getTopK();
            (void)top;
        }
        auto end1 = std::chrono::high_resolution_clock::now();
        double heapMs = std::chrono::duration<double, std::milli>(end1 - start1).count();

        // 2. Benchmark Full Sort (Re-sorting stream counts on each batch / top-k query)
        auto start2 = std::chrono::high_resolution_clock::now();
        {
            std::unordered_map<std::string, int> sortCounts;
            int queryInterval = 500; // Query top-K periodically
            for (int i = 0; i < numEvents; ++i) {
                sortCounts[stream[i]]++;
                if (i % queryInterval == 0 || i == numEvents - 1) {
                    std::vector<HeapNode> vec;
                    vec.reserve(sortCounts.size());
                    for (const auto& p : sortCounts) {
                        vec.push_back({p.first, p.second});
                    }
                    std::sort(vec.begin(), vec.end(), isBetter);
                    volatile int count = std::min((int)vec.size(), testK);
                    (void)count;
                }
            }
        }
        auto end2 = std::chrono::high_resolution_clock::now();
        double sortMs = std::chrono::duration<double, std::milli>(end2 - start2).count();

        // 3. Benchmark Lazy-Deletion Heap
        auto start3 = std::chrono::high_resolution_clock::now();
        {
            struct LazyCmp {
                bool operator()(const HeapNode& a, const HeapNode& b) const {
                    return isBetter(b, a);
                }
            };
            std::unordered_map<std::string, int> lazyCounts;
            std::priority_queue<HeapNode, std::vector<HeapNode>, LazyCmp> lazyPq;
            int queryInterval = 500;

            for (int i = 0; i < numEvents; ++i) {
                lazyCounts[stream[i]]++;
                lazyPq.push({stream[i], lazyCounts[stream[i]]});

                if (i % queryInterval == 0 || i == numEvents - 1) {
                    std::unordered_map<std::string, bool> visited;
                    int collected = 0;
                    std::vector<HeapNode> popped;
                    while (!lazyPq.empty() && collected < testK) {
                        HeapNode top = lazyPq.top();
                        lazyPq.pop();
                        popped.push_back(top);
                        if (lazyCounts[top.id] == top.count && !visited[top.id]) {
                            visited[top.id] = true;
                            collected++;
                        }
                    }
                    // Put valid ones back
                    for (const auto& item : popped) {
                        lazyPq.push(item);
                    }
                }
            }
        }
        auto end3 = std::chrono::high_resolution_clock::now();
        double lazyMs = std::chrono::duration<double, std::milli>(end3 - start3).count();

        return {heapMs, sortMs, lazyMs, numEvents, U};
    }
};

