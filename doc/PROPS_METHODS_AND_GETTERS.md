# Props, methods and getters

## Table of contents

1. [Props](#props)
    * [Required](#required)
    * [Behavior](#behavior)
    * [Loop](#loop)
    * [Autoplay](#autoplay)
    * [Style and animation](#style-and-animation)
    * [Callbacks](#callbacks)
    * [Inherited props](#inherited-props)
1. [Methods](#methods)
1. [Getters](#getters)

## Props

### Required

Prop | Description | Type | Default
------ | ------ | ------ | ------
**`data`** | Array of items to loop on | Array | **Required**
**`renderItem`** | Takes an item from data and renders it into the list. The function receives one argument `{item, index}` (see [Usage](https://github.com/archriss/react-native-snap-carousel#usage)) and must return a React element. | Function | **Required**
**`itemWidth`** | Width in pixels of carousel's items, **must be the same for all of them** | Number | **Required for __horizontal__ carousel**
**`sliderWidth`** | Width in pixels of the carousel itself | Number | **Required for __horizontal__ carousel**
**`itemHeight`** | Height in pixels of carousel's items, **must be the same for all of them** | Number | **Required for __vertical__ carousel**
**`sliderHeight`** | Height in pixels of the carousel itself | Number | **Required for __vertical__ carousel**

### Behavior

Prop | Description | Type | Default
------ | ------ | ------ | ------
`activeSlideOffset` | From slider's center, minimum slide distance to be scrolled before being set to active. | Number | `20`
`apparitionDelay` | `FlatList`'s init is a real mess, with lots of unneeded flickers and slides movement. This prop controls the delay during which the carousel will be hidden when mounted. **WARNING: on Android, using it may lead to [rendering issues](https://github.com/archriss/react-native-snap-carousel/issues/236) (i.e. images not showing up)**. Make sure to test thoroughly if you decide on using it. | Number | `0`
`callbackOffsetMargin` | Scroll events might not be triggered often enough to get a precise measure and, therefore, to provide a reliable callback. This usually is an Android issue, which might be linked to the version of React Native you're using (see ["Unreliable callbacks"](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/KNOWN_ISSUES.md#unreliable-callbacks)). To work around this, you can define a small margin that will increase the "sweet spot"'s width. The default value should cover most cases, but **you will want to increase it if you experience missed callbacks**. | Number | `5`
`enableMomentum` | See [momentum](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/TIPS_AND_TRICKS.md#momentum) | Boolean | `false`
`enableSnap` | If enabled, releasing the touch will scroll to the center of the nearest/active item | Boolean | `true`
`firstItem` | Index of the first item to display | Number | `0`
`hasParallaxImages` | Whether the carousel contains `<ParallaxImage />` components or not. Required for specific data to be passed to children. | Boolean | `false`
`lockScrollTimeoutDuration` | This prop works in conjunction with `lockScrollWhileSnapping`. When scroll is locked, a timer is created in order to release the scroll if something goes wrong with the regular callback handling. **Normally, you shouldn't have to use this prop.** | Number | `1000`
`lockScrollWhileSnapping` | Prevent the user from swiping again while the carousel is snapping to a position. This prevents miscellaneous minor issues (inadvertently tapping an item while scrolling, stopping the scrolling animation if the carousel is tapped in the middle of a snap, clunky behavior on Android when short snapping quickly in opposite directions). The only drawback is that enabling the prop hinders the ability to swipe quickly between items as a little pause between swipes is needed. **Note that the prop won't have any effect if `enableMomentum` is set to `true`, since it would otherwise impede the natural and expected behavior.** | Boolean | `false`
`shouldOptimizeUpdates` | Whether to implement a `shouldComponentUpdate` strategy to minimize updates | Boolean | `true`
`swipeThreshold` | Delta x when swiping to trigger the snap | Number | `20`
`useScrollView` | Whether to use a `ScrollView` component instead of the default `FlatList` one. The advantages are to avoid rendering issues that can arise with `FlatList` and to provide compatibility with React Native pre- `0.43`. The major drawbacks are that you won't benefit from any of `FlatList`'s advanced optimizations and that you won't be able to use either `VirtualizedList` or `FlatList`'s specific props. **We recommend activating it only with a small set of slides and to test performance thoroughly in production mode.** Since version `3.7.6`, this prop also accepts a custom scroll component (see #498 for more info). | Boolean | `false` for `default` layout, `true` for `stack` and `tinder` layouts
`vertical` | Layout slides vertically instead of horizontally | Boolean | `false`

### Loop

Prop | Description | Type | Default
------ | ------ | ------ | ------
`loop` | Enable infinite loop mode. Note that it won't work if `enableSnap` has been set to `false`. | Boolean | `false`
`loopClonesPerSide` | Number of clones to append to each side of the original items. **When swiping very quickly**, the user will eventually need to pause for a quick second before the scroll is repositioned (this occurs when the end of the set is reached). By increasing this number, the user will be able to scroll more slides before having to stop; but you'll also load more items in memory. This is a trade-off between optimal user experience and performance. | Number | `3`

### Autoplay

Prop | Description | Type | Default
------ | ------ | ------ | ------
`autoplay` | Trigger autoplay on mount. If you enable autoplay, we recommend you to set `enableMomentum` to `false` (default) and `lockScrollWhileSnapping` to `true`; this will enhance user experience a bit. | Boolean | `false`
`autoplayDelay` | Delay before enabling autoplay on startup & after releasing the touch | Number | `1000`
`autoplayInterval` | Delay in ms until navigating to the next item | Number |  `3000`

### Style and animation

Prop | Description | Type | Default
------ | ------ | ------ | ------
`activeAnimationOptions` | Custom animation options. Note that `useNativeDriver` will be enabled by default and that opacity's easing will always be kept linear. **Setting this prop to something other than `null` will trigger custom animations and will completely change the way items are animated**: rather than having their opacity and scale interpolated based the scroll value (default behavior), they will now play the custom animation you provide as soon as they become active. **This means you cannot use props `layout`, `scrollInterpolator` or `slideInterpolatedStyle` in conjunction with `activeAnimationOptions`.** | Object | `null`
`activeAnimationType` | Custom [animation type](https://facebook.github.io/react-native/docs/animated.html#configuring-animations): either `'decay`, `'spring'` or `'timing'`. Note that it will only be applied to the scale animation since opacity's animation type will always be set to `timing` (no one wants the opacity to 'bounce' around). | String | `'timing'`
`activeSlideAlignment` | Determine active slide's alignment relative to the carousel. Possible values are: `'start'`, `'center'` and `'end'`. **It is not recommended to use this prop in conjunction with the `layout` one.** | String | `'center'`
`containerCustomStyle` | Optional styles for Scrollview's global wrapper | View Style Object | `{}`
`contentContainerCustomStyle` | Optional styles for Scrollview's items container | View Style Object | `{}`
`inactiveSlideOpacity` | Value of the opacity effect applied to inactive slides | Number | `0.7`
`inactiveSlideScale` | Value of the 'scale' transform applied to inactive slides | Number | `0.9`
`inactiveSlideShift` | Value of the 'translate' transform applied to inactive slides (see [#204](https://github.com/archriss/react-native-snap-carousel/issues/204) or [the "custom interpolations" doc](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/CUSTOM_INTERPOLATIONS.md) for an example usage). This prop will have no effect with layouts others than the default one. | Number | `0`
`layout` | Define the way items are rendered and animated. Possible values are `'default'`, `'stack'` and `'tinder'`. See [this](https://github.com/archriss/react-native-snap-carousel#layouts-and-custom-interpolations) for more info and visual examples. :warning: **Setting this prop to either `'stack'` or `'tinder'` will activate `useScrollView` [to prevent rendering bugs with `FlatList`](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/CUSTOM_INTERPOLATIONS.md#caveats). Therefore, those layouts won't be suited if you have a large data set since all items are going to be rendered upfront.** | String | `'default'`
`layoutCardOffset` | Use to increase or decrease the default card offset in both 'stack' and 'tinder' layouts. | Number | `18` for the 'stack' layout, `9` for the 'tinder' one
`scrollInterpolator` | Used to define custom interpolations. See [the dedicated doc](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/CUSTOM_INTERPOLATIONS.md#summary). | Function | `undefined`
`slideInterpolatedStyle` | Used to define custom interpolations. See [the dedicated doc](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/CUSTOM_INTERPOLATIONS.md#summary). | Function | `undefined`
`slideStyle` | Optional style for each item's container (the one whose scale and opacity are animated) | Animated View Style Object | `{}`

### Callbacks

Prop | Description | Type | Default
------ | ------ | ------ | ------
`onLayout(event)` | Exposed `View` callback; invoked on mount and layout changes | Function | `undefined`
`onScroll(event)` | Exposed `ScrollView` callback; fired while scrolling | Function | `undefined`
`onBeforeSnapToItem(slideIndex)` | Callback fired when the new active item has been determined, before snapping to it | Function | `undefined`
`onSnapToItem(slideIndex)` | Callback fired after snapping to an item | Function | `undefined`

### Inherited props

The component is built on top of the `FlatList` component, meaning it inherits from [`FlatList`](https://facebook.github.io/react-native/docs/flatlist.html), [`VirtualizedList`](https://facebook.github.io/react-native/docs/virtualizedlist.html), and [`ScrollView`](https://facebook.github.io/react-native/docs/scrollview.html).

You can use almost all props from this three components, but some of them can't be overriden because it would mess with our implementation's logic.

Here are a few useful props regarding carousel's **style and "feeling"**: `scrollEnabled` (if you want to disable user scrolling while still being able to use `Carousel`'s methods), `showsHorizontalScrollIndicator`, `overScrollMode` (android), `bounces` (ios), `decelerationRate` (ios), `scrollEventThrottle` (ios).

And here are some useful ones for **performance optimizations and rendering**: `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, `updateCellsBatchingPeriod`, `extraData`, `removeClippedSubviews` (the latter may have bugs, as stated in [RN's doc](https://facebook.github.io/react-native/docs/flatlist.html#removeclippedsubviews)). The first three are already implemented with default parameters, but you can override them if they don't suit your needs.

## Methods

### Reference to the component

In order to use the following methods, you need to create a reference to the carousel's instance. There are two ways of doing it.

#### ref as a callback attribute (**recommended**)
```javascript
<Carousel
  // other props
  ref={(c) => { this._carousel = c; }}
/>

// methods can then be called this way
onPress={() => { this._carousel.snapToNext(); }}
```

#### ref as a string attribute ([legacy](http://stackoverflow.com/questions/37468913/why-ref-string-is-legacy))
```javascript
<Carousel
  // other props
  ref={'carousel'}
/>

// methods can then be called this way
onPress={() => { this.refs.carousel.snapToNext(); }}
```

### Available methods

Method | Description
------ | ------
`startAutoplay (instantly = false)` | Start the autoplay programmatically
`stopAutoplay ()` | Stop the autoplay programmatically
`snapToItem (index, animated = true, fireCallback = true)` | Snap to an item programmatically
`snapToNext (animated = true, fireCallback = true)` | Snap to next item programmatically
`snapToPrev (animated = true, fireCallback = true)` | Snap to previous item programmatically
`triggerRenderingHack (offset)` | Call this when needed to work around [a random `FlatList` bug](https://github.com/facebook/react-native/issues/1831) that keeps content hidden until the carousel is scrolled (see [#238](https://github.com/archriss/react-native-snap-carousel/issues/238)). Note that the `offset` parameter is not required and will default to either `1` or `-1` depending on the current scroll position.

## Getters

> You need a reference to the carousel's instance (see [above](#reference-to-the-component) if needed).

Property | Description
------ | ------
`currentIndex` | Current active item (`int`, starts at 0)
`currentScrollPosition` | Underlying `ScrollView`'s current content offset (`int`, starts at `0` if `activeSlideAlignment` is set to `start`, negative value otherwise)
