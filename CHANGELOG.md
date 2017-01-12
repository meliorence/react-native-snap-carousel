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