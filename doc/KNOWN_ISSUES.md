# Known issues

## Table of contents

1. [`FlatList` and `ScrollView`'s limitations](#flatlist-and-scrollviews-limitations)
1. [React Native version](#react-native-version)
1. [Android performance](#android-performance)
1. [Unreliable callbacks](#unreliable-callbacks)
1. [Error with Jest](#error-with-jest)
1. [RTL support (experimental)](#rtl-support-experimental)

## `FlatList` and `ScrollView`'s limitations

Note that this plugin is built on top of React Native's `FlatList` which, in turn, is based on `VirtualizedList` and `ScrollView`. Unfortunately, their implementations have flaws that affect the plugin, the most problematic ones being the following:
- there is no `scrollEnd` event
- `scrollTo` method doesn't accept any callback
- Android's `scrollTo` animation is quite brutal
- it is not possible to specify a scroll duration
- there are rendering and performance issues with the `FlatList` component.

On top of that, `FlatList` has [its own set of bugs and buggy behaviors](https://github.com/facebook/react-native/issues?utf8=%E2%9C%93&q=flatlist).

We're trying to work around these issues, but the result is not always as smooth as we'd want it to be. **You can help by letting the React Native team know how badly we need those features!** React Native has [a dedicated canny](https://react-native.canny.io/feature-requests) for feature requests; here are the ones that need your vote the most:
- [[ScrollView] Add completion callback to scrollTo](https://react-native.canny.io/feature-requests/p/scrollview-add-completion-callback-to-scrollto)
- [snapToInterval for Android](https://react-native.canny.io/feature-requests/p/snaptointerval-for-android)
- [Add speed attribute to scrollTo](https://react-native.canny.io/feature-requests/p/add-speed-attribute-to-scrollto)
- [Bring ios only methods to Android ScrollView](https://react-native.canny.io/feature-requests/p/bring-ios-only-methods-to-android-scrollview)
- [ScrollView Animation Events (e.g. onScrollAnimationEnd)](https://react-native.canny.io/feature-requests/p/scrollview-animation-events-eg-onscrollanimationend)

Remember that every vote counts and take a look at [#203](https://github.com/archriss/react-native-snap-carousel/issues/203) for more info!

## React Native version

:warning: **RN 0.43.x is the minimum recommended version for plugin releases `>= 3.0.0` since it was the first version to introduce the `FlatList` component.** Since version `3.5.0`, the component will fall back to rendering a `ScrollView` if you're using an older version of React Native (mirroring the effect of setting prop `useScrollView` to `true`). **But keep in mind that the `ScrollView` component is not suited to render a huge number of items.** If you experience performance issues, consider updating your React Native version and using the default `FlatList` version.

Bear in mind that we follow RN evolutions closely, which means newer versions of the plugin might break when used in conjunction with a version of RN that is not the latest stable one.

## Android performance

:warning: **Make sure to test carousel's performance and behavior without JS Dev Mode enabled, ideally with a production build.**.

It can take user experience from "crappy and sluggish" to "pretty good" - it's Android though, so nothing like "perfect" or "incredibly smooth"...

Also, make sure to implement all the recommendations listed [here](https://github.com/archriss/react-native-snap-carousel/blob/master/doc/TIPS_AND_TRICKS.md#optimizing-performance).

## Unreliable callbacks

When `enableMomentum` is disabled (default behavior), providing a reliable callback is really tricky since no `scrollEnd` event has been exposed yet for the `ScrollView` component. We can only rely on the `scrollEndDrag` event, which comes with a huge bunch of issues. See [#34](https://github.com/archriss/react-native-snap-carousel/issues/34) for more information.

Version 2.3.0 tackled these issues with all sorts of flags and hacks. But you could still be facing the following one: **when you build a debug version of your app without enabling JS remote debugging, timers may desynchronize and cause a complete callback mess**. Try to either enable remote debugging or build a production version of your app, and everything should get back to normal.

Callback handling has been completely revamped in version 3.2.0, in a less hacky and more reliable way. There is one issue though: callbacks now rely on scroll events. Usually, this is not a problem since the plugin features a native-powered scroll. **But there has been [a regression in React Native 0.46.x](https://github.com/facebook/react-native/issues/15769), that has been fixed in version 0.48.2.**

If you're using an in-between version, you're in for some trouble since events won't be fired frequently enough (particularly on Android). **We've added a prop `callbackOffsetMargin` to help with this situation.**

## Error with Jest

You might encounter the following error when using the plugin in conjonction with Jest: `TypeError: Cannot read property 'style' of undefined at Object.<anonymous>`.

As you can see [here](https://github.com/facebook/react-native/blob/master/jest/setup.js), this is because React Native mocks `ScrollView` for you when you write unit tests with Jest.

The easiest workaround is to add `jest.unmock('ScrollView')` before importing the component in your test file (thanks [@hoangnm](https://github.com/hoangnm) for the tip!).

## RTL support (experimental)

Since version 2.1.0, the plugin is compatible with RTL layouts. Our implementation relies on miscellaneous hacks that work around a [React Native bug](https://github.com/facebook/react-native/issues/11960) with horizontal `ScrollView`. As such, this feature should be considered experimental since it might break with newer versions of React Native.

Note that you may want to reverse the order of your data array for your items to be displayed in the proper RTL order. We've tried implementing it internally, but this led to numerous and unnecessary issues. You'll just have to do something as simple as `myCustomData.reverse()`.
