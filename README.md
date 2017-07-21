# react-native-snap-carousel
Swiper component for React Native with **previews**, **snapping effect** and **RTL support**. Compatible with Android & iOS.
Pull requests are very welcome!

## Table of contents

1. [Showcase](#showcase)
1. [Usage](#usage)
1. [Props](#props)
1. [Methods](#methods)
1. [Getters](#getters)
1. [Example](#example)
1. [Pagination component](#pagination-component)
1. [Tips and tricks](#tips-and-tricks)
1. [Known issues](#known-issues)
1. [RTL support (experimental)](#rtl-support-experimental)
1. [TODO](#todo)
1. [Credits](#credits)

## Showcase

You can try these examples live in **Archriss' showcase app** on [Android](https://play.google.com/store/apps/details?id=fr.archriss.demo.app) and [iOS](https://itunes.apple.com/lu/app/archriss-presentation-mobile/id1180954376?mt=8).

![react-native-snap-carousel](http://i.imgur.com/Fope3uj.gif)
![react-native-snap-carousel](https://media.giphy.com/media/3o6ZsU9gWWrvYtogow/giphy.gif)
![react-native-snap-carousel](https://media.giphy.com/media/3o7TKUAlvi1tYLFCTK/giphy.gif)

> Please note that **we do not plan on Open-Sourcing the code of our showcase app**. Still, we've put together [an example](#example) for you to play with, and you can find some insight about our map implementation [in this comment](https://github.com/archriss/react-native-snap-carousel/issues/11#issuecomment-265147385).

> [codedaily.io](https://codedaily.io) has put together a great tutorial about implementing a similar feature. [Go check it out!](https://codedaily.io/tutorials/9/Build-a-Map-with-Custom-Animated-Markers-and-Region-Focus-when-Content-is-Scrolled-in-React-Native)

App currently uses version 1.4.0 of the plugin. Especially, this means that you should expect **slider's layout to break with RTL devices** (see [#38](https://github.com/archriss/react-native-snap-carousel/issues/38)) since support was added in version 2.1.0.

## Usage

```
$ npm install --save react-native-snap-carousel
```

```javascript
import Carousel from 'react-native-snap-carousel';

    // Example with different children
    render () {
        return (
            <Carousel
              ref={(carousel) => { this._carousel = carousel; }}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
            >
                <View style={styles.slide1} />
                <Text style={styles.slide2} />
                <Image style={styles.slide3} />
            </Carousel>
        );
    }

    // Example of appending the same component multiple times while looping through an array of data
    render () {
        const slides = this.state.entries.map((entry, index) => {
            return (
                <View key={`entry-${index}`} style={styles.slide}>
                    <Text style={styles.title}>{ entry.title }</Text>
                </View>
            );
        });

        return (
            <Carousel
              ref={(carousel) => { this._carousel = carousel; }}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
            >
                { slides }
            </Carousel>
        );
    }
```

## Props

### Required

Prop | Description | Type | Default
------ | ------ | ------ | ------
**itemWidth** | Width in pixels of carousel's items, **must be the same for all of them** | Number | **Required with horizontal carousel**
**itemHeight** | Height in pixels of carousel's items, **must be the same for all of them** | Number | **Required with vertical carousel**
**sliderWidth** | Width in pixels of the carousel itself | Number | **Required with horizontal carousel**
**sliderHeight** | Height in pixels of the carousel itself | Number | **Required with vertical carousel**

### Behavior

Prop | Description | Type | Default
------ | ------ | ------ | ------
activeSlideOffset | From slider's center, minimum slide distance to be scrolled before being set to active | Number | `25`
enableMomentum | See [momentum](#momentum). **Warning: this prop can't be changed dynamically.** | Boolean | `false`
enableSnap | If enabled, releasing the touch will scroll to the center of the nearest/active item. **Warning: this prop can't be changed dynamically.** | Number | `true`
firstItem | Index of the first item to display | Number | `0`
scrollEndDragDebounceValue | **When momentum is disabled**, this prop defines the timeframe during which multiple callback calls should be "grouped" into a single one. This debounce also helps smoothing the snap effect by providing a bit of inertia when touch is released.. **Note that this will delay callback's execution.** | Number | `50` for iOS, `150` for Android
shouldOptimizeUpdates | Whether to implement a `shouldComponentUpdate` strategy to minimize updates | Boolean | `true`
snapOnAndroid | Snapping on android is kinda choppy, especially when swiping quickly so you can disable it. **Warning: this prop can't be changed dynamically.** | Boolean | `true`
swipeThreshold | Delta x when swiping to trigger the snap | Number | `20`
vertical | Layout slides vertically instead of horizontally | Boolean | `false`

### Autoplay

Prop | Description | Type | Default
------ | ------ | ------ | ------
autoplay | Trigger autoplay on mount. **Warning: this prop can't be changed dynamically.** | Boolean | `false`
autoplayDelay | Delay before enabling autoplay on startup & after releasing the touch | Number | `5000`
autoplayInterval | Delay in ms until navigating to the next item | Number |  `3000`

### Style and animation

Prop | Description | Type | Default
------ | ------ | ------ | ------
animationFunc | Animated animation to use; you must provide the name of the method. Note that it will only be applied to the scale animation since opacity's animation type will always be set to `timing` (no one wants the opacity to 'bounce' around) | String | `timing`
animationOptions | Animation options to be merged with the default ones. Can be used without `animationFunc`. Note that opacity's easing will be kept linear. | Object | `{ duration: 600, easing: Easing.elastic(1) }`
carouselHorizontalPadding | Override container's inner horizontal padding (needed for slides's centering in a horizontal carousel). **Warning: be aware that overriding the default value can mess with carousel's behavior.**  | Number | `(sliderWidth - itemWidth) / 2`
carouselVerticalPadding | Override container's inner vertical padding (needed for slides's centering in a vertical carousel). **Warning: be aware that overriding the default value can mess with carousel's behavior.**  | Number | `(sliderHeight - itemHeight) / 2`
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
onScrollViewScroll(event) | Callback fired while scrolling (**deprecated**: use `onScroll` instead) | Function | `undefined`
onSnapToItem(slideIndex) | Callback fired when navigating to an item | Function | `undefined`

### `ScrollView`

In addition to these props, you can use **any prop from the [ScrollView component](https://facebook.github.io/react-native/docs/scrollview.html)**.

Here are a few useful ones: `removeClippedSubviews`, `showsHorizontalScrollIndicator`, `overScrollMode` (android), `bounces` (ios), `decelerationRate` (ios), `scrollEventThrottle` (ios).

## Methods

### Reference to the component

In order to use the following methods, you need to create a reference to the carousel's instance. There are two ways of doing it.

#### ref as a callback attribute (**recommended**)
```javascript
<Carousel
  // other props
  ref={(carousel) => { this._carousel = carousel; }}
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
`currentScrollPosition` | Underlying `ScrollView`'s current content offset (`int`, starts at 0)

## Example
You can find the following example in the [/example](https://github.com/archriss/react-native-snap-carousel/tree/master/example) folder.

![react-native-snap-carousel](http://i.imgur.com/FxMg5md.gif)

## Pagination component

Starting with version `2.4.0`, a `<Pagination />` component has been added. Here is how it looks like:

![react-native-snap-carousel pagination](http://i.imgur.com/QF6I8HN.gif)

You can find the documentation for this component [here](https://github.com/archriss/react-native-snap-carousel/src/pagination).

## Tips and tricks

### Momentum

Since version `1.5.0`, the snapping effect can now be based on momentum instead of when you're releasing your finger. It means that the component will wait until the `ScrollView` isn't moving anymore to snap. By default, the inertia isn't too high on Android. However, we had to tweak the default iOS value a bit to make sure the snapping isn't delayed for too long.
You can adjust this value to your needs thanks to [this prop](https://facebook.github.io/react-native/docs/scrollview.html#decelerationrate).

Make sure to also play with prop `scrollEndDragDebounceValue` since it can help achieving a better snap feeling when momentum is disabled.

> As a rule of thumb, **we recommend setting `enableMomentum` to `false` (default) and `decelerationRate` to `'fast'` when you are displaying only one main slide** (as in the showcase above), and to use `true` and `0.9` otherwise.

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

return (
    <Carousel
      sliderWidth={sliderWidth}
      itemWidth={itemWidth}
    >
        <View style={styles.slide} />
        <View style={styles.slide} />
        <View style={styles.slide} />
    </Carousel>
);

```

### Handling device rotation

Since version 2.2.0, slides will re-center properly if you update slider and/or items's dimensions when `onLayout` is fired.

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
                ref={carousel => { this.carousel = carousel; } }
                sliderWidth={this.state.viewport.width}
                itemWidth={this.state.viewport.width}
                ...
            >
            </Carousel>
        </View>
    );
}
```

### Fullscreen slides

While the plugin hasn't been designed with this use case in mind, you can easily implement fullscreen slides. The following code should serve as a good starting point.

```javascript
const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

return (
    <Carousel
      sliderWidth={viewportWidth}
      itemWidth={viewportWidth}
      slideStyle={{ width: viewportWidth }}
      inactiveSlideOpacity={1}
      inactiveSlideScale={1}
    >
        <View style={{ height: viewportHeight }} /> // or { flex: 1 } for responsive height
        <View style={{ height: viewportHeight }} /> // or { flex: 1 } for responsive height
        <View style={{ height: viewportHeight }} /> // or { flex: 1 } for responsive height
    </Carousel>
);
```

[This plugin](https://github.com/shichongrui/react-native-on-layout) can also prove useful.

### Android performances

Make sure to test carousel's performances **without JS Dev Mode enabled**.

It can take user experience from "crappy and sluggish" to "pretty good" - it's Android though, so nothing like "perfect" or "incredibly smooth"...


### Understanding styles

Here is a screenshot that should help you understand how each of the above variables is used.

![react-native-snap-carousel info](http://i.imgur.com/PMi6aBd.jpg)

## Known issues

### ScrollView's limitations

Note that this plugin is built on top of React Native's `ScrollView`. Unfortunately, its implementation shows flaws that affect the plugin, the main ones being the following:
- there is no `scrollEnd` event
- `scrollTo` method doesn't accept any callback
- Android's `scrollTo` animation is quite brutal.

We're trying to work around these issues, but the result is not always as smooth as we'd want it to be. Keep that in mind and go spam [React Native's Feature Request](https://react-native.canny.io/feature-requests) ;-)

### Unreliable callbacks

When `enableMomentum` is disabled, providing a reliable callback is really tricky since no `scrollEnd` event has been exposed yet for the `ScrollView` component. We can only rely on the `scrollDragEnd` event, which comes with a huge bunch of issues. See [#34](https://github.com/archriss/react-native-snap-carousel/issues/34) for more information.

Version 2.3.0 tackled these issues with a bunch of flags and hacks. But you could still be facing the following one: **when you build a debug version of your app without enabling JS remote debugging**, timers will desynchronize and callbacks will be a complete mess. Try to either enable remote debugging or build a production version of your app, and everything should get back to normal.

### Error with Jest

You might encounter the following error when using the plugin in conjonction with Jest: `TypeError: Cannot read property 'style' of undefined at Object.<anonymous>`.

As you can see [here](https://github.com/facebook/react-native/blob/master/jest/setup.js), this is because React Native mocks `ScrollView` for you when you write unit tests with Jest.

The easiest workaround is to add `jest.unmock('ScrollView')` before importing the component in your test file (thanks [@hoangnm](https://github.com/hoangnm) for the tip!).

### RTL layouts

There is one kown issue with RTL layouts: during init, the last slide will shortly be seen. You can work around this by delaying slider's visibility with a small timer (FYI, version 0.43.0 of React Native [introduced a `display` style prop](https://github.com/facebook/react-native/commit/4d69f4b2d1cf4f2e8265fe5758f28086f1b67500) that could either be set to `flex` or `none`).

## RTL support (experimental)

Since version 2.1.0, the plugin is compatible with RTL layouts. Our implementation relies on miscellaneous hacks that work around a [React Native bug](https://github.com/facebook/react-native/issues/11960) with horizontal `ScrollView`.

As such, this feature should be considered experimental since it might break with newer versions of React Native.

## TODO

- [ ] Base the plugin on `FlatList` instead of `ScrollView`
- [ ] Implement 'loop' mode
- [ ] Add parallax image component
- [ ] Handle changing major props on-the-fly
- [ ] Handle autoplay properly when updating children's length
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
