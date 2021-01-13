# Implementing custom interpolations

> :warning: **This guide describes an advanced feature that is not intended for the faint-hearted**. Your sanity will be seriously challenged by the two most-feared enemies of this plugin: Android and React Native's `FlatList`. You **will** discover bugs that will drive you mad and, as a result, your aging process will accelerate drastically. Consider yourself warned and make sure to read [the caveats](#caveats) first and foremost!

## Table of contents

1. [Preview](#preview)
1. [Usage](#usage)
1. [Step-by-step example](#step-by-step-example)
1. [Caveats](#caveats)

## Preview

Version `3.6.0` introduced a new cool feature: layouts. On top of the default one, we've implemented two other ways of stacking and animating items in the carousel. You can choose between these with [prop `layout`](https://github.com/meliorence/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md#style-and-animation). Here how each one looks like (the reason why iOS and Android are differents [will be explained later](#caveats)):

![react-native-snap-carousel default layout](https://i.imgur.com/e1WbZcu.gif)
```javascript
<Carousel layout={'default'} />
```

![react-native-snap-carousel stack layout ios](https://i.imgur.com/c7pU4rT.gif)
![react-native-snap-carousel stack layout android](https://i.imgur.com/AnruacR.gif)
```javascript
<Carousel layout={'stack'} />
```

![react-native-snap-carousel tinder layout ios](https://i.imgur.com/D9QyTzb.gif)
![react-native-snap-carousel tinder layout android](https://i.imgur.com/ab1TI4e.gif)
```javascript
<Carousel layout={'tinder'} />
```

We are able to do all this thanks to React Native's great [Animated API](https://facebook.github.io/react-native/docs/animations.html). Basically, we interpolate the current scroll position and provide to each item a set of animations based on this value. But those new layouts are just the tip of the iceberg. You can easily create others like these ones:

![react-native-snap-carousel custom layout](https://i.imgur.com/slnTbyG.gif)
![react-native-snap-carousel custom layout](https://i.imgur.com/OrdLsCM.gif)
![react-native-snap-carousel custom layout](https://i.imgur.com/Nht4w9D.gif)
![react-native-snap-carousel custom layout](https://i.imgur.com/kDx3xTc.gif)

We've decided to expose a way for users to provide their own interpolators, customize their carousels and create awesome animations! Note that you can find the source code of the built-in layouts [here](https://github.com/meliorence/react-native-snap-carousel/blob/master/src/utils/animations.js) and the source code of the custom examples [here](https://github.com/meliorence/react-native-snap-carousel/blob/master/example/src/utils/animations.js). Taking a look at these is a very good way to understand how it works.

## Usage

### Prerequisites

- You have some experience with React Native's [Animated API](https://facebook.github.io/react-native/docs/animations.html).
- You have a good understanding of [Animated's interpolations](https://github.com/browniefed/react-native-animation-book/blob/master/INTERPOLATION.md).
- You've read and understood [the caveats](#caveats).
- You are known for both your mental toughness and the peace of your mind.

### Summary

Adding a custom interpolation is done by providing either one of these props (but most likely both): `scrollInterpolator` and `slideInterpolatedStyle`.

:bulb: You cannot use prop `activeAnimationOptions` in conjunction with custom interpolations. Make sure it isn't set since the scroll position will simply not be interpolated otherwise.

### Prop `scrollInterpolator`

This prop will be used to interpolate the scroll position. Particularly, this means associating a specific scroll position to a specific value that is going to be used in `slideInterpolatedStyle` in order to animate styles.

`scrollInterpolator` **has to be a function**. It will be called for every item in the data set on carousel's initialization and **it will receive two arguments: `index` and `carouselProps`**. The first one is the item index and the second one contains every carousel props since you might need them to define your interpolation. **The function must return an object of the following shape:**

```javascript
{
    inputRange: [scroll value 1, scroll value 2, ...],
    outputRange: [value associated with 1, value associated with 2, ...],
}
```

> :warning: **Both arrays must have the same length**, otherwise you'll get an error.

Since it can be pretty difficult to determine the adequate `inputRange` we've created a helper for you: [`getInputRangeFromIndexes(range, index, carouselProps)`](https://github.com/meliorence/react-native-snap-carousel/blob/master/src/utils/animations.js#L5:L24). You only need to determine the range of items **relative to the active one** you'd like to animate at the same time. The current item will be zero-indexed in this function. For example, using a range of `[1, 0, -1]` means that you will be able to animate the current active item (`0`), the previous one (`-1)` and the next one (`1`).

> :warning: As you might have noticed, **when using `getInputRangeFromIndexes()` you need to declare your range in a reverse order**. While this is pretty counter-intuitive, you'll otherwise get an error because `"inputRange must be monotonically increasing"`.

### Prop `slideInterpolatedStyle`

This prop is where the magic happens and where you're finally able to bend item's animation to your will. **`slideInterpolatedStyle` must be a function that returns a style object. It will receive three arguments: `index`, `animatedValue` and `carouselProps`.** The first and the last one are the same as the ones passed in `scrollInterpolator`, while `animatedValue` correspond with the animated value of carousel's scroll position.

Based on the range you declared in `scrollInterpolator`, you can now interpolate values and do whatever you want.

> :bulb: Unlike what you need to do in `scrollInterpolator`, the `inputRange` you declare in `slideInterpolatedStyle` has to be in a regular order.

Consider the following:

```javascript
function animatedStyle = (index, animatedValue, carouselProps) => {
    return {
        opacity: animatedValue.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [0, 1, 0.5],
            extrapolate: 'clamp'
        })
    }
}
```

It will translate into:
- item `-1` (the previous one) will have an opacity of `0`
- item `0` (the active one) will have an opacity of `1`
- item `1` (the next one) will have an opacity of `0.5`.

When you scroll, items' opacity will progressively animate from one value to the next, following the scroll position.

: bulb: Using `extrapolate: 'clamp'` will prevent your interpolation to exceed `outputRange`'s values, the "clamping" being desirable with most use cases. From [the RN doc](https://facebook.github.io/react-native/docs/animations.html#interpolation): *"By default, it will extrapolate the curve beyond the ranges given, but you can also have it clamp the output value."*

## Step-by-step example

It is recommended to take a look at [the source code of the built-in layouts](https://github.com/meliorence/react-native-snap-carousel/blob/master/src/utils/animations.js) and at [the source code the custom examples](https://github.com/meliorence/react-native-snap-carousel/blob/master/example/src/utils/animations.js); you'll learn a lot!

For those who want to follow through a step-by-step tutorial, the following is for you.

### Defining the scroll interpolator

Let's say we want to create a photo album effect: when swiping, the active item will move away and the next ones will appear from underneath. Of course, these items are going to be slightly rotated.

First things first: for which items do we need to create a custom animation?
- Item `-1`: the item that has been moved away.
- Item `0`: the active item.
- Items `1` and `2`: underneath rotated items.
- Item `3`: invisible item that will make item `2` appear with an opacity transition.

With this clarified, declaring the scroll interpolator is as simple as :

```javascript
import { getInputRangeFromIndexes } from 'react-native-snap-carousel';

function scrollInterpolator (index, carouselProps) {
    const range = [3, 2, 1, 0, -1]; // <- Remember that this has to be declared in a reverse order
    const inputRange = getInputRangeFromIndexes(range, index, carouselProps);
    const outputRange = range;

    return { inputRange, outputRange };
}
```

### Creating the animations

This is where the fun begins!

The first trick is **to ensure that the active item will always sit on top of the next ones**. By default, an item with a higher index will also have a higher `zIndex`. To counteract this, you can use the following. :warning: **Currently, this can lead to swipe/click events being missed!** See [this issue](https://github.com/meliorence/react-native-snap-carousel/issues/262) for more info.

```javascript
{
    zIndex: carouselProps.data.length - index
}
```

Then we can define the `opacity` animation. Since we only need a transition between the second and third items, declaring it is pretty straightforward:

```javascript
opacity: animatedValue.interpolate({
    inputRange: [2, 3],
    outputRange: [1, 0]
})
```

Now for the `rotate` animation. The active item and the third one won't be rotated at all, while the previous one will be in order to add a nice visual effect when swiping. Read [this](https://facebook.github.io/react-native/docs/animations.html#interpolation) if you need an explanation of the `extrapolate` property.

```javascript
transform: [{
    rotate: animatedValue.interpolate({
        inputRange: [-1, 0, 1, 2, 3], // <- Unlike with `scrollInterpolator()`, this is declared in a regular order
        outputRange: ['-25deg', '0deg', '-3deg', '1.8deg', '0deg'],
        extrapolate: 'clamp'
    })
}]
```

The tricky part is the `transform` animation. First, we need to ensure that our animated items are all centered in the carousel. To do that, we need to apply a translation equals to: **`-itemWidth` (or `-itemHeight` for vertical sliders) * relative index**. Then, we want item `-1` to move a bit more quickly than the others, which means negatively translating it. Finally, it's a good idea to make our animations compatible with both horizontal and vertical carousels. Hence the following:

```javascript
const sizeRef = carouselProps.vertical ? carouselProps.itemHeight : carouselProps.itemWidth;
const translateProp = carouselProps.vertical ? 'translateY' : 'translateX';

return {
    transform: [{
        [translateProp]: animatedValue.interpolate({
            inputRange: [-1, 0, 1, 2, 3],
            outputRange: [
                -sizeRef * 0.5,
                0,
                -sizeRef, // centered
                -sizeRef * 2, // centered
                -sizeRef * 3 // centered
            ],
            extrapolate: 'clamp'
        })
    }]
};
```

Let's put it all together:

```javascript
import React, { PureComponent } from 'react';
import Carousel, { getInputRangeFromIndexes } from 'react-native-snap-carousel';

export default class MyCustomCarousel extends PureComponent {

    _scrollInterpolator (index, carouselProps) {
        const range = [3, 2, 1, 0, -1];
        const inputRange = getInputRangeFromIndexes(range, index, carouselProps);
        const outputRange = range;

        return { inputRange, outputRange };
    }

    _animatedStyles (index, animatedValue, carouselProps) {
        const sizeRef = carouselProps.vertical ? carouselProps.itemHeight : carouselProps.itemWidth;
        const translateProp = carouselProps.vertical ? 'translateY' : 'translateX';

        return {
            zIndex: carouselProps.data.length - index,
            opacity: animatedValue.interpolate({
                inputRange: [2, 3],
                outputRange: [1, 0]
            }),
            transform: [{
                rotate: animatedValue.interpolate({
                    inputRange: [-1, 0, 1, 2, 3],
                    outputRange: ['-25deg', '0deg', '-3deg', '1.8deg', '0deg'],
                    extrapolate: 'clamp'
                })
            }, {
                [translateProp]: animatedValue.interpolate({
                    inputRange: [-1, 0, 1, 2, 3],
                    outputRange: [
                        -sizeRef * 0.5,
                        0,
                        -sizeRef, // centered
                        -sizeRef * 2, // centered
                        -sizeRef * 3 // centered
                    ],
                    extrapolate: 'clamp'
                })
            }]
        };
    }

    render () {
        return (
            <Carousel
              // other props
              scrollInterpolator={this._scrollInterpolator}
              slideInterpolatedStyle={this._animatedStyles}
              useScrollView={true}
            />
        );
    }
}
```

Here is the result, which you can try live in [the provided example](https://github.com/meliorence/react-native-snap-carousel/tree/master/example):

![react-native-snap-carousel custom layout](https://i.imgur.com/slnTbyG.gif)

:pill: Now for the bad news: **as is, this example won't be properly rendered on Android**. Continue reading to find out why and to discover ways to make it work.

## Caveats

### Android

If you have any kind of experience with React Native, you already know that Android is always there to punch you in the face when you make the mistake of thinking that everything is fine.

The issue here is pretty simple but very sad: [Android doesn't honor the `zIndex` property for `ScrollView`'s items](https://github.com/facebook/react-native/issues/16878). In concrete terms, this means that all items **after** the current active one will visually sit on top of it. Usually, you won't want that to happen.

For most layouts, you will probably use the following trick to render the active item on top of the next ones (as seen in the 'stack' layout, the 'tinder' layout, the step-by-step example, and more):

```javascript
{ zIndex: carouselProps.data.length - index }
```

Well, do not bother doing so on Android since it just won't work... As far as we know, you have three ways of dealing with this matter:
- **Use Android-specific prop `elevation`** -> `{ elevation: carouselProps.data.length - index }`. While this will work from a visual point of view, it has two major drawbacks: you will generate shadows (which you can "cut" with a container) and, more importantly, it has no effect over the rendering hierarchy. This means that **the item receving the tap event is not going to be the active one**. Pretty bothersome, right? Still, if you don't provide user interaction, this solution can be enough.
- **Invert the effect**. This is what has been done for the built-in layouts. Since the active item will always sits on top of the previous one on Android, background cards are made of the previous items instead of the next ones.
- **Use `FlatList`'s prop `inverted` with a reverse data set**. This provides the perfect transition to our second main problem...


### The `FlatList` component

`FlatList` is buggy as hell, period.

With custom interpolations, what you're most likely to experience is... nothing! Your incredible animations are not going to be played because the next and previous items are going to show up too late to the party.

Two solutions:
- **Play with the following `FlatList` props** until you find something that suits your needs (or not): `initialNumToRender`, `maxToRenderPerBatch`, `windowSize` and `updateCellsBatchingPeriod`.
- **Set `useScrollView` to `true` and/or `removeClippedSubviews` to `false`**. End of the bugs. :warning: This is a trade-off: you will have to forget about the performance optimizations that *are supposed* to come with `FlatList`, but your sanity will be preserved. We've chosen this solution for the 'stack' and 'tinder' layouts. **Bear in mind that this solution is not suited for large data sets.**

### Others

We use the native driver to ensure smooth animations and prevent performance issues. As stated [in RN doc](https://facebook.github.io/react-native/docs/animations.html#caveats): *"Not everything you can do with Animated is currently supported by the native driver. The main limitation is that **you can only animate non-layout properties: things like `transform` and `opacity` will work, but flexbox and position properties will not**."*.

## What's next?

We hope that you find this feature as awesome and useful as we are. Now go create awesome animations!

We only ask for one thing in return: **please share with us your most interesting interpolations!**