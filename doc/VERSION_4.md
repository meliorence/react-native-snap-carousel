# A shiny new version is on its way!

![react-native-snap-carousel mind blown](https://i.imgur.com/gdaKtSm.gif)

## 💡 Why?

So far, and because of [numerous React Native limitations](https://github.com/meliorence/react-native-snap-carousel/issues/203), the entire plugin has basically been based on a pile of hacks and workarounds...

With the most recent versions of React Native, a few interesting props have appeared and made me consider the possibility of finally rewriting the inner logic of the carousel.

Don't get me wrong: we'll still have to rely on a few hacks to account for, well, Android particularly. But it was possible to get rid of most of them, and that is for the best!

## ✨ Wonderful benefits

Most of the heavy work is done, and here's what you can enjoy out-of-the-box:

- **(Very) Smooth scrolling.** Put simply, this is night and day. Just try it for yourself and you'll see that there's just no going back!
- **Reliable callback logic.**
- **Optimized custom interpolations ('stack' and 'tinder' layouts for example) that can be used with a huge number of items.** Previously, you couldn't use those with a big data set as this would create performance issues. :warning: **This one is iOS-only for now** (but, given a few recent tests, we might find a way to make it work on Android).
- **An experimental snap feature** that is promising but not yet complete (see below).

## 📍 Next steps

Before making it widely available, **I now need your help** 🙌

The first thing you can do is test this new version and let me know how it works for you and you particular setup. For example, vertical carousels, pagination and parallax images haven't been tested yet — they are expected to work properly though.

### How to test?

- You can find the already published beta versions by running: `npm view react-native-snap-carousel versions --json`
- [Follow this PR closely](https://github.com/meliorence/react-native-snap-carousel/pull/678). **This is where the discussion will take place.**
- And if you like to live on the edge, [try the latest commits](https://stackoverflow.com/a/27630247/) of that same PR ;-)

### 🦸‍♀️🦸‍♂️ Get your hands dirty!

Then, **if you want to jump in**, I'd be glad if you could help me with the following:

1. **Reducing the number of rerenders** (see [#478](https://github.com/meliorence/react-native-snap-carousel/issues/478)). [`why-did-you-render`](https://github.com/welldone-software/why-did-you-render) is going to prove really helpful for that.
2. **Finding a way to make the experimental snap feature work even with the last items** (see "New props" below for more details on this feature).

Let's finish that together and make sure this plugin remains absolutely awesome!

Cheers,
[bd-arc](https://github.com/bd-arc)

---

## 📚 New, updated and removed props

### New props

Prop | Description | Type | Default
------ | ------ | ------ | ------
✅ **`useExperimentalSnap`** | By default, items will always be centered according to the `activeSlideAlignment` prop. A sometimes unwanted result of this is the addition of empty spaces at the end/beginning of the carousel. Since version 4, it is possible to use another centering option that will avoid white spaces. :warning: **If you set it to `true`, some items might not be "reachable" — i.e. for the last item(s), the snap callbacks won't be triggered and the animations won't be complete.** We recommend activate it only if you don't rely on `onSnapToItem` and if both `inactiveSlideScale` and `inactiveSlideOpacity` are set to `1`. A side benefit of activating it is **the ability to slide only one item at a time** when setting the inherited prop `disableIntervalMomentum` to `true`. | Boolean | `false`
✅ **`onScrollIndexChanged(slideIndex)`** | Executed as soon as the active index changes during scroll (whereas `onSnapToItem` is executed only for the last active item). :warning: **Avoid doing heavy calculations or rendering here!** | Function | `undefined`

### Updated props

Prop | Description | Type | Default
------ | ------ | ------ | ------
✅ **`renderItem({ item, index, dataIndex })`** | `renderItem()` now receives a **`dataIndex` param** that will represent the index based on your data set and not on the actual number of items — the two numbers won't match for looped carousels. This is useful if you need to pass to the item something based on your data rather than on the inner index. | Function | **Required**

### Removed props

- ❌ `activeAnimationOptions`
- ❌ `activeAnimationType`
- ❌ `enableMomentum`
- ❌ `lockScrollTimeoutDuration`
- ❌ `lockScrollWhileSnapping`
- ❌ `onBeforeSnapToItem`
- ❌ `swipeThreshold`