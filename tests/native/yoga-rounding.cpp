// Regression for upstream Yoga #2037 plus this app's paragraph dimensions.
// Copyright (c) Meta Platforms, Inc. and affiliates. MIT licensed (Yoga).
#include <yoga/Yoga.h>
#include <yoga/algorithm/PixelGrid.h>
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <limits>
#include <utility>

static YGSize measure(YGNodeConstRef node, float, YGMeasureMode, float, YGMeasureMode) {
  return *static_cast<YGSize*>(YGNodeGetContext(node));
}
int main() {
  int failures = 0, checks = 0;
  for (float scale : {0.f, 1.f, 2.f, 3.f}) {
    for (bool horizontal : {false, true}) {
    for (float offset : {0.f, 1012.f+1.f/3.f, 1012.f+2.f/3.f, 1721.f+1.f/3.f,
                         2004.f+1.f/3.f, 2028.f+2.f/3.f, 4052.f+2.f/3.f}) {
      for (YGSize size : {YGSize{292, 44}, YGSize{370, 275}}) {
        YGConfigRef config = YGConfigNew(); YGConfigSetPointScaleFactor(config, scale);
        YGNodeRef root = YGNodeNewWithConfig(config);
        if (horizontal) { YGNodeStyleSetHeight(root, 400); YGNodeStyleSetFlexDirection(root, YGFlexDirectionRow); }
        else YGNodeStyleSetWidth(root, 400);
        YGNodeStyleSetAlignItems(root, YGAlignFlexStart);
        YGNodeRef spacer = YGNodeNewWithConfig(config);
        if (horizontal) YGNodeStyleSetWidth(spacer, offset); else YGNodeStyleSetHeight(spacer, offset);
        YGNodeInsertChild(root, spacer, 0);
        YGNodeRef text = YGNodeNewWithConfig(config); YGNodeSetContext(text, &size);
        YGNodeSetMeasureFunc(text, measure); YGNodeInsertChild(root, text, 1);
        YGNodeCalculateLayout(root, YGUndefined, YGUndefined, YGDirectionLTR);
        const float height = YGNodeLayoutGetHeight(text), width = YGNodeLayoutGetWidth(text);
        ++checks;
        if (height != size.height || width != size.width) {
          ++failures; std::printf("FAIL scale=%g offset=%.9f expected=%gx%g actual=%.9fx%.9f\n", scale, offset, size.width, size.height, width, height);
        }
        YGNodeFreeRecursive(root); YGConfigFree(config);
      }
    }
    }
    if (scale == 0) continue;
    // Existing public rounding behavior: positive/negative half ties, explicit
    // floor/ceil, NaN and disabled rounding are distinct from edge precision.
    for (double value : {-3.75, -2.5, -1.25, 0., 1.25, 2.5, 3.75}) {
      const double scaled = value*scale;
      for (int mode : {0, 1, 2}) {
        const float actual = facebook::yoga::roundValueToPixelGrid(value, scale, mode==1, mode==2);
        const float expected = static_cast<float>((mode==1 ? std::ceil(scaled) : mode==2 ? std::floor(scaled) : std::floor(scaled+0.5))/scale);
        ++checks; if (actual != expected) { ++failures; std::printf("FAIL public rounding\n"); }
      }
    }
  }
  const double nan = std::numeric_limits<double>::quiet_NaN();
  for (const auto pair : {std::pair<double,double>{nan,3}, {3,nan}}) {
    ++checks;
    if (!std::isnan(facebook::yoga::roundValueToPixelGrid(pair.first,pair.second,false,false))) ++failures;
  }
  std::printf("Yoga regression: %d checks, %d failures\n", checks, failures);
  return failures ? 1 : 0;
}
