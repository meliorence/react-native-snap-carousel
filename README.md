# react-native-snap-carousel
Simple carousel component with snapping effect on Android & iOS for React Native

![react-native-snap-carousel](https://zippy.gfycat.com/BoringBasicKiskadee.gif)
![react-native-snap-carousel](https://zippy.gfycat.com/IncompatibleVengefulBasenji.gif)

## Usage

```
$ npm install --save react-native-snap-carousel
```

```javascript
import Carousel from 'react-native-snap-carousel';

    _renderItem (data, index) {
        return (
            ...
        );
    }

    render () {
        <Carousel
          ref={'carousel'}
          items={this.state.entries}
          renderItem={this._renderItem}
          sliderWidth={sliderWidth}
          itemWidth={itemWidth}
          slideStyle={styles.slide} />
    }
```

## Props

In addition of these props, you can provide any prop from [ScrollView](https://facebook.github.io/react-native/docs/scrollview.html) since it's using it both on Android & iOS.

Prop | Description | Type | Default
------ | ------ | ------ | ------
items | Array of items to loop on | Array | Required
sliderWidth | The width in pixels of your slider | Number | Required
itemWidth | Width in pixels of your items | Number | Required
renderItem | Function returning a react element. The entry data is the 1st parameter, its index is the 2nd | Function | Required
slideStyle | Style of each item's container | Number | Required
swipeThreshold | Delta x when swiping to trigger the snap | Number | `20`
animationFunc | Animated animation to use. Provide the name of the method | String | `Timing`
animationOptions | Animation options to be merged with the default ones. Can be used w/ animationFunc | Object | `{ easing: Easing.elastic(1) }`
firstItem | Index of the first item to display | Number | `0`
autoplay | Trigger autoplay on mount | Boolean | `false`
autoplayInterval | Delay in ms until navigating to the next item | `3000`
autoplayDelay | Delay before enabling autoplay on startup & after releasing the touch | Number | `5000`
enableSnap | If enabled, releasing the touch will scroll to the center of the nearest/active item | Number | `true`
snapOnAndroid | Snapping on android is kinda choppy, especially when swiping quickly so you can disable it | Boolean | `false`
containerCustomStyle | Optional styles for Scrollview's global wrapper | Number | `null`
contentContainerCustomStyle | Optional styles for Scrollview's items container | Number | `null`
inactiveSlideScale | Value of the 'scale' transform applied to inactive slides | Number | `0.9`
inactiveSlideOpacity | Value of the opacity effect applied to inactive slides | Number | `1`
onSnapToItem(slideIndex, itemData) | Callback fired when navigating to an item | Function | `undefined`

## Methods

* `startAutoplay (instantly = false)` Start the autoplay manually
* `stopAutoplay ()` Stop the autoplay manually
* `snapToItem (index, animated = true)` Snap to an item manually

## Tips and tricks

### Margin between slides
If you need some **extra horizontal margin** between slides (besides the one resulting from the scale effect), you should add it as `paddingHorizontal` on the slide container. Make sure to take this into account when calculating item's width.

```javascript
const slideWidth = 250;
const horizontalMargin = 40;
const itemWidth = slideWidth + horizontalMargin * 2;

const styles = Stylesheet.create({
    slide: {
        width: itemWidth
        // other styles for your item's container
    }
};

<Carousel
  itemWidth={itemWidth}
  slideStyle={styles.slide}
  />

```

## TODO :

- [ ] Improve snap on Android
- [ ] Handle changing props on-the-fly
- [ ] Handle device orientation event
- [ ] Add Vertical implementation
- [x] Fix centering since it's a little off
- [x] Handle passing 1 item only
