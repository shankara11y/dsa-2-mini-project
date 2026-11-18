#include "tracker.hpp"
#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

// Helper functions converting C++ vectors/structs directly to native JavaScript Arrays and Objects
static val getTopK_JS(const TrendingTracker& self) {
    val arr = val::array();
    auto top = self.getTopK();
    for (size_t i = 0; i < top.size(); ++i) {
        val obj = val::object();
        obj.set("id", top[i].id);
        obj.set("count", top[i].count);
        obj.set("rank", top[i].rank);
        arr.set(i, obj);
    }
    return arr;
}

static val getAllCounts_JS(const TrendingTracker& self) {
    val arr = val::array();
    auto counts = self.getAllCounts();
    for (size_t i = 0; i < counts.size(); ++i) {
        val obj = val::object();
        obj.set("id", counts[i].id);
        obj.set("count", counts[i].count);
        arr.set(i, obj);
    }
    return arr;
}

static val getHeapSnapshot_JS(const TrendingTracker& self) {
    val arr = val::array();
    auto snapshot = self.getHeapSnapshot();
    for (size_t i = 0; i < snapshot.size(); ++i) {
        val obj = val::object();
        obj.set("id", snapshot[i].id);
        obj.set("count", snapshot[i].count);
        obj.set("index", snapshot[i].index);
        arr.set(i, obj);
    }
    return arr;
}

static val getLastOperationTrace_JS(const TrendingTracker& self) {
    val arr = val::array();
    auto trace = self.getLastOperationTrace();
    for (size_t i = 0; i < trace.size(); ++i) {
        val obj = val::object();
        obj.set("action", trace[i].action);
        obj.set("index1", trace[i].index1);
        obj.set("index2", trace[i].index2);
        obj.set("id1", trace[i].id1);
        obj.set("id2", trace[i].id2);
        obj.set("details", trace[i].details);
        arr.set(i, obj);
    }
    return arr;
}

static val getTopKHeap_JS(const TrendingTracker& self) {
    val arr = val::array();
    auto top = self.getTopKHeap();
    for (size_t i = 0; i < top.size(); ++i) {
        val obj = val::object();
        obj.set("id", top[i].id);
        obj.set("count", top[i].count);
        obj.set("rank", top[i].rank);
        arr.set(i, obj);
    }
    return arr;
}

static val getTopKSort_JS(const TrendingTracker& self) {
    val arr = val::array();
    auto top = self.getTopKSort();
    for (size_t i = 0; i < top.size(); ++i) {
        val obj = val::object();
        obj.set("id", top[i].id);
        obj.set("count", top[i].count);
        obj.set("rank", top[i].rank);
        arr.set(i, obj);
    }
    return arr;
}

static val getTopKLazy_JS(const TrendingTracker& self) {
    val arr = val::array();
    auto top = self.getTopKLazy();
    for (size_t i = 0; i < top.size(); ++i) {
        val obj = val::object();
        obj.set("id", top[i].id);
        obj.set("count", top[i].count);
        obj.set("rank", top[i].rank);
        arr.set(i, obj);
    }
    return arr;
}

static val benchmark_JS(TrendingTracker& self, int U, int K) {
    auto res = self.benchmark(U, K);
    val obj = val::object();
    obj.set("heapMs", res.heapMs);
    obj.set("sortMs", res.sortMs);
    obj.set("lazyMs", res.lazyMs);
    obj.set("totalEvents", res.totalEvents);
    obj.set("uniqueCount", res.uniqueCount);
    return obj;
}

static void recordBatch_JS(TrendingTracker& self, const val& batch) {
    if (batch.isArray()) {
        const unsigned len = batch["length"].as<unsigned>();
        for (unsigned i = 0; i < len; ++i) {
            self.recordSale(batch[i].as<std::string>());
        }
    } else if (batch.hasOwnProperty("size") && batch.hasOwnProperty("get")) {
        const unsigned sz = batch["size"]().as<unsigned>();
        for (unsigned i = 0; i < sz; ++i) {
            self.recordSale(batch["get"](i).as<std::string>());
        }
    }
}

EMSCRIPTEN_BINDINGS(podium_rush_module) {
    // Value Objects for direct typed access
    value_object<ProductRank>("ProductRank")
        .field("id", &ProductRank::id)
        .field("count", &ProductRank::count)
        .field("rank", &ProductRank::rank);

    value_object<ProductCount>("ProductCount")
        .field("id", &ProductCount::id)
        .field("count", &ProductCount::count);

    value_object<HeapSnapshotNode>("HeapSnapshotNode")
        .field("id", &HeapSnapshotNode::id)
        .field("count", &HeapSnapshotNode::count)
        .field("index", &HeapSnapshotNode::index);

    value_object<TraceStep>("TraceStep")
        .field("action", &TraceStep::action)
        .field("index1", &TraceStep::index1)
        .field("index2", &TraceStep::index2)
        .field("id1", &TraceStep::id1)
        .field("id2", &TraceStep::id2)
        .field("details", &TraceStep::details);

    value_object<BenchmarkResult>("BenchmarkResult")
        .field("heapMs", &BenchmarkResult::heapMs)
        .field("sortMs", &BenchmarkResult::sortMs)
        .field("lazyMs", &BenchmarkResult::lazyMs)
        .field("totalEvents", &BenchmarkResult::totalEvents)
        .field("uniqueCount", &BenchmarkResult::uniqueCount);

    register_vector<ProductRank>("VectorProductRank");
    register_vector<ProductCount>("VectorProductCount");
    register_vector<HeapSnapshotNode>("VectorHeapSnapshotNode");
    register_vector<TraceStep>("VectorTraceStep");
    register_vector<std::string>("VectorString");

    // TrendingTracker class exposed with native JS returns
    class_<TrendingTracker>("TrendingTracker")
        .constructor<int>()
        .function("setK", &TrendingTracker::setK)
        .function("getK", &TrendingTracker::getK)
        .function("recordSale", &TrendingTracker::recordSale)
        .function("recordBatch", &recordBatch_JS)
        .function("getTopK", &getTopK_JS)
        .function("getTopKRaw", &TrendingTracker::getTopK)
        .function("getAllCounts", &getAllCounts_JS)
        .function("getHeapSnapshot", &getHeapSnapshot_JS)
        .function("getLastOperationTrace", &getLastOperationTrace_JS)
        .function("reset", &TrendingTracker::reset)
        .function("getTotalSales", &TrendingTracker::getTotalSales)
        .function("getComparisons", &TrendingTracker::getComparisons)
        .function("getSwaps", &TrendingTracker::getSwaps)
        .function("getHeapOps", &TrendingTracker::getHeapOps)
        .function("getTopKHeap", &getTopKHeap_JS)
        .function("getTopKSort", &getTopKSort_JS)
        .function("getTopKLazy", &getTopKLazy_JS)
        .function("benchmark", &benchmark_JS);
}
