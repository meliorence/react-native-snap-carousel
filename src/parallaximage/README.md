# `<ParallaxImage />` component

Version `3.0.0` introduced a `<ParallaxImage />` component, an image component aware of carousel's current scroll position and therefore able to display a nice parallax effect.

![react-native-snap-carousel parallax image](http://i.imgur.com/6iIb4SR.gif)

## Props

Prop | Description | Type | Default
------ | ------ | ------ | ------
`containerStyle` | Optional style for image's container | View Style Object | `{}`
`dimensions` | Optional on-screen dimensions of the image, as measured with [native methods](https://facebook.github.io/react-native/docs/direct-manipulation.html#other-native-methods). This allows for a bit of optimization, but it's sometimes tricky to get these in responsive layouts. | `{ width: number, height: number }` | `undefined`
`fadeDuration` | Duration of the fade-in effect when image is loaded | Number | `500`
`parallaxFactor` | Speed of the parallax effect. Be aware that the bigger the value, the more image will appear "zoomed in". | Number | `0.3`
`showSpinner` | Whether to display a spinner while image is loading or not | Boolean | `true`
`spinnerColor` | Color of the spinner | String | 'rgba(0, 0, 0, 0.4)'

All [`<Image />` props](https://facebook.github.io/react-native/docs/image.html#props) are also inherited, **particularly `source` which is required**.

## Usage

The first thing you need to do is to **set `hasParallaxImages` to `true` for your `<Carousel />`**. This will make a new argument available in your `renderItem()` function, which must then be passed to the `<ParallaxImage />`.

Here is an example that shows how to connect images to your carousel (note the `parallaxProps` argument).

```javascript
import Carousel, { ParallaxImage } from 'react-native-snap-carousel';

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
                data={this.state.entries}
                renderItem={this._renderItem}
                hasParallaxImages={true}
            />
        );
    }
```
