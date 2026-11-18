#include "tracker.hpp"
#include <iostream>
#include <cassert>
#include <vector>
#include <string>
#include <sstream>

void testStandardStream() {
    std::cout << "[Test 1] Testing stream: 'A B A C B A D B', K=2 ...\n";
    TrendingTracker tracker(2);
    std::vector<std::string> stream = {"A", "B", "A", "C", "B", "A", "D", "B"};
    for (const auto& item : stream) {
        tracker.recordSale(item);
    }

    auto top = tracker.getTopK();
    assert(top.size() == 2);
    assert(top[0].id == "A" && top[0].count == 3 && top[0].rank == 1);
    assert(top[1].id == "B" && top[1].count == 3 && top[1].rank == 2);

    auto counts = tracker.getAllCounts();
    // A:3, B:3, C:1, D:1
    assert(counts.size() == 4);

    std::cout << "  -> PASSED: Top products: " << top[0].id << " (" << top[0].count
              << "), " << top[1].id << " (" << top[1].count << ")\n";
}

void testKGreaterThanProducts() {
    std::cout << "[Test 2] Testing K > number of products ...\n";
    TrendingTracker tracker(5);
    tracker.recordSale("ALPHA");
    tracker.recordSale("BETA");

    auto top = tracker.getTopK();
    assert(top.size() == 2);
    assert(top[0].id == "ALPHA" && top[0].count == 1);
    assert(top[1].id == "BETA" && top[1].count == 1);
    std::cout << "  -> PASSED: returned " << top.size() << " products when K=5.\n";
}

void testAllTies() {
    std::cout << "[Test 3] Testing all ties alphabetical ordering ...\n";
    TrendingTracker tracker(3);
    tracker.recordSale("D");
    tracker.recordSale("B");
    tracker.recordSale("A");
    tracker.recordSale("C");

    auto top = tracker.getTopK();
    assert(top.size() == 3);
    // All counts = 1. Tie-break: A < B < C < D
    assert(top[0].id == "A" && top[0].count == 1);
    assert(top[1].id == "B" && top[1].count == 1);
    assert(top[2].id == "C" && top[2].count == 1);
    std::cout << "  -> PASSED: Tie-breaking is deterministic (A, B, C).\n";
}

void testSingleProduct() {
    std::cout << "[Test 4] Testing single product stream ...\n";
    TrendingTracker tracker(3);
    for (int i = 0; i < 100; ++i) {
        tracker.recordSale("ZEUS");
    }
    auto top = tracker.getTopK();
    assert(top.size() == 1);
    assert(top[0].id == "ZEUS" && top[0].count == 100);
    std::cout << "  -> PASSED: Single product count = 100.\n";
}

void testEmptyStream() {
    std::cout << "[Test 5] Testing empty stream ...\n";
    TrendingTracker tracker(3);
    auto top = tracker.getTopK();
    assert(top.empty());
    assert(tracker.getAllCounts().empty());
    std::cout << "  -> PASSED: Empty stream returns 0 top products.\n";
}

void testKEqualsOne() {
    std::cout << "[Test 6] Testing K = 1 ...\n";
    TrendingTracker tracker(1);
    tracker.recordSale("P1");
    tracker.recordSale("P2");
    tracker.recordSale("P2");
    tracker.recordSale("P1");
    tracker.recordSale("P1"); // P1=3, P2=2
    auto top = tracker.getTopK();
    assert(top.size() == 1);
    assert(top[0].id == "P1" && top[0].count == 3);
    std::cout << "  -> PASSED: K=1 returned single winner P1 (3).\n";
}

void testEquivalenceOfAlternatives() {
    std::cout << "[Test 7] Testing equivalence of Heap, Sort, and Lazy methods ...\n";
    TrendingTracker tracker(3);
    std::vector<std::string> stream = {"X", "Y", "Z", "X", "W", "Y", "X", "V", "Z", "Z", "X"};
    for (const auto& s : stream) tracker.recordSale(s);

    auto topCore = tracker.getTopK();
    auto topHeap = tracker.getTopKHeap();
    auto topSort = tracker.getTopKSort();
    auto topLazy = tracker.getTopKLazy();

    assert(topCore.size() == topHeap.size());
    assert(topCore.size() == topSort.size());
    assert(topCore.size() == topLazy.size());

    for (size_t i = 0; i < topCore.size(); ++i) {
        assert(topCore[i].id == topHeap[i].id && topCore[i].count == topHeap[i].count);
        assert(topCore[i].id == topSort[i].id && topCore[i].count == topSort[i].count);
        assert(topCore[i].id == topLazy[i].id && topCore[i].count == topLazy[i].count);
    }
    std::cout << "  -> PASSED: All 3 alternatives produced identical rankings!\n";
}

void testHugeStream() {
    std::cout << "[Test 8] Testing huge stream: 1,000,000 events ...\n";
    TrendingTracker tracker(5);
    const int TOTAL_EVENTS = 1000000;
    std::vector<std::string> pool = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};

    auto t0 = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < TOTAL_EVENTS; ++i) {
        // Skewed: A gets most, B gets second most, etc.
        int idx = (i % 100 < 40) ? 0 : (i % 100 < 65 ? 1 : (i % 10));
        tracker.recordSale(pool[idx]);
    }
    auto t1 = std::chrono::high_resolution_clock::now();
    double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();

    auto top = tracker.getTopK();
    assert(top.size() == 5);
    assert(top[0].id == "A");
    assert(top[1].id == "B");

    std::cout << "  -> PASSED: Processed 1,000,000 events in " << ms << " ms ("
              << (TOTAL_EVENTS / (ms / 1000.0)) << " events/sec)!\n";
    std::cout << "  -> Top 1: " << top[0].id << " (" << top[0].count << " sales)\n";
    std::cout << "  -> Top 2: " << top[1].id << " (" << top[1].count << " sales)\n";
}

int main() {
    std::cout << "========================================\n";
    std::cout << "RUNNING PODIUM RUSH C++ TEST SUITE\n";
    std::cout << "========================================\n";

    testStandardStream();
    testKGreaterThanProducts();
    testAllTies();
    testSingleProduct();
    testEmptyStream();
    testKEqualsOne();
    testEquivalenceOfAlternatives();
    testHugeStream();

    std::cout << "========================================\n";
    std::cout << "ALL TESTS PASSED WITH 100% SUCCESS!\n";
    std::cout << "========================================\n";
    return 0;
}
