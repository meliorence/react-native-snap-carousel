## v2.4.0
* Add `Pagination` component (see the specific documentation [here](https://github.com/archriss/react-native-snap-carousel/src/pagination))
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