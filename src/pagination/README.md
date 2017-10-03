# `<Pagination />` component

Starting with version `2.4.0`, a customizable `<Pagination />` component has been added. This is how it looks like with its default configuration:

![react-native-snap-carousel pagination](http://i.imgur.com/FLQcGGL.gif)

## Table of contents

1. [Props](#props)
1. [Note on dots' colors](#note-on-dots-colors)
1. [Usage](#usage)

## Props

Prop | Description | Type | Default
------ | ------ | ------ | ------
**`activeDotIndex`** | Index of the currently active dot | Number | **Required**
**`dotsLength`** | Number of dots to display | Number | **Required**
`activeOpacity` | Opacity of the dot when tapped. The prop has no effect if `tappableDots` hasn't been set to `true`. | Number | 1
`carouselRef` | Reference to the `Carousel` component to which pagination is linked. Needed only when setting `tappableDots` to `true`. | Object | `undefined`
`containerStyle` | Style for dots' container that will be merged with the default one | View Style Object | `{}`
`dotColor` | Background color of the active dot. **Use this if you want to animate the change between active and inactive colors**, and always in conjunction with `inactiveDotColor` (see [notes](#dots-colors)). | String | `undefined`
`dotContainerStyle` | Style of each dot's container. Use this if you need to specify styles that wouldn't have any effect when defined with `dotStyle` (such as `flex`). | View Style Object | `{}`
`dotElement` | Optional custom active dot element that will replace the default one. The element will receive a prop `active` set to `true` as well as a prop `index`. | React element | `undefined`
`dotStyle` | Dots' style that will be merged with the default one | View Style Object | `{}`
`inactiveDotColor` | Background color of the inactive dots. **Use this if you want to animate the change between active and inactive colors**, and always in conjunction with `dotColor` (see [notes](#dots-colors)). | String | `undefined`
`inactiveDotElement` | Optional custom inactive dot element that will replace the default one. The element will receive a prop `active` set to `false` as well as a prop `index` | React element | `undefined`
`inactiveDotOpacity` | Value of the opacity effect applied to inactive dots | Number | `0.5`
`inactiveDotScale` | Value of the 'scale' transform applied to inactive dots | Number | `0.5`
`inactiveDotStyle` | Dots' style that will be applied to inactive elements | View Style Object | `{}`
`renderDots` | Function that gives you complete control over pagination's rendering. It will receive three parameters : `(activeIndex, total, context)`. This can be especially useful in order to replace dots with numbers. | Function | `undefined`
`tappableDots` | Make default dots tappable, e.g. your carousel will slide to the corresponding item. Note that `carouselRef` must be specified for this to work. | Boolean | `false`
`vertical` | Whether to layout dots vertically or horizontally | Boolean | `false`

## Note on dots' colors
If your active and inactive dots aren't of the same color, you have a choice to make:
1. either animate the color transition by specifying both `dotColor` and `inactiveDotColor`
1. or setting `{ backgroundColor }` in both `dotStyle` and `inactiveDotStyle`.

**When animating the color transition, the dot component will no longer be able to use the native driver for scale and opacity transitions.** As stated in [React Native's doc](https://facebook.github.io/react-native/docs/animations.html#caveats), color animations aren't supported by the native driver. And, unfortunately, it doesn't seem currently possible to run native-powered and js-powered animations at the same time on the same element.

Basically, this is a tradeoff between color transition and optimal smoothness. We recommended you to try the first version and, if you experiment performance drops, to settle for the second one.

## Usage

Since `<Pagination />` is, purposely, a separated component, you need to connect it to your `<Carousel />` component manually. This is pretty straightforward, but here is an example to get you started.

```javascript
import Carousel, { Pagination } from 'react-native-snap-carousel';

export default class MyCarousel extends Component {

    _renderItem ({item, index}) {
        return <MySlideComponent data={item} />
    }

    get pagination () {
        const { entries, activeSlide } = this.state;
        return (
            <Pagination
              dotsLength={entries.length}
              activeDotIndex={activeSlide}
              containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
              dotStyle={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginHorizontal: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.92)'
              }}
              inactiveDotStyle={{
                  // Define styles for inactive dots here
              }}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
        );
    }

    render () {
        return (
            <View>
                <Carousel
                  data={this.state.entries}
                  renderItem={this._renderItem}
                  onSnapToItem={(index) => this.setState({ activeSlide: index }) }
                />
                { this.pagination }
            </View>
        );
    }
```
