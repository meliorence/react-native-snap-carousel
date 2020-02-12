# `<ParallaxImage />` component

Version `3.0.0` introduced a `<ParallaxImage />` component, an image component aware of carousel's current scroll position and therefore able to display a nice parallax effect (powered by the native driver to ensure top-notch performance).

![react-native-snap-carousel parallax image](https://i.imgur.com/6iIb4SR.gif)

## Props

Prop | Description | Type | Default
------ | ------ | ------ | ------
`containerStyle` | Optional style for image's container | View Style Object | `{}`
`dimensions` | Optional on-screen dimensions of the image, as measured with [native methods](https://facebook.github.io/react-native/docs/direct-manipulation.html#other-native-methods). This allows for a bit of optimization, but it's sometimes tricky to get these in responsive layouts. | `{ width: number, height: number }` | `undefined`
`fadeDuration` | Duration of the fade-in effect when image is loaded | Number | `500`
`parallaxFactor` | Speed of the parallax effect. Be aware that the bigger the value, the more image will appear "zoomed in". | Number | `0.3`
`showSpinner` | Whether to display a spinner while image is loading or not | Boolean | `true`
`spinnerColor` | Color of the spinner | String | 'rgba(0, 0, 0, 0.4)'
`AnimatedImageComponent` | Custom animated image component | Function Object | `Animated.Image`

All [`<Image />` props](https://facebook.github.io/react-native/docs/image.html#props) are also inherited, **particularly `source` which is required**.

## Usage

The first thing you need to do is to **set `hasParallaxImages` to `true` for your `<Carousel />`**. This will make a new argument available in your `renderItem()` function, which must then be passed to the `<ParallaxImage />`.

Here is an example that shows how to connect images to your carousel (note the `parallaxProps` argument).

```javascript
import Carousel, { ParallaxImage } from 'react-native-snap-carousel';
import { Dimensions, StyleSheet } from 'react-native';

const { width: screenWidth } = Dimensions.get('window')

export default class MyCarousel extends Component {

    _renderItem ({item, index}, parallaxProps) {
        return (
            <View style={styles.item}>
                <ParallaxImage
                    source={{ uri: item.thumbnail }}
                    containerStyle={styles.imageContainer}
                    style={styles.image}
                    parallaxFactor={0.4}
                    {...parallaxProps}
                />
                <Text style={styles.title} numberOfLines={2}>
                    { item.title }
                </Text>
            </View>
        );
    }

    render () {
        return (
            <Carousel
                sliderWidth={screenWidth}
                sliderHeight={screenWidth}
                itemWidth={screenWidth - 60}
                data={this.state.entries}
                renderItem={this._renderItem}
                hasParallaxImages={true}
            />
        );
    }
}

const styles = StyleSheet.create({
  item: {
    width: screenWidth - 60,
    height: screenWidth - 60,
  },
  imageContainer: {
    flex: 1,
    marginBottom: Platform.select({ ios: 0, android: 1 }), // Prevent a random Android rendering issue
    backgroundColor: 'white',
    borderRadius: 8,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
})
```

## Example to use with React Hooks

```javascript
import React, {useRef, useState, useEffect} from 'react';
import Carousel, {ParallaxImage} from 'react-native-snap-carousel';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';

const ENTRIES1 = [
  {
    title: 'Beautiful and dramatic Antelope Canyon',
    subtitle: 'Lorem ipsum dolor sit amet et nuncat mergitur',
    illustration: 'https://i.imgur.com/UYiroysl.jpg',
  },
  {
    title: 'Earlier this morning, NYC',
    subtitle: 'Lorem ipsum dolor sit amet',
    illustration: 'https://i.imgur.com/UPrs1EWl.jpg',
  },
  {
    title: 'White Pocket Sunset',
    subtitle: 'Lorem ipsum dolor sit amet et nuncat ',
    illustration: 'https://i.imgur.com/MABUbpDl.jpg',
  },
  {
    title: 'Acrocorinth, Greece',
    subtitle: 'Lorem ipsum dolor sit amet et nuncat mergitur',
    illustration: 'https://i.imgur.com/KZsmUi2l.jpg',
  },
  {
    title: 'The lone tree, majestic landscape of New Zealand',
    subtitle: 'Lorem ipsum dolor sit amet',
    illustration: 'https://i.imgur.com/2nCt3Sbl.jpg',
  },
];
const {width: screenWidth} = Dimensions.get('window');

const MyCarousel = props => {
  const [entries, setEntries] = useState([]);
  const carouselRef = useRef(null);

  const goForward = () => {
    carouselRef.current.snapToNext();
  };

  useEffect(() => {
    setEntries(ENTRIES1);
  }, []);

  const renderItem = ({item, index}, parallaxProps) => {
    return (
      <View style={styles.item}>
        <ParallaxImage
          source={{uri: item.illustration}}
          containerStyle={styles.imageContainer}
          style={styles.image}
          parallaxFactor={0.4}
          {...parallaxProps}
        />
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={goForward}>
        <Text>go to next slide</Text>
      </TouchableOpacity>
      <Carousel
        ref={carouselRef}
        sliderWidth={screenWidth}
        sliderHeight={screenWidth}
        itemWidth={screenWidth - 60}
        data={entries}
        renderItem={renderItem}
        hasParallaxImages={true}
      />
    </View>
  );
};

export default MyCarousel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    width: screenWidth - 60,
    height: screenWidth - 60,
  },
  imageContainer: {
    flex: 1,
    marginBottom: Platform.select({ios: 0, android: 1}), // Prevent a random Android rendering issue
    backgroundColor: 'white',
    borderRadius: 8,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
});

```
