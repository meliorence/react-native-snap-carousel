import React, { PropsWithChildren } from 'react';
import {
    Animated,
    FlatList,
    I18nManager,
    Platform,
    ScrollView,
    View,
    StyleProp,
    NativeSyntheticEvent,
    NativeScrollEvent,
    LayoutChangeEvent,
    GestureResponderEvent,
    ViewStyle
} from 'react-native';
import shallowCompare from 'react-addons-shallow-compare';
import {
    defaultScrollInterpolator,
    stackScrollInterpolator,
    tinderScrollInterpolator,
    defaultAnimatedStyles,
    shiftAnimatedStyles,
    stackAnimatedStyles,
    tinderAnimatedStyles
} from '../utils/animations';
import type { CarouselProps, CarouselState } from './types';

// Metro doesn't support dynamic imports - i.e. require() done in the component itself
// But at the same time the following import will fail on Snack...
// TODO: find a way to get React Native's version without having to assume the file path
// import RN_PACKAGE from '../../../react-native/package.json';

const IS_ANDROID = Platform.OS === 'android';

// React Native automatically handles RTL layouts; unfortunately, it's buggy with horizontal ScrollView
// See https://github.com/facebook/react-native/issues/11960
// NOTE: the following variable is not declared in the constructor
// otherwise it is undefined at init, which messes with custom indexes
const IS_RTL = I18nManager.isRTL;

export class Carousel<TData> extends React.Component<
  CarouselProps<TData>,
  CarouselState
> {
  static defaultProps = {
      activeSlideAlignment: 'center',
      activeSlideOffset: 20,
      apparitionDelay: 0,
      autoplay: false,
      autoplayDelay: 1000,
      autoplayInterval: 3000,
      callbackOffsetMargin: 5,
      containerCustomStyle: {},
      contentContainerCustomStyle: {},
      enableSnap: true,
      firstItem: 0,
      hasParallaxImages: false,
      inactiveSlideOpacity: 0.7,
      inactiveSlideScale: 0.9,
      inactiveSlideShift: 0,
      layout: 'default',
      loop: false,
      loopClonesPerSide: 3,
      scrollEnabled: true,
      slideStyle: {},
      shouldOptimizeUpdates: true,
      useExperimentalSnap: false,
      useScrollView: !Animated.FlatList
  };

  _activeItem: number;
  _onScrollActiveItem: number;
  _previousFirstItem: number;
  _previousItemsLength: number;
  _mounted: boolean;
  _positions: { start: number; end: number }[];
  _currentScrollOffset: number;
  _scrollEnabled: boolean;

  _initTimeout?: ReturnType<typeof setTimeout>;
  _apparitionTimeout?: ReturnType<typeof setTimeout>;
  _hackSlideAnimationTimeout?: ReturnType<typeof setTimeout>;
  _enableAutoplayTimeout?: ReturnType<typeof setTimeout>;
  _autoplayTimeout?: ReturnType<typeof setTimeout>;
  _snapNoMomentumTimeout?: ReturnType<typeof setTimeout>;
  _androidRepositioningTimeout?: ReturnType<typeof setTimeout>;
  _autoplayInterval?: ReturnType<typeof setInterval>;

  _scrollPos?: Animated.Value;

  _onScrollHandler?: ReturnType<typeof Animated.event>;

  _carouselRef: ScrollView | FlatList<TData> | null = null;

  _autoplaying?: boolean;
  _autoplay?: boolean;

  _onLayoutInitDone?: boolean;

  constructor (props: CarouselProps<TData>) {
      super(props);

      this.state = {
          hideCarousel: !!props.apparitionDelay,
          interpolators: []
      };

      // this._RNVersionCode = this._getRNVersionCode();

      // The following values are not stored in the state because 'setState()' is asynchronous
      // and this results in an absolutely crappy behavior on Android while swiping (see #156)
      const initialActiveItem = this._getFirstItem(props.firstItem);
      this._activeItem = initialActiveItem;
      this._onScrollActiveItem = initialActiveItem;
      this._previousFirstItem = initialActiveItem;
      this._previousItemsLength = initialActiveItem;

      this._mounted = false;
      this._positions = [];
      this._currentScrollOffset = 0; // Store ScrollView's scroll position
      this._scrollEnabled = props.scrollEnabled !== false;

      this._getCellRendererComponent = this._getCellRendererComponent.bind(this);
      this._getItemLayout = this._getItemLayout.bind(this);
      this._getKeyExtractor = this._getKeyExtractor.bind(this);
      this._onLayout = this._onLayout.bind(this);
      this._onScroll = this._onScroll.bind(this);
      this._onMomentumScrollEnd = this._onMomentumScrollEnd.bind(this);
      this._onTouchStart = this._onTouchStart.bind(this);
      this._onTouchEnd = this._onTouchEnd.bind(this);
      this._renderItem = this._renderItem.bind(this);

      // WARNING: call this AFTER binding _onScroll
      this._setScrollHandler(props);

      // Display warnings
      this._displayWarnings(props);
  }

  componentDidMount () {
      const { apparitionDelay, autoplay, firstItem } = this.props;

      this._mounted = true;
      this._initPositionsAndInterpolators();

      // Without 'requestAnimationFrame' or a `0` timeout, images will randomly not be rendered on Android...
      this._initTimeout = setTimeout(() => {
          if (!this._mounted) {
              return;
          }

          const apparitionCallback = () => {
              if (apparitionDelay) {
                  this.setState({ hideCarousel: false });
              }
              if (autoplay) {
                  this.startAutoplay();
              }
          };

          // FlatList will use its own built-in prop `initialScrollIndex`
          if (this._needsScrollView()) {
              const _firstItem = this._getFirstItem(firstItem);
              this._snapToItem(_firstItem, false, false, true);
              // this._hackActiveSlideAnimation(_firstItem);
          }

          if (apparitionDelay) {
              this._apparitionTimeout = setTimeout(() => {
                  apparitionCallback();
              }, apparitionDelay);
          } else {
              apparitionCallback();
          }
      }, 1);
  }

  shouldComponentUpdate (
      nextProps: CarouselProps<TData>,
      nextState: CarouselState
  ): boolean {
      if (this.props.shouldOptimizeUpdates === false) {
          return true;
      } else {
          return shallowCompare(this, nextProps, nextState);
      }
  }

  componentDidUpdate (prevProps: CarouselProps<TData>) {
      const { interpolators } = this.state;
      const {
          firstItem,
          scrollEnabled
      } = this.props;
      const itemsLength = this._getCustomDataLength(this.props);

      if (!itemsLength) {
          return;
      }

      const nextFirstItem = this._getFirstItem(firstItem, this.props);
      let nextActiveItem =
      typeof this._activeItem !== 'undefined' ?
          this._activeItem :
          nextFirstItem;

      const hasNewSize = this.props.vertical !== prevProps.vertical ||
       (
           this.props.vertical && prevProps.vertical && (
               prevProps.itemHeight !== this.props.itemHeight || prevProps.sliderHeight !== this.props.sliderHeight
           )
       ) || (
          !this.props.vertical && !prevProps.vertical && (
              prevProps.itemWidth !== this.props.itemWidth || prevProps.sliderWidth !== this.props.sliderWidth
          )
      );

      // Prevent issues with dynamically removed items
      if (nextActiveItem > itemsLength - 1) {
          nextActiveItem = itemsLength - 1;
      }

      // Handle changing scrollEnabled independent of user -> carousel interaction
      if (scrollEnabled !== prevProps.scrollEnabled) {
          this._setScrollEnabled(scrollEnabled);
      }

      if (
          interpolators.length !== itemsLength ||
          hasNewSize
      ) {
          this._activeItem = nextActiveItem;
          this._previousItemsLength = itemsLength;

          this._initPositionsAndInterpolators(this.props);

          // Handle scroll issue when dynamically removing items (see #133)
          // This also fixes first item's active state on Android
          // Because 'initialScrollIndex' apparently doesn't trigger scroll
          if (this._previousItemsLength > itemsLength) {
              this._hackActiveSlideAnimation(nextActiveItem);
          }

          if (hasNewSize) {
              this._snapToItem(nextActiveItem, false, false, true);
          }
      } else if (
          nextFirstItem !== this._previousFirstItem &&
      nextFirstItem !== this._activeItem
      ) {
          this._activeItem = nextFirstItem;
          this._previousFirstItem = nextFirstItem;
          this._snapToItem(nextFirstItem, false, true, true);
      }

      if (this.props.onScroll !== prevProps.onScroll) {
          this._setScrollHandler(this.props);
      }
  }

  componentWillUnmount () {
      this._mounted = false;
      this.stopAutoplay();
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._initTimeout);
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._apparitionTimeout);
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._hackSlideAnimationTimeout);
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._enableAutoplayTimeout);
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._autoplayTimeout);
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._snapNoMomentumTimeout);
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._androidRepositioningTimeout);
  }

  get realIndex () {
      return this._activeItem;
  }

  get currentIndex () {
      return this._getDataIndex(this._activeItem);
  }

  get currentScrollPosition () {
      return this._currentScrollOffset;
  }

  _setScrollHandler (props: CarouselProps<TData>) {
      // Native driver for scroll events
      const scrollEventConfig = {
          listener: this._onScroll,
          useNativeDriver: true
      };
      this._scrollPos = new Animated.Value(0);
      const argMapping = props.vertical ?
          [{ nativeEvent: { contentOffset: { y: this._scrollPos } } }] :
          [{ nativeEvent: { contentOffset: { x: this._scrollPos } } }];

      // @ts-expect-error Let's ignore for now that trick
      if (props.onScroll && Array.isArray(props.onScroll._argMapping)) {
      // Because of a react-native issue https://github.com/facebook/react-native/issues/13294
          argMapping.pop();
          // @ts-expect-error Let's ignore for now that trick
          const [argMap] = props.onScroll._argMapping;
          if (argMap && argMap.nativeEvent && argMap.nativeEvent.contentOffset) {
              // Shares the same animated value passed in props
              this._scrollPos =
          argMap.nativeEvent.contentOffset.x ||
          argMap.nativeEvent.contentOffset.y ||
          this._scrollPos;
          }
          // @ts-expect-error Let's ignore for now that trick
          argMapping.push(...props.onScroll._argMapping);
      }
      this._onScrollHandler = Animated.event<NativeScrollEvent>(
          argMapping,
          scrollEventConfig
      );
  }

  // This will return a future-proof version code number compatible with semantic versioning
  // Examples: 0.59.3 -> 5903 / 0.61.4 -> 6104 / 0.62.12 -> 6212 / 1.0.2 -> 10002
  // _getRNVersionCode () {
  //     const version = RN_PACKAGE && RN_PACKAGE.version;
  //     if (!version) {
  //         return null;
  //     }
  //     const versionSplit = version.split('.');
  //     if (!versionSplit || !versionSplit.length) {
  //         return null;
  //     }
  //     return versionSplit[0] * 10000 +
  //         (typeof versionSplit[1] !== 'undefined' ? versionSplit[1] * 100 : 0) +
  //         (typeof versionSplit[2] !== 'undefined' ? versionSplit[2] * 1 : 0);
  // }

  _displayWarnings (props: CarouselProps<TData> = this.props) {
      const pluginName = 'react-native-snap-carousel';
      const removedProps = [
          'activeAnimationType',
          'activeAnimationOptions',
          'enableMomentum',
          'lockScrollTimeoutDuration',
          'lockScrollWhileSnapping',
          'onBeforeSnapToItem',
          'swipeThreshold'
      ] as const;

      // if (this._RNVersionCode && this._RNVersionCode < 5800) {
      //     console.error(
      //         `${pluginName}: Version 4+ of the plugin is based on React Native props that were introduced in version 0.58. ` +
      //         'Please downgrade to version 3.x or update your version of React Native.'
      //     );
      // }
      if (!props.vertical && (!props.sliderWidth || !props.itemWidth)) {
          console.error(
              `${pluginName}: You need to specify both 'sliderWidth' and 'itemWidth' for horizontal carousels`
          );
      }
      if (props.vertical && (!props.sliderHeight || !props.itemHeight)) {
          console.error(
              `${pluginName}: You need to specify both 'sliderHeight' and 'itemHeight' for vertical carousels`
          );
      }

      removedProps.forEach((removedProp) => {
          if (removedProp in props) {
              console.warn(
                  `${pluginName}: Prop ${removedProp} has been removed in version 4 of the plugin`
              );
          }
      });
  }

  _needsScrollView () {
      const { useScrollView } = this.props;
      // Android's cell renderer is buggy and has a stange overflow
      // TODO: a workaround might be to pass the custom animated styles directly to it
      return IS_ANDROID ?
          useScrollView ||
          !Animated.FlatList ||
          this._shouldUseStackLayout() ||
          this._shouldUseTinderLayout() :
          useScrollView || !Animated.FlatList;
  }

  _needsRTLAdaptations () {
      const { vertical } = this.props;
      return IS_RTL && IS_ANDROID && !vertical;
  }

  _enableLoop () {
      const { data, enableSnap, loop } = this.props;
      return enableSnap && loop && data && data.length && data.length > 1;
  }

  _shouldAnimateSlides (props: CarouselProps<TData> = this.props) {
      const {
          inactiveSlideOpacity,
          inactiveSlideScale,
          scrollInterpolator,
          slideInterpolatedStyle
      } = props;
      return (
          inactiveSlideOpacity < 1 ||
      inactiveSlideScale < 1 ||
      !!scrollInterpolator ||
      !!slideInterpolatedStyle ||
      this._shouldUseShiftLayout() ||
      this._shouldUseStackLayout() ||
      this._shouldUseTinderLayout()
      );
  }

  _shouldUseShiftLayout () {
      const { inactiveSlideShift, layout } = this.props;
      return layout === 'default' && inactiveSlideShift !== 0;
  }

  _shouldUseStackLayout () {
      return this.props.layout === 'stack';
  }

  _shouldUseTinderLayout () {
      return this.props.layout === 'tinder';
  }

  _shouldRepositionScroll (index: number) {
      const { data, enableSnap, loopClonesPerSide } = this.props;
      const dataLength = data && data.length;
      if (
          !enableSnap ||
      !dataLength ||
      !this._enableLoop() ||
      (index >= loopClonesPerSide && index < dataLength + loopClonesPerSide)
      ) {
          return false;
      }
      return true;
  }

  _roundNumber (num: number, decimals = 1) {
      // https://stackoverflow.com/a/41716722/
      const rounder = Math.pow(10, decimals);
      return Math.round((num + Number.EPSILON) * rounder) / rounder;
  }

  _isMultiple (x: number, y: number) {
      // This prevents Javascript precision issues: https://stackoverflow.com/a/58440614/
      // Required because Android viewport size can return pretty complicated decimals numbers
      return Math.round(Math.round(x / y) / (1 / y)) === Math.round(x);
  }

  _getCustomData (props: CarouselProps<TData> = this.props) {
      const { data, loopClonesPerSide } = props;
      const dataLength = data && data.length;

      if (!dataLength) {
          return [];
      }

      if (!this._enableLoop()) {
          return data;
      }

      let previousItems = [];
      let nextItems = [];

      if (loopClonesPerSide > dataLength) {
          const dataMultiplier = Math.floor(loopClonesPerSide / dataLength);
          const remainder = loopClonesPerSide % dataLength;

          for (let i = 0; i < dataMultiplier; i++) {
              previousItems.push(...data);
              nextItems.push(...data);
          }

          previousItems.unshift(...data.slice(-remainder));
          nextItems.push(...data.slice(0, remainder));
      } else {
          previousItems = data.slice(-loopClonesPerSide);
          nextItems = data.slice(0, loopClonesPerSide);
      }

      return previousItems.concat(data, nextItems);
  }

  _getCustomDataLength (props: CarouselProps<TData> = this.props) {
      const { data, loopClonesPerSide } = props;
      const dataLength = data && data.length;

      if (!dataLength) {
          return 0;
      }

      return this._enableLoop() ? dataLength + 2 * loopClonesPerSide : dataLength;
  }

  _getCustomIndex (index: number, props: CarouselProps<TData> = this.props) {
      const itemsLength = this._getCustomDataLength(props);

      if (!itemsLength || typeof index === 'undefined') {
          return 0;
      }

      return this._needsRTLAdaptations() ? itemsLength - index - 1 : index;
  }

  _getDataIndex (index: number) {
      const { data, loopClonesPerSide } = this.props;
      const dataLength = data && data.length;

      if (!this._enableLoop() || !dataLength) {
          return index;
      }

      if (index >= dataLength + loopClonesPerSide) {
          return loopClonesPerSide > dataLength ?
              (index - loopClonesPerSide) % dataLength :
              index - dataLength - loopClonesPerSide;
      } else if (index < loopClonesPerSide) {
      // TODO: is there a simpler way of determining the interpolated index?
          if (loopClonesPerSide > dataLength) {
              const baseDataIndexes = [];
              const dataIndexes = [];
              const dataMultiplier = Math.floor(loopClonesPerSide / dataLength);
              const remainder = loopClonesPerSide % dataLength;

              for (let i = 0; i < dataLength; i++) {
                  baseDataIndexes.push(i);
              }

              for (let j = 0; j < dataMultiplier; j++) {
                  dataIndexes.push(...baseDataIndexes);
              }

              dataIndexes.unshift(...baseDataIndexes.slice(-remainder));
              return dataIndexes[index];
          } else {
              return index + dataLength - loopClonesPerSide;
          }
      } else {
          return index - loopClonesPerSide;
      }
  }

  // Used with `snapToItem()` and 'PaginationDot'
  _getPositionIndex (index: number) {
      const { loop, loopClonesPerSide } = this.props;
      return loop ? index + loopClonesPerSide : index;
  }

  _getSnapOffsets (props: CarouselProps<TData> = this.props) {
      const offset = this._getItemMainDimension();
      return [...Array(this._getCustomDataLength(props))].map((_, i) => {
          return i * offset;
      });
  }

  _getFirstItem (index: number, props: CarouselProps<TData> = this.props) {
      const { loopClonesPerSide } = props;
      const itemsLength = this._getCustomDataLength(props);

      if (!itemsLength || index > itemsLength - 1 || index < 0) {
          return 0;
      }

      return this._enableLoop() ? index + loopClonesPerSide : index;
  }

  _getWrappedRef () {
      // Starting with RN 0.62, we should no longer call `getNode()` on the ref of an Animated component
      if (
          this._carouselRef &&
      ((this._needsScrollView() &&
        (this._carouselRef as ScrollView).scrollTo) ||
        (!this._needsScrollView() &&
          (this._carouselRef as FlatList).scrollToOffset))
      ) {
          return this._carouselRef;
      }
      // https://github.com/facebook/react-native/issues/10635
      // https://stackoverflow.com/a/48786374/8412141
      return (
          this._carouselRef &&
      // @ts-expect-error This is for before 0.62
      this._carouselRef.getNode &&
      // @ts-expect-error This is for before 0.62
      this._carouselRef.getNode()
      );
  }

  _getScrollEnabled () {
      return this._scrollEnabled;
  }

  _setScrollEnabled (scrollEnabled = true) {
      const wrappedRef = this._getWrappedRef();

      if (!wrappedRef || !wrappedRef.setNativeProps) {
          return;
      }

      // 'setNativeProps()' is used instead of 'setState()' because the latter
      // really takes a toll on Android behavior when momentum is disabled
      wrappedRef.setNativeProps({ scrollEnabled });
      this._scrollEnabled = scrollEnabled;
  }

  _getItemMainDimension () {
      return this.props.vertical ? this.props.itemHeight : this.props.itemWidth;
  }

  _getItemScrollOffset (index: number) {
      return (
          this._positions && this._positions[index] && this._positions[index].start
      );
  }

  _getItemLayout (_: TData[], index: number) {
      const itemMainDimension = this._getItemMainDimension();
      return {
          index,
          length: itemMainDimension,
          offset: itemMainDimension * index // + this._getContainerInnerMargin()
      };
  }

  // This will allow us to have a proper zIndex even with a FlatList
  // https://github.com/facebook/react-native/issues/18616#issuecomment-389444165
  _getCellRendererComponent ({
      children,
      index,
      style,
      ...props
  }: PropsWithChildren<{ index: number; style: StyleProp<ViewStyle> }>) {
      const cellStyle = [
          style,
          !IS_ANDROID ? { zIndex: this._getCustomDataLength() - index } : {}
      ];

      return (
          <View style={cellStyle} key={index} {...props}>
              {children}
          </View>
      );
  }

  _getKeyExtractor (_: TData, index: number) {
      return this._needsScrollView() ?
          `scrollview-item-${index}` :
          `flatlist-item-${index}`;
  }

  _getScrollOffset (event: NativeSyntheticEvent<NativeScrollEvent>) {
      const { vertical } = this.props;
      return (
          (event &&
        event.nativeEvent &&
        event.nativeEvent.contentOffset &&
        event.nativeEvent.contentOffset[vertical ? 'y' : 'x']) ||
      0
      );
  }

  _getContainerInnerMargin (opposite = false) {
      const { activeSlideAlignment } = this.props;

      if (
          (activeSlideAlignment === 'start' && !opposite) ||
      (activeSlideAlignment === 'end' && opposite)
      ) {
          return 0;
      } else if (
          (activeSlideAlignment === 'end' && !opposite) ||
      (activeSlideAlignment === 'start' && opposite)
      ) {
          return this.props.vertical ?
              this.props.sliderHeight - this.props.itemHeight :
              this.props.sliderWidth - this.props.itemWidth;
      } else {
          return this.props.vertical ?
              (this.props.sliderHeight - this.props.itemHeight) / 2 :
              (this.props.sliderWidth - this.props.itemWidth) / 2;
      }
  }

  _getActiveSlideOffset () {
      const { activeSlideOffset } = this.props;
      const itemMainDimension = this._getItemMainDimension();
      const minOffset = 10;
      // Make sure activeSlideOffset never prevents the active area from being at least 10 px wide
      return itemMainDimension / 2 - activeSlideOffset >= minOffset ?
          activeSlideOffset :
          minOffset;
  }

  _getActiveItem (offset: number) {
      const itemMainDimension = this._getItemMainDimension();
      const center = offset + itemMainDimension / 2;
      const activeSlideOffset = this._getActiveSlideOffset();
      const lastIndex = this._positions.length - 1;
      let itemIndex;

      if (offset <= 0) {
          return 0;
      }

      if (
          this._positions[lastIndex] &&
      offset >= this._positions[lastIndex].start
      ) {
          return lastIndex;
      }

      for (let i = 0; i < this._positions.length; i++) {
          const { start, end } = this._positions[i];
          if (
              center + activeSlideOffset >= start &&
        center - activeSlideOffset <= end
          ) {
              itemIndex = i;
              break;
          }
      }

      return itemIndex || 0;
  }

  _getSlideInterpolatedStyle (index: number, animatedValue: Animated.AnimatedInterpolation) {
      const { layoutCardOffset, slideInterpolatedStyle } = this.props;

      if (slideInterpolatedStyle) {
          return slideInterpolatedStyle(index, animatedValue, this.props);
      } else if (this._shouldUseTinderLayout()) {
          return tinderAnimatedStyles(
              index,
              animatedValue,
              this.props,
              layoutCardOffset
          );
      } else if (this._shouldUseStackLayout()) {
          return stackAnimatedStyles(
              index,
              animatedValue,
              this.props,
              layoutCardOffset
          );
      } else if (this._shouldUseShiftLayout()) {
          return shiftAnimatedStyles(index, animatedValue, this.props);
      } else {
          return defaultAnimatedStyles(index, animatedValue, this.props);
      }
  }

  _initPositionsAndInterpolators (props: CarouselProps<TData> = this.props) {
      const { data, scrollInterpolator } = props;
      const itemMainDimension = this._getItemMainDimension();

      if (!data || !data.length) {
          return;
      }

      const interpolators: Animated.AnimatedInterpolation[] = [];
      this._positions = [];

      this._getCustomData(props).forEach((_itemData, index) => {
          const _index = this._getCustomIndex(index, props);
          let animatedValue: Animated.AnimatedInterpolation;

          this._positions[index] = {
              start: index * itemMainDimension,
              end: index * itemMainDimension + itemMainDimension
          };

          if (!this._shouldAnimateSlides(props) || !this._scrollPos) {
              animatedValue = new Animated.Value(1);
          } else {
              let interpolator;

              if (scrollInterpolator) {
                  interpolator = scrollInterpolator(_index, props);
              } else if (this._shouldUseStackLayout()) {
                  interpolator = stackScrollInterpolator(_index, props);
              } else if (this._shouldUseTinderLayout()) {
                  interpolator = tinderScrollInterpolator(_index, props);
              }

              if (
                  !interpolator ||
          !interpolator.inputRange ||
          !interpolator.outputRange
              ) {
                  interpolator = defaultScrollInterpolator(_index, props);
              }

              animatedValue = this._scrollPos.interpolate({
                  ...interpolator,
                  extrapolate: 'clamp'
              });
          }

          interpolators.push(animatedValue);
      });

      this.setState({ interpolators });
  }

  _hackActiveSlideAnimation (index: number, scrollValue = 1) {
      const offset = this._getItemScrollOffset(index);

      if (!this._mounted || !this._carouselRef || typeof offset === 'undefined') {
          return;
      }

      const multiplier = this._currentScrollOffset === 0 ? 1 : -1;
      const scrollDelta = scrollValue * multiplier;

      this._scrollTo({ offset: offset + scrollDelta, animated: false });

      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._hackSlideAnimationTimeout);
      this._hackSlideAnimationTimeout = setTimeout(() => {
          this._scrollTo({ offset, animated: false });
      }, 1); // works randomly when set to '0'
  }

  _repositionScroll (index: number, animated = false) {
      const { data, loopClonesPerSide } = this.props;
      const dataLength = data && data.length;

      if (typeof index === 'undefined' || !this._shouldRepositionScroll(index)) {
          return;
      }

      let repositionTo = index;

      if (index >= dataLength + loopClonesPerSide) {
          repositionTo = index - dataLength;
      } else if (index < loopClonesPerSide) {
          repositionTo = index + dataLength;
      }

      this._snapToItem(repositionTo, animated, false);
  }

  _scrollTo ({
      offset,
      index,
      animated = true
  }: {
    offset: number;
    index?: number;
    animated: boolean;
  }) {
      const { vertical } = this.props;
      const wrappedRef = this._getWrappedRef();
      if (
          !this._mounted ||
      !wrappedRef ||
      (typeof offset === 'undefined' && typeof index === 'undefined')
      ) {
          return;
      }

      let scrollToOffset;
      if (typeof index !== 'undefined') {
          scrollToOffset = this._getItemScrollOffset(index);
      } else {
          scrollToOffset = offset;
      }

      if (typeof scrollToOffset === 'undefined') {
          return;
      }

      const options = this._needsScrollView() ?
          {
              x: vertical ? 0 : offset,
              y: vertical ? offset : 0,
              animated
          } :
          {
              offset,
              animated
          };

      if (this._needsScrollView()) {
          wrappedRef.scrollTo(options);
      } else {
          wrappedRef.scrollToOffset(options);
      }
  }

  _onTouchStart (event: GestureResponderEvent) {
      const { onTouchStart } = this.props;

      // `onTouchStart` is fired even when `scrollEnabled` is set to `false`
      if (this._getScrollEnabled() !== false && this._autoplaying) {
          this.pauseAutoPlay();
      }

      onTouchStart && onTouchStart(event);
  }

  _onTouchEnd (event: GestureResponderEvent) {
      const { onTouchEnd } = this.props;

      if (
          this._getScrollEnabled() !== false &&
      this._autoplay &&
      !this._autoplaying
      ) {
      // This event is buggy on Android, so a fallback is provided in _onMomentumScrollEnd()
          this.startAutoplay();
      }

      onTouchEnd && onTouchEnd(event);
  }

  _onScroll (event: NativeSyntheticEvent<NativeScrollEvent>) {
      const { onScroll, onScrollIndexChanged } = this.props;
      const scrollOffset = event ?
          this._getScrollOffset(event) :
          this._currentScrollOffset;
      const nextActiveItem = this._getActiveItem(scrollOffset);

      this._currentScrollOffset = scrollOffset;

      if (nextActiveItem !== this._onScrollActiveItem) {
          this._onScrollActiveItem = nextActiveItem;
          onScrollIndexChanged &&
        onScrollIndexChanged(this._getDataIndex(nextActiveItem));
      }

      if (typeof onScroll === 'function' && event) {
          onScroll(event);
      }
  }

  _onMomentumScrollEnd (event: NativeSyntheticEvent<NativeScrollEvent>) {
      const { autoplayDelay, onMomentumScrollEnd, onSnapToItem } = this.props;
      const scrollOffset = event ?
          this._getScrollOffset(event) :
          this._currentScrollOffset;
      const nextActiveItem = this._getActiveItem(scrollOffset);
      const hasSnapped = this._isMultiple(
          scrollOffset,
          this.props.vertical ? this.props.itemHeight : this.props.itemWidth
      );

      // WARNING: everything in this condition will probably need to be called on _snapToItem as well because:
      // 1. `onMomentumScrollEnd` won't be called if the scroll isn't animated
      // 2. `onMomentumScrollEnd` won't be called at all on Android when scrolling programmatically
      if (nextActiveItem !== this._activeItem) {
          this._activeItem = nextActiveItem;
          onSnapToItem && onSnapToItem(this._getDataIndex(nextActiveItem));

          if (hasSnapped) {
              this._repositionScroll(nextActiveItem);
          }
      }

      onMomentumScrollEnd && onMomentumScrollEnd(event);

      // The touchEnd event is buggy on Android, so this will serve as a fallback whenever needed
      // https://github.com/facebook/react-native/issues/9439
      if (IS_ANDROID && this._autoplay && !this._autoplaying) {
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
          clearTimeout(this._enableAutoplayTimeout);
          this._enableAutoplayTimeout = setTimeout(() => {
              this.startAutoplay();
          }, autoplayDelay);
      }
  }

  _onLayout (event: LayoutChangeEvent) {
      const { onLayout } = this.props;

      // Prevent unneeded actions during the first 'onLayout' (triggered on init)
      if (this._onLayoutInitDone) {
          this._initPositionsAndInterpolators();
          this._snapToItem(this._activeItem, false, false, true);
      } else {
          this._onLayoutInitDone = true;
      }

      onLayout && onLayout(event);
  }

  _snapToItem (
      index: number,
      animated = true,
      fireCallback = true,
      forceScrollTo = false
  ) {
      const { onSnapToItem } = this.props;
      const itemsLength = this._getCustomDataLength();
      const wrappedRef = this._getWrappedRef();

      if (!itemsLength || !wrappedRef) {
          return;
      }

      if (!index || index < 0) {
          index = 0;
      } else if (itemsLength > 0 && index >= itemsLength) {
          index = itemsLength - 1;
      }

      if (index === this._activeItem && !forceScrollTo) {
          return;
      }

      const offset = this._getItemScrollOffset(index);

      if (offset === undefined) {
          return;
      }

      this._scrollTo({ offset, animated });

      // On both platforms, `onMomentumScrollEnd` won't be triggered if the scroll isn't animated
      // so we need to trigger the callback manually
      // On Android `onMomentumScrollEnd` won't be triggered when scrolling programmatically
      // Therefore everything critical needs to be manually called here as well, even though the timing might be off
      const requiresManualTrigger = !animated || IS_ANDROID;
      if (requiresManualTrigger) {
          this._activeItem = index;

          if (fireCallback) {
              onSnapToItem && onSnapToItem(this._getDataIndex(index));
          }

          // Repositioning on Android
          if (IS_ANDROID && this._shouldRepositionScroll(index)) {
              if (animated) {
                  this._androidRepositioningTimeout = setTimeout(() => {
                      // Without scroll animation, the behavior is completely buggy...
                      this._repositionScroll(index, true);
                  }, 400); // Approximate scroll duration on Android
              } else {
                  this._repositionScroll(index);
              }
          }
      }
  }

  startAutoplay () {
      const { autoplayInterval, autoplayDelay } = this.props;
      this._autoplay = true;

      if (this._autoplaying) {
          return;
      }

      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._autoplayTimeout);
      this._autoplayTimeout = setTimeout(() => {
          this._autoplaying = true;
          this._autoplayInterval = setInterval(() => {
              if (this._autoplaying) {
                  this.snapToNext();
              }
          }, autoplayInterval);
      }, autoplayDelay);
  }

  pauseAutoPlay () {
      this._autoplaying = false;
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._autoplayTimeout);
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearTimeout(this._enableAutoplayTimeout);
      // @ts-expect-error setTimeout / clearTiemout is buggy :/
      clearInterval(this._autoplayInterval);
  }

  stopAutoplay () {
      this._autoplay = false;
      this.pauseAutoPlay();
  }

  snapToItem (index: number, animated = true, fireCallback = true) {
      if (!index || index < 0) {
          index = 0;
      }

      const positionIndex = this._getPositionIndex(index);

      if (positionIndex === this._activeItem) {
          return;
      }

      this._snapToItem(positionIndex, animated, fireCallback);
  }

  snapToNext (animated = true, fireCallback = true) {
      const itemsLength = this._getCustomDataLength();

      let newIndex = this._activeItem + 1;
      if (newIndex > itemsLength - 1) {
          newIndex = 0;
      }
      this._snapToItem(newIndex, animated, fireCallback);
  }

  snapToPrev (animated = true, fireCallback = true) {
      const itemsLength = this._getCustomDataLength();

      let newIndex = this._activeItem - 1;
      if (newIndex < 0) {
          newIndex = itemsLength - 1;
      }
      this._snapToItem(newIndex, animated, fireCallback);
  }

  // https://github.com/facebook/react-native/issues/1831#issuecomment-231069668
  triggerRenderingHack (offset = 1) {
      this._hackActiveSlideAnimation(this._activeItem, offset);
  }

  _renderItem ({ item, index }: { item: TData; index: number }) {
      const { interpolators } = this.state;
      const {
          keyExtractor,
          slideStyle
      } = this.props;
      const animatedValue = interpolators && interpolators[index];

      if (typeof animatedValue === 'undefined') {
          return null;
      }

      const animate = this._shouldAnimateSlides();
      const Component = animate ? Animated.View : View;
      const animatedStyle = animate ?
          this._getSlideInterpolatedStyle(index, animatedValue) :
          {};
      const dataIndex = this._getDataIndex(index);

      const mainDimension = this.props.vertical ?
          { height: this.props.itemHeight } :
          { width: this.props.itemWidth };
      const specificProps = this._needsScrollView() ?
          {
              key: keyExtractor ?
                  keyExtractor(item, index) :
                  this._getKeyExtractor(item, index)
          } :
          {};

      return (
          <Component
            style={[mainDimension, slideStyle, animatedStyle]}
            pointerEvents='box-none'
            {...specificProps}
          >
              {this.props.vertical ? this.props.renderItem({ item, index, dataIndex }, {
                  scrollPosition: this._scrollPos,
                  carouselRef: this._carouselRef,
                  vertical: this.props.vertical,
                  sliderHeight: this.props.sliderHeight,
                  itemHeight: this.props.itemHeight
              }) : this.props.renderItem({ item, index, dataIndex }, {
                  scrollPosition: this._scrollPos,
                  carouselRef: this._carouselRef,
                  vertical: !!this.props.vertical,
                  sliderWidth: this.props.sliderWidth,
                  itemWidth: this.props.itemWidth
              })}
          </Component>
      );
  }

  _getComponentOverridableProps () {
      const { hideCarousel } = this.state;
      const { loopClonesPerSide } = this.props;
      const visibleItems =
      Math.ceil(
          this.props.vertical ?
              this.props.sliderHeight / this.props.itemHeight :
              this.props.sliderWidth / this.props.itemWidth
      ) + 1;
      const initialNumPerSide = this._enableLoop() ? loopClonesPerSide : 2;
      const initialNumToRender = visibleItems + initialNumPerSide * 2;
      const maxToRenderPerBatch = initialNumToRender + initialNumPerSide * 2;
      const windowSize = maxToRenderPerBatch;

      const specificProps = !this._needsScrollView() ?
          {
              initialNumToRender,
              maxToRenderPerBatch,
              windowSize
          // updateCellsBatchingPeriod
          } :
          {};

      return {
          ...specificProps,
          automaticallyAdjustContentInsets: false,
          decelerationRate: 'fast' as const,
          directionalLockEnabled: true,
          disableScrollViewPanResponder: false, // If set to `true`, touch events will be triggered too easily
          inverted: this._needsRTLAdaptations(),
          overScrollMode: 'never' as const,
          pinchGestureEnabled: false,
          pointerEvents: hideCarousel ? 'none' as const : 'auto' as const,
          // removeClippedSubviews: !this._needsScrollView(),
          // renderToHardwareTextureAndroid: true,
          scrollsToTop: false,
          showsHorizontalScrollIndicator: false,
          showsVerticalScrollIndicator: false
      };
  }

  _getComponentStaticProps () {
      const { hideCarousel } = this.state;
      const {
          activeSlideAlignment,
          CellRendererComponent,
          containerCustomStyle,
          contentContainerCustomStyle,
          firstItem,
          getItemLayout,
          keyExtractor,
          style,
          useExperimentalSnap
      } = this.props;

      const containerStyle = [
      // { overflow: 'hidden' },
          containerCustomStyle || style || {},
          hideCarousel ? { opacity: 0 } : {},
          this.props.vertical ?
              { height: this.props.sliderHeight, flexDirection: 'column' as const } : // LTR hack; see https://github.com/facebook/react-native/issues/11960
          // and https://github.com/facebook/react-native/issues/13100#issuecomment-328986423
              {
                  width: this.props.sliderWidth,
                  flexDirection: this._needsRTLAdaptations() ? 'row-reverse' as const : 'row' as const
              }
      ];

      const innerMarginStyle = this.props.vertical ?
          {
              paddingTop: this._getContainerInnerMargin(),
              paddingBottom: this._getContainerInnerMargin(true)
          } :
          {
              paddingLeft: this._getContainerInnerMargin(),
              paddingRight: this._getContainerInnerMargin(true)
          };

      const contentContainerStyle = [
          !useExperimentalSnap ? innerMarginStyle : {},
          contentContainerCustomStyle || {}
      ];

      // WARNING: `snapToAlignment` won't work as intended because of the following:
      // https://github.com/facebook/react-native/blob/d0871d0a9a373e1d3ac35da46c85c0d0e793116d/React/Views/ScrollView/RCTScrollView.m#L751-L755
      // - Snap points will be off
      // - Slide animations will be off
      // - Last items won't be set as active (no `onSnapToItem` callback)
      // Recommended only with large slides and `activeSlideAlignment` set to `start` for the time being
      const snapProps = useExperimentalSnap ?
          {
          // disableIntervalMomentum: true, // Slide ± one item at a time
              snapToAlignment: activeSlideAlignment,
              snapToInterval: this._getItemMainDimension()
          } :
          {
              snapToOffsets: this._getSnapOffsets()
          };

      // Flatlist specifics
      const specificProps = !this._needsScrollView() ?
          {
              CellRendererComponent:
            CellRendererComponent || this._getCellRendererComponent,
              getItemLayout: getItemLayout || this._getItemLayout,
              initialScrollIndex: this._getFirstItem(firstItem),
              keyExtractor: keyExtractor || this._getKeyExtractor,
              numColumns: 1,
              renderItem: this._renderItem
          } :
          {};

      return {
          ...specificProps,
          ...snapProps,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref: (c: any) => {
              this._carouselRef = c as FlatList<TData> | ScrollView;
          },
          contentContainerStyle: contentContainerStyle,
          data: this._getCustomData(),
          horizontal: !this.props.vertical,
          scrollEventThrottle: 1,
          style: containerStyle,
          onLayout: this._onLayout,
          onMomentumScrollEnd: this._onMomentumScrollEnd,
          onScroll: this._onScrollHandler,
          onTouchStart: this._onTouchStart,
          onTouchEnd: this._onTouchEnd
      };
  }

  render () {
      const { data, renderItem, useScrollView } = this.props;

      if (!data || !renderItem) {
          return null;
      }

      const props = {
          ...this._getComponentOverridableProps(),
          ...this.props,
          ...this._getComponentStaticProps()
      };

      const ScrollViewComponent =
      typeof useScrollView === 'function' ? useScrollView : Animated.ScrollView;

      return this._needsScrollView() || !Animated.FlatList ? (
          <ScrollViewComponent {...props}>
              {this._getCustomData().map((item, index) => {
                  return this._renderItem({ item, index });
              })}
          </ScrollViewComponent>
      ) : (
          // @ts-expect-error Seems complicated to make TS 100% happy, while sharing that many things between
          // flatlist && scrollview implementation. I'll prob try to rewrite parts of the logic to overcome that.
          <Animated.FlatList {...props} />
      );
  }
}

export default Carousel;
