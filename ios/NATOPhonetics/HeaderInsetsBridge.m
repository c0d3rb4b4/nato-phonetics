#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(NatoHeaderInsetsManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, RCTDirectEventBlock)
@end
