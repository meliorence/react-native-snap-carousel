## v3.8.2

* Fix autoplay stop after user interaction (thanks [@HelloCore](https://github.com/HelloCore))
* Allow using a custom animated image component with `ParallaxImage` (thanks [@DanielMarkiel](https://github.com/DanielMarkiel))

## v3.8.1

* Migrate from deprecated `componentWillReceiveProps` to `componentDidUpdate` (thanks [@kiarashws](https://github.com/kiarashws))
* Use `console.error` instead of `console.warn` for critical warnings (thanks [@bardiarastin](https://github.com/bardiarastin))
* Update parallax doc (thanks [@bardiarastin](https://github.com/bardiarastin))

## v3.8.0

* Set [`removeClippedSubviews`](https://facebook.github.io/react-native/docs/scrollview#removeclippedsubviews) to `false` by default for 'tinder' and 'stack' layouts, or when `useScrollView` is set to `true`. This aims at preventing a bunch of rendering issues.
* Make sure that autoplay is properly restarted after a `touchStart` event
* Allow serialized animated event as `onScroll`. See [#439](https://github.com/archriss/react-native-snap-carousel/pull/439) for more info (thanks [@Jberivera](https://github.com/Jberivera))
* Allow using a custom scroll component. See [#498](https://github.com/archriss/react-native-snap-carousel/pull/498) for more info (thanks [@martinezguillaume](https://github.com/martinezguillaume))
* Prevent loop animation from being played when reaching the end of the dataset. See [#443](https://github.com/archriss/react-native-snap-carousel/pull/443) for more info (thanks [@suhanmoon](https://github.com/suhanmoon))
* Fire the `onTouchStart` prop. See [#464](https://github.com/archriss/react-native-snap-carousel/pull/464) for more info (thanks [@sangle7](https://github.com/sangle7))
* Add accessibilityLabel to `Pagination`. See [#438](https://github.com/archriss/react-native-snap-carousel/pull/438) for more info (thanks [@thymikee](https://github.com/thymikee))
* Allow `contentContainerCustomStyle` to override default paddings. See [#482](https://github.com/archriss/react-native-snap-carousel/pull/482) for more info (thanks [@yamov](https://github.com/yamov))

## v3.7.5
* Fix issue with `scrollEnabled` introduced in version `3.7.3`... again! (thanks [@ifsnow](https://github.com/ifsnow))

## v3.7.4
* Fix issue with `scrollEnabled` introduced in version `3.7.3` (thanks [@JakeRawr](https://github.com/JakeRawr))

## v3.7.3
* Fix faulty animated value and make sure to always check for `data` before checking for `data.length`
* Fix `scrollEnabled` override when it was initially set to `false` (thanks [@JakeRawr](https://github.com/JakeRawr))

## v3.7.2
* Fix `ParallaxImage` not being rendered (thanks [@louiszawadzki](https://github.com/louiszawadzki))

## v3.7.1
* Fix a potential crash in release mode (thanks [@hanpanpan200](https://github.com/hanpanpan200))
* Do not round scroll offset's number in order to prevent potential issues with scroll repositioning

## v3.7.0
### New features and enhancements
* Add a new callback method: [`onBeforeSnapToItem()`](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md#methods)
* Add prop `lockScrollTimeoutDuration`
* Add the ability to enable/disable callback's execution when snaping programmatically
* Add the ability to change `scrollEnabled` to `true` from initially `false` (thanks [@tomauty](https://github.com/tomauty))
### Bugfixes
* Fix random errors when accessing wrapped component's reference
* Fix errors triggered when calling `setState()` while the component has already been unmounted
### Other
* Support `keyExtractor` on `ScrollView` (thanks [@hadimhd](https://github.com/hadimhd))

## v3.6.0
* Add a `layout` prop to let users choose between 3 different carousel layouts (see [the documentation](https://github.com/archriss/react-native-snap-carousel#layouts-and-custom-interpolations))
![react-native-snap-carousel default layout](https://i.imgur.com/e1WbZcu.gif)
![react-native-snap-carousel stack layout](https://i.imgur.com/foMIGM2.gif)
![react-native-snap-carousel tinder layout](https://i.imgur.com/R7OpEFs.gif)
* Add the ability to define dynamic styles based on scroll position with props `scrollInterpolator` and `slideInterpolatedStyle`. This allows implementing custom animations and layouts (see [the dedicated documentation](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/CUSTOM_INTERPOLATIONS.md)).
* Rename props `customAnimationType` and `customAnimationOptions` to `activeAnimationType` and `activeAnimationOptions`

## v3.5.0
* Add the ability to render either a `ScrollView` component or a `FlatList` one (default) ([see prop `useScrollView`](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md#behavior))
* Add support for versions of React Native < `0.43` (see [this note](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/KNOWN_ISSUES.md#react-native-version))
* Add support for custom animations ([see props `customAnimationType` and `customAnimationOptions`](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md#style-and-animation))
* Add method [`triggerRenderingHack()`](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md#available-methods) to work around [a random `FlatList` bug](https://github.com/facebook/react-native/issues/1831) that keeps content hidden until the carousel is scrolled
* Hack around `ScrollView`/`FlatList` image rendering issues on Android
* Fix issue with tappable dots when loop is enabled

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
* Bring in the most wanted 'infinite loop' feature :tada: (see [the 'Loop' section](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md#loop) for more info about the new props `loop` and `loopClonesPerSide`)
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
* Add `ParallaxImage` component (see the specific documentation [here](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PARALLAX_IMAGE.md))
* Add prop `activeSlideAlignment`
* Fix issue with autoplay when setting `scrollEnabled` to `false`
* Prevent going back to the first item when overscrolling the last one
* Prevent callback from being called at the wrong time in some specific scenarios

## v2.4.0
* Add `Pagination` component (see the specific documentation [here](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PAGINATION.md))
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
* Recalculate card positions on layout to handle rotation (thanks [@andrewpope](https://github.com/andrewpope)); make sure to read [this note](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/TIPS_AND_TRICKS.md#handling-device-rotation)
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