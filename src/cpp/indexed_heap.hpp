#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <sstream>
#include <cstdint>

/**
 * Node in the Min-Heap representing a product.
 * In our Top-K Tracker, the Min-Heap stores the TOP K products,
 * where the ROOT is the WORST product currently in the Top K.
 *
 * Comparator definition:
 * Product X is "better" than Y if:
 *   count[X] > count[Y]
 *   or (count[X] == count[Y] && X.id < Y.id) [Alphabetical tie-break]
 *
 * In this Min-Heap:
 *   "worse" means lower count or alphabetically larger ID.
 *   The root node is the minimum (worst) of the top-K elements.
 */
struct HeapNode {
    std::string id;
    int count;

    bool operator==(const HeapNode& other) const {
        return id == other.id && count == other.count;
    }
};

/**
 * Returns true if 'a' is strictly BETTER than 'b'.
 */
inline bool isBetter(const HeapNode& a, const HeapNode& b) {
    if (a.count != b.count) {
        return a.count > b.count;
    }
    return a.id < b.id; // Alphabetical tie-break: 'A' is better than 'B'
}

/**
 * Returns true if 'a' is strictly WORSE than 'b'.
 * In our min-heap, parent must be worse than or equal to children.
 */
inline bool isWorse(const HeapNode& a, const HeapNode& b) {
    if (a.count != b.count) {
        return a.count < b.count;
    }
    return a.id > b.id; // 'B' is worse than 'A'
}

/**
 * Structured trace step for step-by-step UI visualization.
 */
struct TraceStep {
    std::string action; // "compare", "swap", "insert", "evict", "update_pos", "sift_up", "sift_down", "noop", "count_inc"
    int index1;
    int index2;
    std::string id1;
    std::string id2;
    std::string details;
};

/**
 * Custom Indexed Min-Heap.
 * Maintains at most K elements with O(1) position lookup and O(log K) updates.
 */
class IndexedMinHeap {
private:
    int capacity;
    std::vector<HeapNode> heap;
    std::unordered_map<std::string, int> pos; // id -> index in heap
    std::vector<TraceStep> trace;

    // Metrics for Big-O Live Stats
    uint64_t comparisonCount = 0;
    uint64_t swapCount = 0;
    uint64_t heapOpCount = 0;

    void swapNodes(int i, int j) {
        swapCount++;
        std::string desc = "Swapped " + heap[i].id + " (index " + std::to_string(i) + ") with "
                           + heap[j].id + " (index " + std::to_string(j) + ")";
        trace.push_back({"swap", i, j, heap[i].id, heap[j].id, desc});

        std::swap(heap[i], heap[j]);
        pos[heap[i].id] = i;
        pos[heap[j].id] = j;

        trace.push_back({"update_pos", i, j, heap[i].id, heap[j].id,
                         "Updated pos[" + heap[i].id + "] = " + std::to_string(i) +
                         ", pos[" + heap[j].id + "] = " + std::to_string(j)});
    }

public:
    explicit IndexedMinHeap(int cap = 5) : capacity(cap) {}

    void setCapacity(int newK) {
        capacity = newK;
        // If shrinking, remove root (worst) elements until size <= capacity
        while ((int)heap.size() > capacity) {
            removeRoot();
        }
    }

    int getCapacity() const { return capacity; }
    int size() const { return (int)heap.size(); }
    bool empty() const { return heap.empty(); }

    bool contains(const std::string& id) const {
        return pos.find(id) != pos.end();
    }

    int getPos(const std::string& id) const {
        auto it = pos.find(id);
        if (it != pos.end()) return it->second;
        return -1;
    }

    const HeapNode& getRoot() const {
        return heap.front();
    }

    const std::vector<HeapNode>& getNodes() const {
        return heap;
    }

    std::vector<TraceStep> getTrace() const {
        return trace;
    }

    void clearTrace() {
        trace.clear();
    }

    uint64_t getComparisonCount() const { return comparisonCount; }
    uint64_t getSwapCount() const { return swapCount; }
    uint64_t getHeapOpCount() const { return heapOpCount; }

    void resetMetrics() {
        comparisonCount = 0;
        swapCount = 0;
        heapOpCount = 0;
    }

    /**
     * Sift-up: moves node at index i upwards if it is worse than its parent.
     * (Remember: root is the worst element, so worse elements bubble UP to root)
     */
    void siftUp(int i) {
        heapOpCount++;
        while (i > 0) {
            int parent = (i - 1) / 2;
            comparisonCount++;
            trace.push_back({"compare", i, parent, heap[i].id, heap[parent].id,
                "Comparing node " + heap[i].id + " (count " + std::to_string(heap[i].count) +
                ") with parent " + heap[parent].id + " (count " + std::to_string(heap[parent].count) + ")"});

            if (isWorse(heap[i], heap[parent])) {
                swapNodes(i, parent);
                i = parent;
            } else {
                break;
            }
        }
    }

    /**
     * Sift-down: moves node at index i downwards if it is better than its children.
     * (A better element must move down away from root towards the leaves)
     */
    void siftDown(int i) {
        heapOpCount++;
        int n = (int)heap.size();
        while (true) {
            int left = 2 * i + 1;
            int right = 2 * i + 2;
            int worst = i;

            if (left < n) {
                comparisonCount++;
                trace.push_back({"compare", left, worst, heap[left].id, heap[worst].id,
                    "Comparing left child " + heap[left].id + " with current worst " + heap[worst].id});
                if (isWorse(heap[left], heap[worst])) {
                    worst = left;
                }
            }

            if (right < n) {
                comparisonCount++;
                trace.push_back({"compare", right, worst, heap[right].id, heap[worst].id,
                    "Comparing right child " + heap[right].id + " with current worst " + heap[worst].id});
                if (isWorse(heap[right], heap[worst])) {
                    worst = right;
                }
            }

            if (worst != i) {
                swapNodes(i, worst);
                i = worst;
            } else {
                break;
            }
        }
    }

    /**
     * Inserts a new node into the heap. O(log K)
     */
    void insert(const std::string& id, int count) {
        heapOpCount++;
        int idx = (int)heap.size();
        heap.push_back({id, count});
        pos[id] = idx;
        trace.push_back({"insert", idx, -1, id, "",
            "Inserted " + id + " (count " + std::to_string(count) + ") at leaf index " + std::to_string(idx)});
        siftUp(idx);
    }

    /**
     * Updates count of an existing element and restores heap invariant in O(log K).
     */
    void updateKey(const std::string& id, int newCount) {
        heapOpCount++;
        auto it = pos.find(id);
        if (it == pos.end()) return;
        int idx = it->second;
        int oldCount = heap[idx].count;
        heap[idx].count = newCount;

        trace.push_back({"update_key", idx, -1, id, "",
            "Updated " + id + " count: " + std::to_string(oldCount) + " -> " + std::to_string(newCount)});

        // When count increases, node becomes BETTER -> moves DOWN away from root.
        // If count decreased, node becomes WORSE -> moves UP towards root.
        siftDown(idx);
        siftUp(idx);
    }

    /**
     * Replaces the root (worst) with a new better element and restores heap in O(log K).
     */
    void replaceRoot(const std::string& id, int count) {
        heapOpCount++;
        if (heap.empty()) {
            insert(id, count);
            return;
        }
        std::string evictedId = heap[0].id;
        int evictedCount = heap[0].count;
        pos.erase(evictedId);

        trace.push_back({"evict", 0, -1, evictedId, id,
            "Evicted worst top-K product " + evictedId + " (count " + std::to_string(evictedCount) +
            ") from root; replaced with " + id + " (count " + std::to_string(count) + ")"});

        heap[0] = {id, count};
        pos[id] = 0;
        siftDown(0);
    }

    /**
     * Removes the root element.
     */
    void removeRoot() {
        if (heap.empty()) return;
        std::string rootId = heap[0].id;
        pos.erase(rootId);
        if (heap.size() == 1) {
            heap.pop_back();
            return;
        }
        heap[0] = heap.back();
        pos[heap[0].id] = 0;
        heap.pop_back();
        siftDown(0);
    }

    void clear() {
        heap.clear();
        pos.clear();
        trace.clear();
    }
};

