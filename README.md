# react-native-snap-carousel
Swiper component for React Native featuring **previews**, **snapping effect**, **parallax images**, **performant handling of huge numbers of items**, and **RTL support**. Compatible with Android & iOS.

![platforms](https://img.shields.io/badge/platforms-Android%20%7C%20iOS-brightgreen.svg?style=flat-square)
[![npm](https://img.shields.io/npm/v/react-native-snap-carousel.svg?style=flat-square)](https://www.npmjs.com/package/react-native-snap-carousel)
[![github release](https://img.shields.io/github/release/archriss/react-native-snap-carousel.svg?style=flat-square)](https://github.com/archriss/react-native-snap-carousel/releases)
[![github issues](https://img.shields.io/github/issues/archriss/react-native-snap-carousel.svg?style=flat-square)](https://github.com/archriss/react-native-snap-carousel/issues)
[![github closed issues](https://img.shields.io/github/issues-closed/archriss/react-native-snap-carousel.svg?style=flat-square)](https://github.com/archriss/react-native-snap-carousel/issues?q=is%3Aissue+is%3Aclosed)

## Table of contents

1. [Showcase](#showcase)
1. [Usage](#usage)
1. [Migration from version 2.x](#migration-from-version-2x)
1. [Props](#props)
1. [Methods](#methods)
1. [Getters](#getters)
1. [Example](#example)
1. [`ParallaxImage` component](#parallaximage-component)
1. [`Pagination` component](#pagination-component)
1. [Tips and tricks](#tips-and-tricks)
1. [Known issues](#known-issues)
1. [TODO](#todo)
1. [Credits](#credits)

## Showcase

### Archriss' "Ville d'Aix-en-Provence" app

**The React Native version of this app (6.0.0) is going to be available on [Android](https://play.google.com/store/apps/details?id=fr.archriss.aixmobile.app) and [iOS](https://itunes.apple.com/fr/app/ville-daix-en-provence/id494548366?mt=8) by mid-september** (the current one is Cordova-powered). It uses **version 3.0.0** of the plugin, with `FlatList`'s implementation and [parallax images](#parallaximage-component).

![react-native-snap-carousel archriss aix](http://i.imgur.com/vmMp520.gif)
![react-native-snap-carousel archriss aix](http://i.imgur.com/OdQUYHS.gif)

### Archriss' showcase app

**You can try the app live on [Android](https://play.google.com/store/apps/details?id=fr.archriss.demo.app) and [iOS](https://itunes.apple.com/lu/app/archriss-presentation-mobile/id1180954376?mt=8).** It currently uses **version 1.4.0** of the plugin. Be aware that sliders' layouts will break on RTL devices since support was added in version 2.1.0 (see [#38](https://github.com/archriss/react-native-snap-carousel/issues/38)).

![react-native-snap-carousel](http://i.imgur.com/Fope3uj.gif)
![react-native-snap-carousel](http://i.imgur.com/WNOBYfl.gif)
![react-native-snap-carousel](http://i.imgur.com/sK5DKaG.gif)

> Please note that **we do not plan on Open-Sourcing the code of our showcase app**. Still, we've put together [an example](#example) for you to play with, and you can find some insight about our map implementation [in this comment](https://github.com/archriss/react-native-snap-carousel/issues/11#issuecomment-265147385).
> The folks at [codedaily.io](https://codedaily.io) have put together a great tutorial about implementing a similar feature. [Go check it out!](https://codedaily.io/tutorials/9/Build-a-Map-with-Custom-Animated-Markers-and-Region-Focus-when-Content-is-Scrolled-in-React-Native)

## Usage

```
$ npm install --save react-native-snap-carousel
```

```javascript
import Carousel from 'react-native-snap-carousel';

export class MyCarousel extends Component {

    _renderItem ({item, index}) {
        return (
            <View style={styles.slide}>
                <Text style={styles.title}>{ item.title }</Text>
            </View>
        );
    }

    render () {
        return (
            <Carousel
              ref={(c) => { this._carousel = c; }}
              data={this.state.entries}
              renderItem={this._renderItem}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
            />
        );
    }
}
```

## Migration from version 2.x

Slides are no longer appended as direct children of the component. There are two new props that takes care of their rendering: `data` and `renderItem` (both are inherited from `FlatList`).

If you were already looping throught an array of data to populate the carousel, the migration is pretty straightforward. Just pass your slides' data to the `data` prop, convert your slides' getter to a function and pass it to the `renderItem` prop: you're good to go!

**From**
```javascript
    get slides () {
        return this.state.entries.map((entry, index) => {
            return (
                <View key={`entry-${index}`} style={styles.slide}>
                    <Text style={styles.title}>{ entry.title }</Text>
                </View>
            );
        });
    }

    render () {
        return (
            <Carousel
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
            >
                { this.slides }
            </Carousel>
        );
    }
```

**To**
```javascript
    _renderItem ({item, index}) {
        return (
            <View style={styles.slide}>
                <Text style={styles.title}>{ item.title }</Text>
            </View>
        );
    }

    render () {
        return (
            <Carousel
              data={this.state.entries}
              renderItem={this._renderItem}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
            />
        );
    }
```

> Note that the `key` prop is no longer needed for carousel's items. If you want to provide a custom key, you should pass your own [`keyExtractor`](https://facebook.github.io/react-native/docs/flatlist.html#keyextractor) to the `<Carousel />`.

If you were previously appending random types of children, you will need to rely on a specific bit of data to return the proper element from your `renderItem` function.

**Example**
```javascript
    _renderItem ({item, index}) {
        if (item.type === 'text') {
            return <Text style={styles.textSlide} />;
        } else if (item.type === 'image') {
            return <Image style={styles.imageSlide} />;
        } else {
            return <View style={styles.viewSlide} />;
        }
    }
```

## Props

### Required

Prop | Description | Type | Default
------ | ------ | ------ | ------
**data** | Array of items to loop on | Array | **Required**
**renderItem** | Takes an item from data and renders it into the list. The function receives one argument `{item, index}` (see [Usage](#usage)) and must return a React element. | Function | **Required**
**itemWidth** | Width in pixels of carousel's items, **must be the same for all of them** | Number | **Required for __horizontal__ carousel**
**sliderWidth** | Width in pixels of the carousel itself | Number | **Required for __horizontal__ carousel**
**itemHeight** | Height in pixels of carousel's items, **must be the same for all of them** | Number | **Required for __vertical__ carousel**
**sliderHeight** | Height in pixels of the carousel itself | Number | **Required for __vertical__ carousel**

### Behavior

Prop | Description | Type | Default
------ | ------ | ------ | ------
activeSlideOffset | From slider's center, minimum slide distance to be scrolled before being set to active | Number | `25`
apparitionDelay | `FlatList`'s init is a real mess, with lots of unneeded flickers and slides movement. This prop controls the delay during which the carousel will be hidden when mounted. | Number | `250`
enableMomentum | See [momentum](#momentum) | Boolean | `false`
enableSnap | If enabled, releasing the touch will scroll to the center of the nearest/active item | Boolean | `true`
firstItem | Index of the first item to display | Number | `0`
hasParallaxImages | Whether the carousel contains `<ParallaxImage />` components or not. Required for specific data to be passed to children. | Boolean | `false`
scrollEndDragDebounceValue | **When momentum is disabled**, this prop defines the timeframe during which multiple callback calls should be "grouped" into a single one. This debounce also helps smoothing the snap effect by providing a bit of inertia when touch is released. **Note that this will delay callback's execution.** | Number | `50` for iOS, `150` for Android
shouldOptimizeUpdates | Whether to implement a `shouldComponentUpdate` strategy to minimize updates | Boolean | `true`
snapOnAndroid | Snapping on android is sometimes choppy, especially when swiping quickly, so you can disable it | Boolean | `true`
swipeEnabled | When disabled, the view cannot be scrolled via touch interaction. It takes advantage of `ScrollView`'s prop `scrollEnabled`, with just a tiny tweak regarding autoplay. | Boolean | `true`
swipeThreshold | Delta x when swiping to trigger the snap | Number | `20`
useNativeOnScroll | Move `onScroll` events to the native thread in order to prevent the tiny lag associated with RN's JS bridge. **Activate this if you have a `transform` and/or `opacity` animation that needs to follow carousel's scroll position closely**. More info in [this post](https://facebook.github.io/react-native/blog/2017/02/14/using-native-driver-for-animated.html). Note that it will be activated if `hasParallaxImages` is set to `true` and/or if `scrollEventThrottle` is set to less than `16`. | Boolean | `false`
vertical | Layout slides vertically instead of horizontally | Boolean | `false`

### Autoplay

Prop | Description | Type | Default
------ | ------ | ------ | ------
autoplay | Trigger autoplay on mount. **Warning: this prop cannot be changed dynamically.** | Boolean | `false`
autoplayDelay | Delay before enabling autoplay on startup & after releasing the touch | Number | `5000`
autoplayInterval | Delay in ms until navigating to the next item | Number |  `3000`

### Style and animation

Prop | Description | Type | Default
------ | ------ | ------ | ------
activeSlideAlignment | Determine active slide's alignment relative to the carousel. Possible values are: `'start'`, `'center'` and `'end'`. | String | `'center'`
animationFunc | Animated animation to use; you must provide the name of the method. Note that it will only be applied to the scale animation since opacity's animation type will always be set to `timing` (no one wants the opacity to 'bounce' around) | String | `timing`
animationOptions | Animation options to be merged with the default ones. Can be used without `animationFunc`. Note that opacity's easing will be kept linear. | Object | `{ duration: 600, easing: Easing.elastic(1) }`
containerCustomStyle | Optional styles for Scrollview's global wrapper | View Style Object | `{}`
contentContainerCustomStyle | Optional styles for Scrollview's items container | View Style Object | `{}`
inactiveSlideOpacity | Value of the opacity effect applied to inactive slides | Number | `1`
inactiveSlideScale | Value of the 'scale' transform applied to inactive slides | Number | `0.9`
slideStyle | Optional style for each item's container (the one whose scale and opacity are animated) | Animated View Style Object | {}

### Callbacks

Prop | Description | Type | Default
------ | ------ | ------ | ------
onLayout(event) | Exposed `View` callback; invoked on mount and layout changes | Function | `undefined`
onScroll(event) | Exposed `ScrollView` callback; fired while scrolling | Function | `undefined`
onSnapToItem(slideIndex) | Callback fired when navigating to an item | Function | `undefined`

### Inherited props

The component is built on top of the `FlatList` component, meaning it inherits from [`FlatList`](https://facebook.github.io/react-native/docs/flatlist.html), [`VirtualizedList`](https://facebook.github.io/react-native/docs/virtualizedlist.html), and [`ScrollView`](https://facebook.github.io/react-native/docs/scrollview.html).

You can use almost all props from this three components, but some of them can't be overriden because it would mess with our implementation's logic.

Here are a few useful props regarding carousel's **style and "feeling"**: `showsHorizontalScrollIndicator`, `scrollEnabled` (if you want to scroll only programmatically), `overScrollMode` (android), `bounces` (ios), `decelerationRate` (ios), `scrollEventThrottle` (ios).

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
`startAutoplay (instantly = false)` | Start the autoplay manually
`stopAutoplay ()` | Stop the autoplay manually
`snapToItem (index, animated = true)` | Snap to an item manually
`snapToNext (animated = true)` | Snap to next item manually
`snapToPrev (animated = true)` | Snap to previous item manually

## Getters

> You need a reference to the carousel's instance (see [above](#reference-to-the-component) if needed).

Property | Description
------ | ------
`currentIndex` | Current active item (`int`, starts at 0)
`currentScrollPosition` | Underlying `ScrollView`'s current content offset (`int`, starts at `0` if `activeSlideAlignment` is set to `start`, negative value otherwise)

## Example
You can find the following example in the [/example](https://github.com/archriss/react-native-snap-carousel/tree/master/example) folder.

![react-native-snap-carousel](http://i.imgur.com/m0297Ys.gif)

## `ParallaxImage` component

Version `3.0.0` introduced a `<ParallaxImage />` component, an image component aware of carousel's current scroll position and therefore able to display a nice parallax effect.

![react-native-snap-carousel parallax image](http://i.imgur.com/6iIb4SR.gif)

You can find the documentation for this component [here](https://github.com/archriss/react-native-snap-carousel/blob/flatlist/src/parallaximage/README.md).

## `Pagination` component

Starting with version `2.4.0`, a customizable `<Pagination />` component has been added. This is how it looks like with its default configuration:

![react-native-snap-carousel pagination](http://i.imgur.com/FLQcGGL.gif)

You can find the documentation for this component [here](https://github.com/archriss/react-native-snap-carousel/blob/master/src/pagination/README.md).

## Tips and tricks

### Momentum

Since version `1.5.0`, the snapping effect can be based on momentum (by setting `enableMomentum` to `true`) instead of when you're releasing your finger. It means that the component will wait until the `ScrollView` isn't moving anymore to snap.

By default, the inertia isn't too high on Android. However, we had to tweak the default iOS value a bit to make sure the snapping isn't delayed for too long. You can adjust this value to your needs thanks to [this prop](https://facebook.github.io/react-native/docs/scrollview.html#decelerationrate).

If momentum is disabled (default behavior), make sure to play with prop `scrollEndDragDebounceValue` since it can help achieving a better snap feeling.

> **We recommend setting `enableMomentum` to `false` (default) and `decelerationRate` to `'fast'` when you are displaying only one main slide** (as in the showcase above), and to use `true` and `0.9` otherwise.

### Margin between slides
If you need some **extra horizontal margin** between slides (besides the one resulting from the scale effect), you should add it as `paddingHorizontal` on slide's container. Make sure to take this into account when calculating item's width.

```javascript
const horizontalMargin = 20;
const slideWidth = 280;

const sliderWidth = Dimensions.get('window').width;
const itemWidth = slideWidth + horizontalMargin * 2;
const itemHeight = 200;

const styles = Stylesheet.create({
    slide: {
        width: itemWidth,
        height: itemHeight
        // other styles for your item's container
    }
};
```

### Handling device rotation

Since version 2.2.0, slides will re-center properly if you update slider and/or items' dimensions when `onLayout` is fired.

Here is an example of a working implementation (thanks [@andrewpope](https://github.com/archriss/react-native-snap-carousel/pull/76#issuecomment-306187425)):

```
constructor(props) {
    super(props);
    this.state = {
        viewport: {
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height
        }
    };
}

render() {
    return (
        <View
            onLayout={() => {
                this.setState({
                    viewport: {
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height
                    }
                });
            }}
        >
            <Carousel
                ref={c => { this.carousel = c; } }
                sliderWidth={this.state.viewport.width}
                itemWidth={this.state.viewport.width}
                ...
            />
        </View>
    );
}
```

### Fullscreen slides

While the plugin hasn't been designed with this use case in mind, you can easily implement fullscreen slides. The following code should serve as a good starting point.

```javascript
const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

export class MyCarousel extends Component {

    _renderItem ({item, index}) {
        return (
            <View style={{ height: viewportHeight }} /> // or { flex: 1 } for responsive height
        );
    }

    render () {
        return (
            <Carousel
              data={this.state.entries}
              renderItem={this._renderItem}
              sliderWidth={viewportWidth}
              itemWidth={viewportWidth}
              slideStyle={{ width: viewportWidth }}
              inactiveSlideOpacity={1}
              inactiveSlideScale={1}
            />
        );
    }
}
```

[This plugin](https://github.com/shichongrui/react-native-on-layout) can also prove useful.

### Android performances

Make sure to test carousel's performances **without JS Dev Mode enabled**.

It can take user experience from "crappy and sluggish" to "pretty good" - it's Android though, so nothing like "perfect" or "incredibly smooth"...


### Understanding styles

Here is a screenshot that should help you understand how each of the above variables is used.

![react-native-snap-carousel info](http://i.imgur.com/PMi6aBd.jpg)

## Known issues

### FlatList and ScrollView's limitations

Note that this plugin is built on top of React Native's `FlatList` which, in turn, is based on `ScrollView`. Unfortunately, its implementation shows flaws that affect the plugin, the main ones being the following:
- there is no `scrollEnd` event
- `scrollTo` method doesn't accept any callback
- Android's `scrollTo` animation is quite brutal.

On top of that, `FlatList` has its own set of bugs and buggy behaviors.

We're trying to work around these issues, but the result is not always as smooth as we'd want it to be. Keep that in mind and go spam [React Native's Feature Request](https://react-native.canny.io/feature-requests) ;-)

### Unreliable callbacks

When `enableMomentum` is disabled, providing a reliable callback is really tricky since no `scrollEnd` event has been exposed yet for the `ScrollView` component. We can only rely on the `scrollDragEnd` event, which comes with a huge bunch of issues. See [#34](https://github.com/archriss/react-native-snap-carousel/issues/34) for more information.

Version 2.3.0 tackled these issues with a bunch of flags and hacks. But you could still be facing the following one: **when you build a debug version of your app without enabling JS remote debugging**, timers will desynchronize and callbacks will be a complete mess. Try to either enable remote debugging or build a production version of your app, and everything should get back to normal.

### Error with Jest

You might encounter the following error when using the plugin in conjonction with Jest: `TypeError: Cannot read property 'style' of undefined at Object.<anonymous>`.

As you can see [here](https://github.com/facebook/react-native/blob/master/jest/setup.js), this is because React Native mocks `ScrollView` for you when you write unit tests with Jest.

The easiest workaround is to add `jest.unmock('ScrollView')` before importing the component in your test file (thanks [@hoangnm](https://github.com/hoangnm) for the tip!).

### React Native version

**RN 0.44.x is the minimum version required to use the plugin.**

Bear in mind that we follow RN evolutions closely, which means newer versions of the plugin might break when used in conjunction with a version of RN that is not the latest stable one.

### RTL support (experimental)

Since version 2.1.0, the plugin is compatible with RTL layouts. Our implementation relies on miscellaneous hacks that work around a [React Native bug](https://github.com/facebook/react-native/issues/11960) with horizontal `ScrollView`.

As such, this feature should be considered experimental since it might break with newer versions of React Native.

## TODO

- [ ] Implement 'loop' mode
- [ ] Handle changing major props on-the-fly
- [ ] Handle autoplay properly when updating children's length
- [x] Add parallax image component
- [x] Base the plugin on `FlatList` instead of `ScrollView`
- [x] Add alignment option
- [x] Add pagination component
- [x] Add vertical implementation
- [x] Handle device orientation event (see [this note] (https://github.com/archriss/react-native-snap-carousel#handling-device-rotation))
- [x] Add RTL support
- [x] Improve momemtum handling
- [x] Improve snap on Android
- [x] Handle passing 1 item only
- [x] Fix centering

## Credits

Written by [Maxime Bertonnier](https://fr.linkedin.com/in/maxime-bertonnier-744351aa) ([Exilz](https://github.com/Exilz)) and [Benoît Delmaire](https://fr.linkedin.com/in/benoitdelmaire) ([bd-arc](https://github.com/bd-arc)) at
[Archriss](http://www.archriss.com/).
