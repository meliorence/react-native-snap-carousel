# `<Pagination />` component

1. [Props](#props)
1. [Usage](#usage)

Starting with version `2.4.0`, a customizable `<Pagination />` component has been added. This is how it looks like:

![react-native-snap-carousel pagination](http://i.imgur.com/QF6I8HN.gif)

## Props

Prop | Description | Type | Default
------ | ------ | ------ | ------
dotsLength | Number of dots to display | Number | **Required**
activeDotIndex | Currently focused dot | Number | **Required**
containerStyle | Style for dots' container that will be merged with the default one | View Style Object | `{}`
dotStyle | Dots' style that will be merged with the default one | View Style Object | `{}`
inactiveDotOpacity | Value of the opacity effect applied to inactive dots | Number | `0.5`
inactiveDotScale | Value of the 'scale' transform applied to inactive dots | Number | `0.5`

## Usage

Since `<Pagination />` is, purposely, a separated component, you need to connect it to your `<Carousel />` component manually. This is pretty straightforward, but here is an example to get you started.

```javascript
import Carousel, { Pagination } from 'react-native-snap-carousel';

export default class MyCarousel extends Component {

    get slides () {
        const { entries } = this.state;
        return entries.map((entry, index) => {
            // return your slide component
        });
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
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
        );
    }

    render () {
        return (
            <View>
                <Carousel
                  ...
                  onSnapToItem={(index) => this.setState({ activeSlide: index }) }
                >
                    { this.slides }
                </Carousel>
                { this.pagination }
            </View>
        )
    }
```
