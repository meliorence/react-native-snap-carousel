## v3.4.0
* Fix `snapToItem` call that results in snapping to the wrong item when `loop` is enabled
* Fix issue that, in some use cases, prevents every items but the initial ones to be rendered
* On Android, prevent loop and callback issues because scroll offset's value doesn't return an integer
* Add prop `inactiveSlideShift` (see #204)
* Expose `FlatList`'s prop `inverted` (**use at your own risk since it will mess with the current handling of RTL layouts**)
* Set `removeClippedSubviews` to `true` by default

## v3.3.4
* Fix issue with possible faulty index when `loopClonesPerSide` is greater than data length
* Guard against `setNativeProps()` being `undefined`
* On Android, make sure that the first item has the proper active style after init
* On iOS, remove the feature "snap as soon as the previous/next item becomes active when `lockScrollWhileSnapping` is enabled" since it messes with direct calls to `snapToItem()`

## v3.3.3
* Prevent issue on iOS when `enableSnap` is set to `false` while `lockScrollWhileSnapping` is set to `true`

## v3.3.2
* Fix issue with `lockScrollWhileSnapping` when no callback was provided
* `Pagination` component: add props `activeOpacity` and `dotContainerStyle`

## v3.3.1
* Fix issue when initializing the carousel with empty data
* Make tappable `PaginationDot` snaps to the right item when loop is enabled

## v3.3.0
* Bring in the most wanted 'infinite loop' feature :tada: (see [the 'Loop' section](https://github.com/archriss/react-native-snap-carousel#loop) for more info about the new props `loop` and `loopClonesPerSide`)
* Improve Android behavior when momentum is disabled
* Guard against potential errors when component is unmounted
* Add prop `lockScrollWhileSnapping` to improve behavior when momentum is disabled

## v3.2.3
* Fix issue with callback not fired when doing a long swipe

## v3.2.2
* Fix RTL issues
* Fix issue with active item when `enableMomentum` was set to `true`
* Fix issue with overlapping items (thanks [@henninghall](https://github.com/henninghall))
* `ParallaxImage` component: allow overriding default styles
* `Pagination` component: adapt to RTL layouts

## v3.2.1
* Fix issue with active item when no callback has been specified (introduced in version `3.2.0`)

## v3.2.0
* Refactor callback handling. **Make sure to use the new prop `callbackOffsetMargin` if you experience missed callbacks.**
* Make item's scale and opacity animations follow scroll value (thanks [@hammadj](https://github.com/hammadj))
* `Pagination` component: make dots tappable with new props `tappableDots` and `carouselRef` (see the [example](https://github.com/archriss/react-native-snap-carousel/blob/master/example/src/index.js))
* Fix issue when carousel has been unmounted but parent container requires to re-render
* Fix state and scroll issues when the currently active item is being dynamically removed
* Improve snap feeling when momentum is disabled (default)
* Add prop `callbackOffsetMargin`
* Remove props `animationFunc`, `animationOptions`, `scrollEndDragDebounceValue`, `snapOnAndroid`, and `useNativeOnScroll`

## v3.1.0
* `Pagination` component: add new props for advanced customization

## v3.0.0
### WARNING
* **Do not use this version as some temporary code was pushed to `npm` by mistake. Make sure to use version `3.1.0` instead.**
### Breaking changes
* Plugin is now built on top of `FlatList`, which allows for huge performance optimizations. From now on, items must be rendered using props `data` and `renderItem`.
### General
* Add `ParallaxImage` component (see the specific documentation [here](https://github.com/archriss/react-native-snap-carousel/blob/master/src/parallaximage/README.md))
* Add prop `activeSlideAlignment`
* Fix issue with autoplay when setting `scrollEnabled` to `false`
* Prevent going back to the first item when overscrolling the last one
* Prevent callback from being called at the wrong time in some specific scenarios

## v2.4.0
* Add `Pagination` component (see the specific documentation [here](https://github.com/archriss/react-native-snap-carousel/blob/master/src/pagination/README.md))
* Allow `firstItem` to be changed dynamically
* Allow `0` value for `carouselHorizontalPadding` and `carouselVerticalPadding` (thanks [@bonbonez](https://github.com/bonbonez))
* Keep the easing of slide's opacity animation linear
* Use native driver for slide's animation (can be overridden via `animationOptions`)

## v2.3.1
* Fix issue when snap is disabled

## v2.3.0
* Refactor callback handling to provide a more reliable solution when momentum is disabled
* Fix issue with parallel animations (thanks [@jnbt](https://github.com/jnbt))
* Prevent calls to `undefined` interpolators when working with dynamic slides (thanks [@cskaynar](https://github.com/cskaynar))
* Improve vertical mode
* Add prop `scrollEndDragDebounceValue`
* Expose current scroll position with `this.currentScrollPosition`
* Remove props `scrollEndDragThrottleValue` and `snapCallbackDebounceValue` (use `scrollEndDragDebounceValue` instead)

## v2.2.2
* Fix issue that prevented inactive styles of first and last items to be applied when using `snapToPrev` and `snapToNext` methods

## v2.2.1
* Do not mark `sliderWidth` and `sliderHeight` as required
* Add warnings when properties specific to carousel's orientation haven't been set

## v2.2.0
* Implement vertical mode (prop `vertical`)
* Make sure that current active item is properly updated when snapping
* Prevent issues when 'sliderWidth' is smaller than viewport's width
* Recalculate card positions on layout to handle rotation (thanks [@andrewpope](https://github.com/andrewpope)); make sure to read [this note](https://github.com/archriss/react-native-snap-carousel#handling-device-rotation)
* Refresh card positions if slider and/or item's dimensions are updated (thanks [@hoangnm](https://github.com/hoangnm))
* Add props `scrollEndDragThrottleValue` and `snapCallbackDebounceValue`
* Expose `View`'s `onLayout` prop
* Deprecate prop `onScrollViewScroll`

## v2.1.4
* Add prop `onScrollViewScroll`

## v2.1.3
* Default value for `showsHorizontalScrollIndicator` is now `false`
* Expose `ScrollView`'s `onSscroll` prop (thanks [@radko93](https://github.com/radko93))

## v2.1.2
* Do not trigger `onSnapToItem` when snapping back to the same slide (thanks [@rgabs](https://github.com/rgabs))
* Add prop `carouselHorizontalPadding` to override container's inner padding (thanks [@skeie](https://github.com/skeie))

## v2.1.1
* Ensure compatibility with RN 0.43 (previous version of plugin's dependency `react-addons-shallow-compare` was breaking with React 16)
* Fix issue with padding on iOS that could cause the carousel to snap back when its last item was clicked

## v2.1.0
* Add RTL support
* Keep current active item when adding slides dynamically
* Prevent invalid `firstItem` number
* Add prop `activeSlideOffset`

## v2.0.3

* Prevent error when carousel has only one child (thanks [@kevinvandijk](https://github.com/kevinvandijk))
* Fix issue when appending dynamic slides (the first one was ignored)
* Fix edge case that prevented the first slide from being focused when swiping back with momentum enabled
* Bump example's RN version to 0.42.3

## v2.0.2

* Make sure that scroll indicator is hidden by default

## v2.0.1

* Fix un-handled exception with interpolators (thanks [@chitezh](https://github.com/chitezh))

## v2.0.0

* Items are now direct children of the `<Carousel />` component, which makes it easier to use (thanks [@Jonarod](https://github.com/Jonarod))
* Props `items` and `renderItem` have been removed

## v1.6.1

* Due to some touch events being buggy, rework methods so the children will receive touch events on Android

## v1.6.0

* Add prop `enableMomentum`
* Fix an infinite-loop on iOS with momentum enabled
* Fix the snapping effect when releasing touch without interia on iOS with momentum enabled
* Fix autoplay on Android, it should start and stop properly and stop being triggered while swiping
* Use `View.propTypes.style` instead of `PropTypes.number` in styles validation (thanks [@pesakitan22](https://github.com/pesakitan22))

## v1.5.0

* Items length can now be changed on-the-fly (thanks [@superical](https://github.com/superical))
* Now handling momentum (thanks [@FakeYou](https://github.com/FakeYou))

## v1.4.0

* Better update strategy with shallowCompare
* Add `snapToNext()`, `snapToPrev()`, `currentIndex` methods and properties

## v1.3.1

* Properly center on first item when mounting component on Android (potentially iOS too)

## v1.3.0

* Pass the item data as the 2nd param of `onSnapToItem` callback

## v1.2.1

* Fix reference call when the component has been unmounted

## v1.2.0

* Add prop `onSnapToItem`

## v1.1.0

* Center slides properly
* Handle one slide only
* Add props `inactiveSlideScale`, `inactiveSlideOpacity`, `containerCustomStyle` and `contentContainerCustomStyle`