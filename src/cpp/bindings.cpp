#include "tracker.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(podium_rush_module) {
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

    class_<TrendingTracker>("TrendingTracker")
        .constructor<int>()
        .function("setK", &TrendingTracker::setK)
        .function("getK", &TrendingTracker::getK)
        .function("recordSale", &TrendingTracker::recordSale)
        .function("recordBatch", &TrendingTracker::recordBatch)
        .function("getTopK", &TrendingTracker::getTopK)
        .function("getAllCounts", &TrendingTracker::getAllCounts)
        .function("getHeapSnapshot", &TrendingTracker::getHeapSnapshot)
        .function("getLastOperationTrace", &TrendingTracker::getLastOperationTrace)
        .function("reset", &TrendingTracker::reset)
        .function("getTotalSales", &TrendingTracker::getTotalSales)
        .function("getComparisons", &TrendingTracker::getComparisons)
        .function("getSwaps", &TrendingTracker::getSwaps)
        .function("getHeapOps", &TrendingTracker::getHeapOps)
        .function("getTopKHeap", &TrendingTracker::getTopKHeap)
        .function("getTopKSort", &TrendingTracker::getTopKSort)
        .function("getTopKLazy", &TrendingTracker::getTopKLazy)
        .function("benchmark", &TrendingTracker::benchmark);
}
