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

### :raised_hands: New feature: layouts

Go [there](#layouts-and-custom-interpolations) if you want to learn more about it.

![react-native-snap-carousel default layout](https://i.imgur.com/e1WbZcu.gif)
![react-native-snap-carousel tinder layout](https://i.imgur.com/R7OpEFs.gif)
![react-native-snap-carousel stack layout](https://i.imgur.com/foMIGM2.gif)

-----

### :sparkles: Do you want an even better plugin? [Vote for React Native's feature requests](https://github.com/archriss/react-native-snap-carousel/issues/203) to let the Facebook team know what they need to improve!

-----

### :warning: Before submitting a new issue, make sure to read [the guidelines](https://github.com/archriss/react-native-snap-carousel/blob/master/CONTRIBUTING.md) and then to fill out the [issue template](https://github.com/archriss/react-native-snap-carousel/blob/master/ISSUE_TEMPLATE.md)!

-----

## Table of contents

1. [New feature](#new-feature)
1. [Showcase](#showcase)
1. [Usage](#usage)
1. [Important note regarding Android](#important-note-regarding-android)
1. [Props, methods and getters](#props-methods-and-getters)
1. [Layouts and custom interpolations](#layouts-and-custom-interpolations)
1. [`ParallaxImage` component](#parallaximage-component)
1. [`Pagination` component](#pagination-component)
1. [Example](#example)
1. [Tips and tricks](#tips-and-tricks)
1. [Known issues](#known-issues)
1. [Migration from version 2.x](#migration-from-version-2x)
1. [Roadmap](#roadmap)
1. [Credits](#credits)

## Showcase

### Archriss' "Ville d'Aix-en-Provence" app

**This app is available on [Android](https://play.google.com/store/apps/details?id=fr.archriss.aixmobile.app) and [iOS](https://itunes.apple.com/fr/app/ville-daix-en-provence/id494548366?mt=8).** It uses **version 3.2.0** of the plugin, with `FlatList`'s implementation and [parallax images](#parallaximage-component).

![react-native-snap-carousel archriss aix](https://i.imgur.com/pPm0csc.gif)
![react-native-snap-carousel archriss aix](https://i.imgur.com/UFsPlz2.gif)

### Archriss' showcase app

**You can try the app live on [Android](https://play.google.com/store/apps/details?id=fr.archriss.demo.app) and [iOS](https://itunes.apple.com/lu/app/archriss-presentation-mobile/id1180954376?mt=8).** It currently uses **version 1.4.0** of the plugin. Be aware that sliders' layouts will break on RTL devices since support was added in version 2.1.0 (see [#38](https://github.com/archriss/react-native-snap-carousel/issues/38)).

![react-native-snap-carousel](https://i.imgur.com/Fope3uj.gif)
![react-native-snap-carousel](https://i.imgur.com/WNOBYfl.gif)
![react-native-snap-carousel](https://i.imgur.com/sK5DKaG.gif)

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

## Props, methods and getters

You can find the dedicated documentation [here](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md).

## Layouts and custom interpolations

### Built-in layouts

In version `3.6.0`, we've added two new layouts on top of the default one: one called 'stack', which mimic a stack of cards, and another called 'tinder', since it has a Tinder-like animation.

You can choose between the three of them with [the new prop `layout`](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md#style-and-animation) and you can change the card offset in the 'stack' and 'tinder' layouts with [prop `layoutCardOffset`](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md#style-and-animation)]

![react-native-snap-carousel default layout](https://i.imgur.com/e1WbZcu.gif)
```javascript
<Carousel layout={'default'} />
```

![react-native-snap-carousel stack layout ios](https://i.imgur.com/c7pU4rT.gif)
![react-native-snap-carousel stack layout android](https://i.imgur.com/AnruacR.gif)
```javascript
<Carousel layout={'stack'} layoutCardOffset={`18`} />
```

![react-native-snap-carousel tinder layout ios](https://i.imgur.com/D9QyTzb.gif)
![react-native-snap-carousel tinder layout android](https://i.imgur.com/ab1TI4e.gif)
```javascript
<Carousel layout={'tinder'} layoutCardOffset={`9`} />
```

A few things worth noting:
* As you can see, the effect had to be inverted on Android. This is because of [a really annoying Android-specific bug](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/CUSTOM_INTERPOLATIONS.md#android).
* Even though the new layouts have been creted with horizontal carousels in mind, they will also work with vertical ones \o/

### Custom interpolations

On top of the new layouts, we've exposed the logic we used so that users can create more awesome layouts! If you're interested, take a deep breath and see [the dedicated documentation](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/CUSTOM_INTERPOLATIONS.md).

Here are two examples of what can easily be achieved (you can explore [the source code](https://github.com/archriss/react-native-snap-carousel/blob/master/example/src/utils/animations.js) and try it live in [the provided example](https://github.com/archriss/react-native-snap-carousel/tree/master/example)):

![react-native-snap-carousel custom layout](https://i.imgur.com/slnTbyG.gif)
![react-native-snap-carousel custom layout](https://i.imgur.com/OrdLsCM.gif)

## `ParallaxImage` component

Version `3.0.0` introduced a `<ParallaxImage />` component, an image component aware of carousel's current scroll position and therefore able to display a nice parallax effect.

You can find the documentation for this component [here](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PARALLAX_IMAGE.md).

![react-native-snap-carousel parallax image](https://i.imgur.com/6iIb4SR.gif)

## `Pagination` component

Starting with version `2.4.0`, a customizable `<Pagination />` component has been added. This is how it looks like with its default configuration:

You can find the documentation for this component [here](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/PAGINATION.md).

![react-native-snap-carousel pagination](https://i.imgur.com/FLQcGGL.gif)

## Example
You can find the following example in the [`/example` folder](https://github.com/archriss/react-native-snap-carousel/tree/master/example).

![react-native-snap-carousel](https://i.imgur.com/pZincya.gif)

## Tips and tricks

All the useful tips and tricks have been gathered [here](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/TIPS_AND_TRICKS.md) - there is a bunch of them, so this section is a must-read!

## Known issues

**Make sure to read about [the known issues](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/KNOWN_ISSUES.md) before opening a new one**; you may find something useful.

## Roadmap

- [ ] Add more examples
- [ ] Handle different items' width/height
- [X] Implement different layouts and allow using custom interpolations
- [X] Implement both `FlatList` and `ScrollView` handling
- [X] Add the ability to provide custom items animation
- [X] Implement 'loop' mode
- [X] Improve Android's behavior
- [x] Add parallax image component
- [x] Base the plugin on `FlatList` instead of `ScrollView`
- [x] Add alignment option
- [x] Add pagination component
- [x] Add vertical implementation
- [x] Handle device orientation event (see [this note](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/TIPS_AND_TRICKS.md#handling-device-rotation))
- [x] Add RTL support
- [x] Improve momemtum handling
- [x] Improve snap on Android
- [x] Handle passing 1 item only
- [x] Fix centering

## Credits

Written by [Benoît Delmaire](https://fr.linkedin.com/in/benoitdelmaire) ([bd-arc](https://github.com/bd-arc)) and [Maxime Bertonnier](https://fr.linkedin.com/in/maxime-bertonnier-744351aa) ([Exilz](https://github.com/Exilz)) at
[Archriss](http://www.archriss.com/).
