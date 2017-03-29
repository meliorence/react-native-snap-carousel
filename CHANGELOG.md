## v2.1.0
* Add RTL support
* Keep current active item when adding slides dynamically
* Prevent invalid `firstItem` number
* Add prop `activeSlideOffset`

## v2.0.3

* Prevent error when carousel has only one child (thanks [@kevinvandijk](https://github.com/kevinvandijk) !)
* Fix issue when appending dynamic slides (the first one was ignored)
* Fix edge case that prevented the first slide from being focused when swiping back with momentum enabled
* Bump example's RN version to 0.42.3

## v2.0.2

* Make sure that scroll indicator is hidden by default

## v2.0.1

* Fix un-handled exception with interpolators (thanks [@chitezh](https://github.com/chitezh) !)

## v2.0.0

* Items are now direct children of the <Carousel> component, which makes it easier to use (thanks [@Jonarod](https://github.com/Jonarod) !)
* Props `items` and `renderItem` have been removed

## v1.6.1

* Due to some touch events being buggy, rework methods so the children will receive touch events on Android

## v1.6.0

* Add `enableMomentum` prop
* Fix an infinite-loop on iOS with momentum enabled
* Fix the snapping effect when releasing touch without interia on iOS with momentum enabled
* Fix autoplay on Android, it should start and stop properly and stop being triggered while swiping
* Use `View.propTypes.style` instead of `PropTypes.number` in styles validation (thanks [@pesakitan22](https://github.com/pesakitan22) !)

## v1.5.0

* Items length can now be changed on-the-fly (thanks [@superical](https://github.com/superical) !)
* Now handling momentum (thanks [@FakeYou](https://github.com/FakeYou) !)

## v1.4.0

* Better update strategy with shallowCompare
* Add `snapToNext()`, `snapToPrev()`, `currentIndex` methods and properties

## v1.3.1

* Properly center on first item when mounting component on Android (potentially iOS too)

## v1.3.0

* Pass the item data as the 2nd param of onSnapToItem callback

## v1.2.1

* Fix reference call when the component has been unmounted

## v1.2.0

* Add onSnapToItem prop

## v1.1.0

* Center slides properly
* Handle one slide only
* Add props 'inactiveSlideScale', 'inactiveSlideOpacity', 'containerCustomStyle' and 'contentContainerCustomStyle'