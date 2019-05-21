# Tips and tricks

## Table of contents

1. [Optimizing performance](#optimizing-performance)
1. [Momentum](#momentum)
1. [Margin between slides](#margin-between-slides)
1. [Carousel's stretched height](#carousels-stretched-height)
1. [Items' dynamic height](#items-dynamic-height)
1. [Fullscreen slides](#fullscreen-slides)
1. [Viewport wide slides / no preview effect](#viewport-wide-slides--no-preview-effect)
1. [Handling device rotation](#handling-device-rotation)
1. [Native-powered animations](#native-powered-animations)
1. [Implementing navigation](#implementing-navigation)
1. [Implementing zooming feature](#implementing-zooming-feature)
1. [Using a specific commit](#using-a-specific-commit)
1. [Useful threads](#useful-threads)
1. [Understanding styles](#understanding-styles)
1. [Migration from version 2.x](#migration-from-version-2x)

## Optimizing performance

Here are a few good practices to keep in mind when dealing with the component (or any React Native list for that matter):

* **Implement `shouldComponentUpdate`** (see [the `shallowCompare` addon](https://www.npmjs.com/package/react-addons-shallow-compare`)) for every carousel children (in `renderItem()`) or **make it a `PureComponent`** (some users report that `shouldComponentUpdate` is faster, but you should try both and decide for yourself).
* Make sure the carousel **isn't a child of a `ScrollView`** (this includes `FlatList`, `VirtualizedList` and many plugins). Apparently, it would render all child components, even those currently off-screen.
* If your data set is huge, **consider loading additional chunks of data only when the user has reached the end of the current set**. In order to do this, you'll have to play with `VirtualizedList`'s props `onEndReached` and `onEndReachedThreshold`
* **Add [prop `removeClippedSubviews`](https://facebook.github.io/react-native/docs/scrollview.html#removeclippedsubviews)** and set it to `true` so that out-of-view items are removed from memory.

Here are a few other tips given by [@pcooney10](https://github.com/pcooney10) in [this thread](https://github.com/archriss/react-native-snap-carousel/issues/247#issuecomment-360276562):

- Make sure there aren't any excessive calls to `this.setState` in the component that renders the carousels and their parents.
- Properly leverage the `initialNumToRender` and `maxToRenderPerBatch` props inherited from `FlatList`, and `windowSize` inherited from `VirtualizedList`.
- Utilize [`InteractionManager`](https://facebook.github.io/react-native/docs/interactionmanager.html) to render the Carousels that are "below the fold".
- Avoid using functions and object literals for props declared on components - this apparently results in "new props" during a re-render.

Lastly, make sure to read [this note](https://github.com/archriss/react-native-snap-carousel#important-note-regarding-android) regarding Android and [this one](https://github.com/archriss/react-native-snap-carousel#important-note-regarding-ios) regarding iOS.

## Momentum

Since version `1.5.0`, the snapping effect can be based on momentum (by setting `enableMomentum` to `true`) instead of when you're releasing your finger. It means that the component will wait until the `ScrollView` isn't moving anymore to snap.

By default, the inertia isn't too high on Android. However, we had to tweak the default iOS value a bit to make sure the snapping isn't delayed for too long. You can adjust this value to your needs thanks to [this prop](https://facebook.github.io/react-native/docs/scrollview.html#decelerationrate).

If momentum is disabled (default behavior), make sure to play with prop `scrollEndDragDebounceValue` since it can help achieving a better snap feeling.

> **We recommend setting `enableMomentum` to `false` (default) and `decelerationRate` to `'fast'` when you are displaying only one main slide** (as in the showcase above), and to use `true` and `0.9` otherwise.

## Margin between slides
If you need some **extra horizontal margin** between slides (besides the one resulting from the scale effect), you should add it as `paddingHorizontal` on slide's container.

:warning: **The value of `itemWidth` must include this extra margin.**

```javascript
const horizontalMargin = 20;
const slideWidth = 280;

const sliderWidth = Dimensions.get('window').width;
const itemWidth = slideWidth + horizontalMargin * 2;
const itemHeight = 200;

const styles = StyleSheet.create({
    slide: {
        width: itemWidth,
        height: itemHeight,
        paddingHorizontal: horizontalMargin
        // other styles for the item container
    },
    slideInnerContainer: {
        width: slideWidth,
        flex: 1
        // other styles for the inner container
    }
};
```
```javascript
    _renderItem ({item, index}) {
        return (
            <View style={styles.slide}>
                <View style={styles.slideInnerContainer} />
            </View>
        );
    }

    render () {
        return (
            <Carousel
              renderItem={this._renderItem}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
            />
        );
    }
```

## Carousel's stretched height

Since `<Carousel />` is, ultimately, based on `<ScrollView />`, it inherits [its default styles](https://github.com/facebook/react-native/blob/c38f167019a3c481847d4abc80a458f7784f1336/Libraries/Components/ScrollView/ScrollView.js#L1153-L1169) and particularly `{ flexGrow: 1 }`. This means that, by default, **the carousel container will stretch to fill up all available space**.

If this is not what you're after, you can prevent this behavior by passing `{ flexGrow: 0 }` to prop `containerCustomStyle`.

Alternatively, you can either use this prop to pass a custom height to the container, or wrap the carousel in a `<View />` with a fixed height.

## Items' dynamic height

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

## Fullscreen slides

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

## Viewport wide slides / no preview effect

**If you are using the plugin without the preview effect (meaning that your slides, as well as your slider, are viewport wide), we do not recommend using this plugin.**

You'll be better off with [`react-native-swiper`](https://github.com/leecade/react-native-swiper) for the simple reason that it implements the `ViewPagerAndroid` component, which provides a way better overall feeling on Android, whereas we must hack our way around [the frustrating limitations of the `ScrollView` component](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/KNOWN_ISSUES.md#flatlist-and-scrollviews-limitations).

## Handling device rotation

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

## Native-powered animations

Slides' animations are based on scroll events and have been moved to the native thread in order to prevent the tiny lag associated with React Native's JavaScript bridge. This is really useful when displaying a `transform` and/or `opacity` animation that needs to follow carousel's scroll position closely. You can find more info in [this post from Facebook](https://facebook.github.io/react-native/blog/2017/02/14/using-native-driver-for-animated.html) or in [this one on Medium](https://medium.com/xebia/linking-animations-to-scroll-position-in-react-native-5c55995f5a6e).

## Implementing navigation

Some users had trouble implementing navigation with the carousel (see [#83](https://github.com/archriss/react-native-snap-carousel/issues/83), [#146](https://github.com/archriss/react-native-snap-carousel/issues/146) and [#212](https://github.com/archriss/react-native-snap-carousel/issues/212)) because they weren't aware of methods' context.

[jordangrant](https://github.com/jordangrant) was kind enough to share [a comprehensive walkthrough](https://github.com/archriss/react-native-snap-carousel/issues/146#issuecomment-343933652) which is reproduced below. Kuddos to him!

In your Carousel:

```
<Carousel
    data={image1}
    renderItem={this._renderItem.bind(this)}   //<------
    sliderWidth={equalWidth2}
    itemWidth={equalWidth5}
  />
```

Adding the bind allows the `_renderItem` function to understand what `this` is (in `this.props.navigation`).

In `_renderItem()`:

```
_renderItem ({item, index}) {
        return (
            <SliderEntry
              data={item}
              navigation={this.props.navigation}   //<-------
            />
        );
    }
```

And inside `SliderEntry.js`:

```
export default class SliderEntry extends Component {

    static propTypes = {
        data: PropTypes.object.isRequired,
    };

    render () {
        const { data: { title, subtitle, illustration}, navigation } = this.props;    //<------

        return (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.slideInnerContainer}
            onPress={() => navigation.navigate('Feed')}  //<------- now you can use navigation
          >
    }
}
```

## Implementing zooming feature

See https://github.com/archriss/react-native-snap-carousel/issues/264#issuecomment-366473756

## Using a specific commit

This plugin is regularly updated, and new versions are frequently pushed to `npm`. But you may want to use a specific commit, not yet merged or published.

This is pretty easy: in your `package.json` file, use the GitHub link instead of a version number, and point to the specific commit using `#`. For example, if the commit reference is `fbdb671`, you would write:
```javascript
"react-native-snap-carousel": "https://github.com/archriss/react-native-snap-carousel#fbdb671"
```

## Useful threads

Some issues stand above the others because a lot of useful information has been shared.

In order to make it easier for everyone to find them, they are [tagged with an asterisk](https://github.com/archriss/react-native-snap-carousel/issues?q=is%3Aissue+label%3A%2A).

## Understanding styles

Here is a screenshot that should help you understand how each of the required variables is used.

![react-native-snap-carousel info](https://i.imgur.com/PMi6aBd.jpg)

## Migration from version 2.x

Slides are no longer appended as direct children of the component since the plugin is now based on `FlatList` instead of `ScrollView`. There are two new props that takes care of their rendering: `data` and `renderItem` (both are inherited from `FlatList`).

> :warning: **Make sure to read about [the recommended React Native version](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/KNOWN_ISSUES.md#react-native-version) before migrating.**

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
