// Executed on Android against the actual pinned libreactnative. No JVM, mock
// renderer, replacement Yoga, or Java SP conversion is used for this test.
// It isolates context/ownership propagation; the real Text/Input fixture owns
// Android text measurement acceptance.
#include <cstdio>
#include <cstddef>
#include <memory>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>

namespace facebook::react {
extern const char FontProbeName[] = "FontEnvironmentProbe";
static int measures = 0;
static bool dirtyOnClone = true;
static bool environmentOnly = false;
template <typename Context>
uint64_t contextEnvironment(const Context& context) {
  if constexpr (requires { context.fontEnvironmentGeneration; }) return context.fontEnvironmentGeneration;
  return 1;
}
template <typename Context>
void setContextEnvironment(Context& context, uint64_t generation) {
  if constexpr (requires { context.fontEnvironmentGeneration; }) context.fontEnvironmentGeneration = generation;
}
class FontProbeNode final : public ConcreteViewShadowNode<FontProbeName> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }
  bool shouldNewRevisionDirtyMeasurement(const ShadowNode&, const ShadowNodeFragment& fragment) const override {
    return dirtyOnClone || fragment.props != nullptr;
  }
  Size measureContent(const LayoutContext& context, const LayoutConstraints&) const override {
    ++measures;
    return {100, environmentOnly ? static_cast<Float>(10 * contextEnvironment(context)) : 10 * context.fontSizeMultiplier};
  }
};
using FontProbeDescriptor = ConcreteComponentDescriptor<FontProbeNode>;
}

int runCase(bool preDirtyLeaf, bool changeEnvironmentOnly = false) {
  using namespace facebook::react;
  dirtyOnClone = preDirtyLeaf;
  environmentOnly = changeEnvironmentOnly;
  measures = 0;
  std::printf("{\"cloneAlreadyDirty\":%s,\"environmentOnly\":%s}\n", preDirtyLeaf ? "true" : "false", changeEnvironmentOnly ? "true" : "false");
  auto context = std::make_shared<ContextContainer>();
  ComponentDescriptorProviderRegistry providers;
  providers.add(concreteComponentDescriptorProvider<RootComponentDescriptor>());
  providers.add(concreteComponentDescriptorProvider<ViewComponentDescriptor>());
  providers.add(concreteComponentDescriptorProvider<FontProbeDescriptor>());
  auto registry = providers.createComponentDescriptorRegistry({{}, context, nullptr});
  ComponentBuilder builder{registry};
  auto root = builder.build(Element<RootShadowNode>().tag(1).props([] {
    auto props = std::make_shared<RootProps>();
    props->layoutConstraints = {{0, 0}, {300, 500}};
    setContextEnvironment(props->layoutContext, 1);
    return props;
  }).children({Element<ViewShadowNode>().tag(2).children({Element<FontProbeNode>().tag(3)})}));
  root->layoutIfNeeded();
  root->sealRecursive();
  auto originalView = root->getChildren().at(0);
  auto originalLeaf = originalView->getChildren().at(0);
  auto height = [](const RootShadowNode& node) {
    return static_cast<const LayoutableShadowNode&>(*node.getChildren().at(0)->getChildren().at(0)).getLayoutMetrics().frame.size.height;
  };
  const auto coldHeight = height(*root);
  const auto coldMeasures = measures;
  PropsParserContext parser{-1, *context};
  auto fontContext = root->getConcreteProps().layoutContext;
  if (changeEnvironmentOnly) setContextEnvironment(fontContext, 2);
  else fontContext.fontSizeMultiplier = 2;
  auto live = root->clone(parser, root->getConcreteProps().layoutConstraints, fontContext);
  const bool dirty = !live->getIsLayoutClean();
  const bool laidOut = live->layoutIfNeeded();
  const auto liveHeight = height(*live);
  const auto liveMeasures = measures;
  const auto liveView = std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(live->getChildren().at(0));
  const auto liveLeaf = std::dynamic_pointer_cast<const YogaLayoutableShadowNode>(liveView->getChildren().at(0));
  std::printf("{\"detail\":true,\"viewCloned\":%s,\"leafCloned\":%s,\"viewClean\":%s,\"leafClean\":%s,\"measurable\":%s}\n", liveView.get()!=originalView.get()?"true":"false", liveLeaf.get()!=originalLeaf.get()?"true":"false", liveView->getIsLayoutClean()?"true":"false", liveLeaf->getIsLayoutClean()?"true":"false", liveLeaf->getTraits().check(ShadowNodeTraits::Trait::MeasurableYogaNode)?"true":"false");
  const auto observedScale = live->getConcreteProps().layoutContext.fontSizeMultiplier;
  live->layoutTree(fontContext, root->getConcreteProps().layoutConstraints);
  const auto directHeight = height(*live);
  // Retain the prior failed root-dirty control as a separate assertion. It is
  // never accepted as a repair: this specifically tests the descendant owner.
  live->dirtyLayout();
  live->layoutIfNeeded();
  const auto forcedHeight = height(*live);
  const bool oldPreserved = height(*root) == coldHeight && root->getChildren().at(0) == originalView && originalView->getChildren().at(0) == originalLeaf;
  const bool passed = dirty && laidOut && coldHeight == 10 && liveHeight == 20 && forcedHeight == 20 && liveMeasures > coldMeasures && oldPreserved;
  std::printf("{\"passed\":%s,\"contextCloneDirty\":%s,\"layoutIfNeeded\":%s,\"coldHeight\":%g,\"liveHeight\":%g,\"forcedRootHeight\":%g,\"coldMeasures\":%d,\"liveMeasures\":%d,\"oldSealedTreePreserved\":%s,\"observedRootScale\":%g,\"directLayoutHeight\":%g}\n", passed?"true":"false", dirty?"true":"false", laidOut?"true":"false", coldHeight, liveHeight, forcedHeight, coldMeasures, liveMeasures, oldPreserved?"true":"false", observedScale, directHeight);
  return passed ? 0 : 1;
}

template <typename Key>
void setEnvironment(Key& key, uint64_t generation) {
  if constexpr (requires { key.fontEnvironmentGeneration; }) key.fontEnvironmentGeneration = generation;
}

int cacheEnvironmentCase() {
  using namespace facebook::react;
  AttributedString text;
  AttributedString::Fragment fragment;
  fragment.string = "NUWJ359";
  fragment.textAttributes = TextAttributes::defaultTextAttributes();
  fragment.textAttributes.fontSize = 18;
  fragment.textAttributes.fontSizeMultiplier = 2;
  text.appendFragment(std::move(fragment));
  TextMeasureCache cache{kSimpleThreadSafeCacheSizeCap};
  TextMeasureCacheKey before{.attributedString = text};
  auto after = before;
  setEnvironment(before, 1); setEnvironment(after, 2);
  int calls = 0;
  auto first = cache.get(before, [&] { ++calls; return TextMeasurement{.size = {100, 10}}; });
  auto second = cache.get(after, [&] { ++calls; return TextMeasurement{.size = {100, 20}}; });
  bool passed = first.size.height == 10 && second.size.height == 20 && calls == 2;
  std::printf("{\"cacheEnvironmentPassed\":%s,\"sameTextPropsConstraints\":true,\"keyEqualAfterEnvironmentChange\":%s,\"measureCalls\":%d,\"firstHeight\":%g,\"secondHeight\":%g}\n", passed?"true":"false", before==after?"true":"false", calls, first.size.height, second.size.height);
  return passed ? 0 : 1;
}

int adoptOlderEnvironmentCase() {
  using namespace facebook::react;
  dirtyOnClone = false; environmentOnly = false; measures = 0;
  auto context = std::make_shared<ContextContainer>();
  ComponentDescriptorProviderRegistry providers;
  providers.add(concreteComponentDescriptorProvider<RootComponentDescriptor>());
  providers.add(concreteComponentDescriptorProvider<ViewComponentDescriptor>());
  providers.add(concreteComponentDescriptorProvider<FontProbeDescriptor>());
  ComponentBuilder builder{providers.createComponentDescriptorRegistry({{}, context, nullptr})};
  auto oldRoot = builder.build(Element<RootShadowNode>().tag(11).props([] {
    auto props = std::make_shared<RootProps>(); props->layoutConstraints = {{0, 0}, {300, 500}};
    setContextEnvironment(props->layoutContext, 1); return props;
  }).children({Element<ViewShadowNode>().tag(12).children({Element<FontProbeNode>().tag(13)})}));
  auto height = [](const RootShadowNode& root) { return static_cast<const LayoutableShadowNode&>(*root.getChildren().at(0)->getChildren().at(0)).getLayoutMetrics().frame.size.height; };
  oldRoot->layoutIfNeeded(); oldRoot->sealRecursive();
  auto latestContext = oldRoot->getConcreteProps().layoutContext; latestContext.fontSizeMultiplier = 2; setContextEnvironment(latestContext, 2);
  PropsParserContext parser{-1, *context};
  auto latest = oldRoot->clone(parser, oldRoot->getConcreteProps().layoutConstraints, latestContext);
  latest->layoutIfNeeded(); latest->sealRecursive();
  // The UIManager completion path retries with current root props and children
  // captured by JS before a simultaneous native font-configuration commit.
  auto adopted = std::make_shared<RootShadowNode>(*latest, ShadowNodeFragment{
    .props = ShadowNodeFragment::propsPlaceholder(),
    .children = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(oldRoot->getChildren())});
  const bool dirty = !adopted->getIsLayoutClean();
  adopted->layoutIfNeeded();
  const bool passed = dirty && height(*adopted) == 20 && height(*oldRoot) == 10 && height(*latest) == 20;
  std::printf("{\"olderEnvironmentAdoptionPassed\":%s,\"adoptedRootDirty\":%s,\"oldHeight\":%g,\"latestHeight\":%g,\"adoptedHeight\":%g,\"measureCalls\":%d}\n", passed?"true":"false", dirty?"true":"false", height(*oldRoot), height(*latest), height(*adopted), measures);
  return passed ? 0 : 1;
}

int main() {
  facebook::react::TextAttributes attributes; facebook::react::AttributedString::Fragment fragment;
  const auto fontOffset = reinterpret_cast<const char*>(&attributes.fontSizeMultiplier)-reinterpret_cast<const char*>(&attributes);
  const auto fragmentOffset = reinterpret_cast<const char*>(&fragment.textAttributes)-reinterpret_cast<const char*>(&fragment);
  std::printf("{\"abi\":true,\"layoutContextBytes\":%zu,\"contextFontOffset\":%zu,\"textFontOffset\":%td,\"fragmentTextOffset\":%td}\n", sizeof(facebook::react::LayoutContext), offsetof(facebook::react::LayoutContext, fontSizeMultiplier), fontOffset, fragmentOffset);
  const int stable = runCase(false);
  const int input = runCase(true);
  const int stableEnvironment = runCase(false, true);
  const int inputEnvironment = runCase(true, true);
  const int adoption = adoptOlderEnvironmentCase();
  const int cache = cacheEnvironmentCase();
  return stable || input || stableEnvironment || inputEnvironment || adoption || cache;
}
