# react-native-snap-carousel
Swiper component for React Native featuring **previews**, **snapping effect**, **parallax images**, **performant handling of huge numbers of items**, and **RTL support**. Compatible with Android & iOS.

![platforms](https://img.shields.io/badge/platforms-Android%20%7C%20iOS-brightgreen.svg?style=flat-square&colorB=191A17)
[![npm](https://img.shields.io/npm/v/react-native-snap-carousel.svg?style=flat-square)](https://www.npmjs.com/package/react-native-snap-carousel)
[![npm](https://img.shields.io/npm/dm/react-native-snap-carousel.svg?style=flat-square&colorB=007ec6)](https://www.npmjs.com/package/react-native-snap-carousel)
<!-- [![github release](https://img.shields.io/github/release/archriss/react-native-snap-carousel.svg?style=flat-square)](https://github.com/archriss/react-native-snap-carousel/releases) -->
[![github issues](https://img.shields.io/github/issues/archriss/react-native-snap-carousel.svg?style=flat-square)](https://github.com/archriss/react-native-snap-carousel/issues)
[![github closed issues](https://img.shields.io/github/issues-closed/archriss/react-native-snap-carousel.svg?style=flat-square&colorB=44cc11)](https://github.com/archriss/react-native-snap-carousel/issues?q=is%3Aissue+is%3Aclosed)
[![Issue Stats](https://img.shields.io/issuestats/i/github/archriss/react-native-snap-carousel.svg?style=flat-square&colorB=44cc11)](http://github.com/archriss/react-native-snap-carousel/issues)

-----

### :warning: Before submitting a new issue, make sure to read [the guidelines](https://github.com/archriss/react-native-snap-carousel/blob/master/CONTRIBUTING.md) and then to fill out the [issue template](https://github.com/archriss/react-native-snap-carousel/blob/master/ISSUE_TEMPLATE.md)!

-----

## Table of contents

1. [Showcase](#showcase)
1. [Usage](#usage)
1. [Important note regarding Android](#important-note-regarding-android)
1. [Migration from version 2.x](#migration-from-version-2x)
1. [Props](#props)
1. [Methods](#methods)
1. [Getters](#getters)
1. [`ParallaxImage` component](#parallaximage-component)
1. [`Pagination` component](#pagination-component)
1. [Example](#example)
1. [Tips and tricks](#tips-and-tricks)
1. [Known issues](#known-issues)
1. [Roadmap](#roadmap)
1. [Credits](#credits)

## Showcase

### Archriss' "Ville d'Aix-en-Provence" app

**This app is available on [Android](https://play.google.com/store/apps/details?id=fr.archriss.aixmobile.app) and [iOS](https://itunes.apple.com/fr/app/ville-daix-en-provence/id494548366?mt=8).** It uses **version 3.2.0** of the plugin, with `FlatList`'s implementation and [parallax images](#parallaximage-component).

![react-native-snap-carousel archriss aix](http://i.imgur.com/pPm0csc.gif)
![react-native-snap-carousel archriss aix](http://i.imgur.com/UFsPlz2.gif)

### Archriss' showcase app

**You can try the app live on [Android](https://play.google.com/store/apps/details?id=fr.archriss.demo.app) and [iOS](https://itunes.apple.com/lu/app/archriss-presentation-mobile/id1180954376?mt=8).** It currently uses **version 1.4.0** of the plugin. Be aware that sliders' layouts will break on RTL devices since support was added in version 2.1.0 (see [#38](https://github.com/archriss/react-native-snap-carousel/issues/38)).

![react-native-snap-carousel](http://i.imgur.com/Fope3uj.gif)
![react-native-snap-carousel](http://i.imgur.com/WNOBYfl.gif)
![react-native-snap-carousel](http://i.imgur.com/sK5DKaG.gif)

> Please note that **we do not plan on Open-Sourcing the code of our showcase app**. Still, we've put together [an example](#example) for you to play with, and you can find some insight about our map implementation [in this comment](https://github.com/archriss/react-native-snap-carousel/issues/11#issuecomment-265147385).
> The folks at [codedaily.io](https://codedaily.io) have created a great tutorial about implementing a similar feature. [Go check it out!](https://codedaily.io/tutorials/9/Build-a-Map-with-Custom-Animated-Markers-and-Region-Focus-when-Content-is-Scrolled-in-React-Native)

## Usage

```bash
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

## Important note regarding Android

![react-native-snap-carousel android](https://i.imgur.com/03iuB2Um.jpg)

Android's debug mode is a mess: timeouts regularly desynchronize and scroll events are fired with some lag, which completely alters the inner logic of the carousel. **On Android, you *will* experience issues with carousel's behavior when JS Dev Mode is enabled, and you *might* have trouble with unreliable callbacks and loop mode when it isn't**. This is unfortunate, but it's rooted in various flaws of `ScrollView`/`FlatList`'s implementation and the miscellaneous workarounds we had to implement to compensate for it.

:warning: **Therefore you should always check if the issue you experience also happens in a production environment. This is, sadly, the only way to test the real performance and behavior of the carousel.**

> For more information, you can read the following notes: ["Android performance"](#android-performance) and ["Unreliable callbacks"](#unreliable-callbacks).

## Migration from version 2.x

Slides are no longer appended as direct children of the component since the plugin is now based on `FlatList` instead of `ScrollView`. There are two new props that takes care of their rendering: `data` and `renderItem` (both are inherited from `FlatList`).

> :warning: **Since `FlatList` was introduced in React Native `0.43.x`, you need to use version `2.4.0` of the plugin if you're currently using an older release of RN. Please note that we won't support this older version of the plugin.** Also, make sure to check [the relevant documentation](https://github.com/archriss/react-native-snap-carousel/blob/v2.4.0/README.md).

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
**`data`** | Array of items to loop on | Array | **Required**
**`renderItem`** | Takes an item from data and renders it into the list. The function receives one argument `{item, index}` (see [Usage](#usage)) and must return a React element. | Function | **Required**
**`itemWidth`** | Width in pixels of carousel's items, **must be the same for all of them** | Number | **Required for __horizontal__ carousel**
**`sliderWidth`** | Width in pixels of the carousel itself | Number | **Required for __horizontal__ carousel**
**`itemHeight`** | Height in pixels of carousel's items, **must be the same for all of them** | Number | **Required for __vertical__ carousel**
**`sliderHeight`** | Height in pixels of the carousel itself | Number | **Required for __vertical__ carousel**

### Behavior

Prop | Description | Type | Default
------ | ------ | ------ | ------
`activeSlideOffset` | From slider's center, minimum slide distance to be scrolled before being set to active. | Number | `20`
`apparitionDelay` | `FlatList`'s init is a real mess, with lots of unneeded flickers and slides movement. This prop controls the delay during which the carousel will be hidden when mounted. | Number | `250`
`callbackOffsetMargin` | Scroll events might not be triggered often enough to get a precise measure and, therefore, to provide a reliable callback. This usually is an Android issue, which might be linked to the version of React Native you're using (see ["Unreliable callbacks"](#unreliable-callbacks)). To work around this, you can define a small margin that will increase the "sweet spot"'s width. The default value should cover most cases, but **you will want to increase it if you experience missed callbacks**. | Number | `5`
`enableMomentum` | See [momentum](#momentum) | Boolean | `false`
`enableSnap` | If enabled, releasing the touch will scroll to the center of the nearest/active item | Boolean | `true`
`firstItem` | Index of the first item to display | Number | `0`
`hasParallaxImages` | Whether the carousel contains `<ParallaxImage />` components or not. Required for specific data to be passed to children. | Boolean | `false`
`lockScrollWhileSnapping` | Prevent the user from swiping again while the carousel is snapping to a position. This prevents miscellaneous minor issues (inadvertently tapping an item while scrolling, stopping the scrolling animation if the carousel is tapped in the middle of a snap, clunky behavior on Android when short snapping quickly in opposite directions). The only drawback is that enabling the prop hinders the ability to swipe quickly between items as a little pause between swipes is needed. **Note that the prop won't have any effect if `enableMomentum` is set to `true`, since it would otherwise impede the natural and expected behavior.** | Boolean | `false`
`shouldOptimizeUpdates` | Whether to implement a `shouldComponentUpdate` strategy to minimize updates | Boolean | `true`
`swipeThreshold` | Delta x when swiping to trigger the snap | Number | `20`
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
`autoplayDelay` | Delay before enabling autoplay on startup & after releasing the touch | Number | `5000`
`autoplayInterval` | Delay in ms until navigating to the next item | Number |  `3000`

### Style and animation

Prop | Description | Type | Default
------ | ------ | ------ | ------
`activeSlideAlignment` | Determine active slide's alignment relative to the carousel. Possible values are: `'start'`, `'center'` and `'end'`. | String | `'center'`
`containerCustomStyle` | Optional styles for Scrollview's global wrapper | View Style Object | `{}`
`contentContainerCustomStyle` | Optional styles for Scrollview's items container | View Style Object | `{}`
`inactiveSlideOpacity` | Value of the opacity effect applied to inactive slides | Number | `0.7`
`inactiveSlideScale` | Value of the 'scale' transform applied to inactive slides | Number | `0.9`
`inactiveSlideShift` | Value of the 'translate' transform applied to inactive slides (see [#204](https://github.com/archriss/react-native-snap-carousel/issues/204) for an example usage) | Number | `0`
`slideStyle` | Optional style for each item's container (the one whose scale and opacity are animated) | Animated View Style Object | `{}`

### Callbacks

Prop | Description | Type | Default
------ | ------ | ------ | ------
`onLayout(event)` | Exposed `View` callback; invoked on mount and layout changes | Function | `undefined`
`onScroll(event)` | Exposed `ScrollView` callback; fired while scrolling | Function | `undefined`
`onSnapToItem(slideIndex)` | Callback fired when navigating to an item | Function | `undefined`

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

## `ParallaxImage` component

Version `3.0.0` introduced a `<ParallaxImage />` component, an image component aware of carousel's current scroll position and therefore able to display a nice parallax effect.

You can find the documentation for this component [here](https://github.com/archriss/react-native-snap-carousel/blob/master/src/parallaximage/README.md).

![react-native-snap-carousel parallax image](http://i.imgur.com/6iIb4SR.gif)

## `Pagination` component

Starting with version `2.4.0`, a customizable `<Pagination />` component has been added. This is how it looks like with its default configuration:

You can find the documentation for this component [here](https://github.com/archriss/react-native-snap-carousel/blob/master/src/pagination/README.md).

![react-native-snap-carousel pagination](http://i.imgur.com/FLQcGGL.gif)

## Example
You can find the following example in the [`/example` folder](https://github.com/archriss/react-native-snap-carousel/tree/master/example).

![react-native-snap-carousel](http://i.imgur.com/m0297Ys.gif)

## Tips and tricks

### Momentum

Since version `1.5.0`, the snapping effect can be based on momentum (by setting `enableMomentum` to `true`) instead of when you're releasing your finger. It means that the component will wait until the `ScrollView` isn't moving anymore to snap.

By default, the inertia isn't too high on Android. However, we had to tweak the default iOS value a bit to make sure the snapping isn't delayed for too long. You can adjust this value to your needs thanks to [this prop](https://facebook.github.io/react-native/docs/scrollview.html#decelerationrate).

If momentum is disabled (default behavior), make sure to play with prop `scrollEndDragDebounceValue` since it can help achieving a better snap feeling.

> **We recommend setting `enableMomentum` to `false` (default) and `decelerationRate` to `'fast'` when you are displaying only one main slide** (as in the showcase above), and to use `true` and `0.9` otherwise.

### Margin between slides
If you need some **extra horizontal margin** between slides (besides the one resulting from the scale effect), you should add it as `paddingHorizontal` on slide's container.

:warning: **The value of `itemWidth` must include this extra margin.**

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
```javascript
<Carousel sliderWidth={sliderWidth} itemWidth={itemWidth} />
```

### Carousel's stretched height

Since `<Carousel />` is, ultimately, based on `<ScrollView />`, it inherits [its default styles](https://github.com/facebook/react-native/blob/master/Libraries/Components/ScrollView/ScrollView.js#L864) and particularly `{ flexGrow: 1 }`. This means that, by default, **the carousel container will stretch to fill up all available space**.

If this is not what you're after, you can prevent this behavior by passing `{ flexGrow: 0 }` to prop `containerCustomStyle`.

Alternatively, you can either use this prop to pass a custom height to the container, or wrap the carousel in a `<View />` with a fixed height.

### Items' dynamic height

If you want your slides to have dynamic height (e.g. to fill up the entirety of the available space), you need to transfer `{ flex: 1 }` to all the relevant wrappers. Here is a minimal example:

```javascript
_renderItem ({item, index}) {
    return (
        <View style={{ flex: 1 }} />
    );
}

render () {
    return (
        <Carousel
          data={this.state.data}
          renderItem={this._renderItem}
          containerCustomStyle={{ flex: 1 }}
          slideStyle={{ flex: 1 }}
        />
    );
}
```

### Fullscreen slides

While the plugin hasn't been designed with this use case in mind, you can easily implement fullscreen slides. The following code can serve as a good starting point.

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

### Viewport wide slides / no preview effect

**If you are using the plugin without the preview effect (meaning that your slides, as well as your slider, are viewport wide), we do not recommend using this plugin.**

You'll be better off with [`react-native-swiper](https://github.com/leecade/react-native-swiper) for the simple reason that it implements the `ViewPagerAndroid` component, which provides a way better overall feeling on Android, whereas we must hack our way around [the miscellaneous `ScrollView` limitations](#flatlist-and-scrollviews-limitations).

### Understanding styles

Here is a screenshot that should help you understand how each of the above variables is used.

![react-native-snap-carousel info](http://i.imgur.com/PMi6aBd.jpg)

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

### Native-powered animations

Slides' animations are based on scroll events and have been moved to the native thread in order to prevent the tiny lag associated with React Native's JavaScript bridge. This is really useful when displaying a `transform` and/or `opacity` animation that needs to follow carousel's scroll position closely. You can find more info in [this post from Facebook](https://facebook.github.io/react-native/blog/2017/02/14/using-native-driver-for-animated.html) or in [this one on Medium](https://medium.com/xebia/linking-animations-to-scroll-position-in-react-native-5c55995f5a6e).

### Using a specific commit

This plugin is regularly updated, and new versions are frequently pushed to `npm`. But you may want to use a specific commit, not yet merged or published.

This is pretty easy: in your `package.json` file, use the GitHub link instead of a version number, and point to the specific commit using `#`. For example, if the commit reference is `fbdb671`, you would write:
```javascript
"react-native-snap-carousel": "https://github.com/archriss/react-native-snap-carousel#fbdb671"
```

## Known issues

### FlatList and ScrollView's limitations

Note that this plugin is built on top of React Native's `FlatList` which, in turn, is based on `VirtualizedList` and `ScrollView`. Unfortunately, their implementations have flaws that affect the plugin, the most problematic ones being the following:
- there is no `scrollEnd` event
- `scrollTo` method doesn't accept any callback
- Android's `scrollTo` animation is quite brutal
- it is not possible to specify a scroll duration
- there are performance issues with the `FlatList` component.

On top of that, `FlatList` has [its own set of bugs and buggy behaviors](https://github.com/facebook/react-native/issues?utf8=%E2%9C%93&q=flatlist).

We're trying to work around these issues, but the result is not always as smooth as we'd want it to be. **You can help by letting the React Native team know how badly we need those features!** React Native has [a dedicated canny](https://react-native.canny.io/feature-requests) for feature requests; here are the ones that need your vote the most:
- [[ScrollView] Add completion callback to scrollTo](https://react-native.canny.io/feature-requests/p/scrollview-add-completion-callback-to-scrollto)
- [snapToInterval for Android](https://react-native.canny.io/feature-requests/p/snaptointerval-for-android)
- [Add speed attribute to scrollTo](https://react-native.canny.io/feature-requests/p/add-speed-attribute-to-scrollto)
- [Bring ios only methods to Android ScrollView](https://react-native.canny.io/feature-requests/p/bring-ios-only-methods-to-android-scrollview)
- [ScrollView Animation Events (e.g. onScrollAnimationEnd)](https://react-native.canny.io/feature-requests/p/scrollview-animation-events-eg-onscrollanimationend)

Remember that every vote counts and take a look at [#203](https://github.com/archriss/react-native-snap-carousel/issues/203) for more info!

### React Native version

:warning: **RN 0.43.x is the minimum required to use versions `>= 3.0.0` of the plugin. If you're using an older release of React Native, you are stuck with version `2.4.0`. Please note that we won't support this older version of the plugin.** Also, make sure to check [the relevant documentation](https://github.com/archriss/react-native-snap-carousel/blob/v2.4.0/README.md).

Bear in mind that we follow RN evolutions closely, which means newer versions of the plugin might break when used in conjunction with a version of RN that is not the latest stable one.

### Android performance

:warning: **Make sure to test carousel's performance and behavior without JS Dev Mode enabled, ideally with a production build.**.

It can take user experience from "crappy and sluggish" to "pretty good" - it's Android though, so nothing like "perfect" or "incredibly smooth"...

### Performance tips

Here are a few good practices to keep in mind when dealing with the component (or any `FlatList` for that matter):
1. **Implement `shouldComponentUpdate`** (see [the `shallowCompare` addon](https://www.npmjs.com/package/react-addons-shallow-compare`)) for the `renderItem` component or **make it a `PureComponent`** (some users report that `shouldComponentUpdate` is faster, but you should try both and decide for yourself).
1. Make sure the carousel **isn't a child of a `ScrollView`** (this includes `FlatList`, `VirtualizedList` and many plugins). Apparently, it would render all child components, even those currently off-screen.
1. **Add [prop `removeClippedSubviews`](https://facebook.github.io/react-native/docs/scrollview.html#removeclippedsubviews)** and set it to `true` so that out-of-view items are removed.
1. If your data set is huge, **consider loading additional chunks of data only when the user has reached the end of the current set**. In order to do this, you'll have to play with `VirtualizedList`'s props `onEndReached` and `onEndReachedThreshold`

### Unreliable callbacks

When `enableMomentum` is disabled (default behavior), providing a reliable callback is really tricky since no `scrollEnd` event has been exposed yet for the `ScrollView` component. We can only rely on the `scrollEndDrag` event, which comes with a huge bunch of issues. See [#34](https://github.com/archriss/react-native-snap-carousel/issues/34) for more information.

Version 2.3.0 tackled these issues with all sorts of flags and hacks. But you could still be facing the following one: **when you build a debug version of your app without enabling JS remote debugging, timers may desynchronize and cause a complete callback mess**. Try to either enable remote debugging or build a production version of your app, and everything should get back to normal.

Callback handling has been completely revamped in version 3.2.0, in a less hacky and more reliable way. There is one issue though: callbacks now rely on scroll events. Usually, this is not a problem since the plugin features a native-powered scroll. **But there has been [a regression in React Native 0.46.x](https://github.com/facebook/react-native/issues/15769), that has been fixed in version 0.48.2.**

If you're using an in-between version, you're in for some trouble since events won't be fired frequently enough (particularly on Android). **We've added a prop `callbackOffsetMargin` to help with this situation.**

### Error with Jest

You might encounter the following error when using the plugin in conjonction with Jest: `TypeError: Cannot read property 'style' of undefined at Object.<anonymous>`.

As you can see [here](https://github.com/facebook/react-native/blob/master/jest/setup.js), this is because React Native mocks `ScrollView` for you when you write unit tests with Jest.

The easiest workaround is to add `jest.unmock('ScrollView')` before importing the component in your test file (thanks [@hoangnm](https://github.com/hoangnm) for the tip!).

### RTL support (experimental)

Since version 2.1.0, the plugin is compatible with RTL layouts. Our implementation relies on miscellaneous hacks that work around a [React Native bug](https://github.com/facebook/react-native/issues/11960) with horizontal `ScrollView`. As such, this feature should be considered experimental since it might break with newer versions of React Native.

Note that you may want to reverse the order of your data array for your items to be displayed in the proper RTL order. We've tried implementing it internally, but this led to numerous and unnecessary issues. You'll just have to do something as simple as `myCustomData.reverse()`.

## Roadmap

- [ ] Add more examples
- [ ] Implement a custom `PanResponder` for better control over carousel's callbacks and overall feeling
- [X] Implement 'loop' mode
- [X] Improve Android's behavior
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

Written by [Benoît Delmaire](https://fr.linkedin.com/in/benoitdelmaire) ([bd-arc](https://github.com/bd-arc)) and [Maxime Bertonnier](https://fr.linkedin.com/in/maxime-bertonnier-744351aa) ([Exilz](https://github.com/Exilz)) at
[Archriss](http://www.archriss.com/).
