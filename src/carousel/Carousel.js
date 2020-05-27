import React, { Component } from 'react';
import { Animated, Easing, FlatList, I18nManager, Platform, ScrollView, View, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
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

const IS_IOS = Platform.OS === 'ios';

// Native driver for scroll events
// See: https://facebook.github.io/react-native/blog/2017/02/14/using-native-driver-for-animated.html
const AnimatedFlatList = FlatList ? Animated.createAnimatedComponent(FlatList) : null;
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// React Native automatically handles RTL layouts; unfortunately, it's buggy with horizontal ScrollView
// See https://github.com/facebook/react-native/issues/11960
// NOTE: the following variable is not declared in the constructor
// otherwise it is undefined at init, which messes with custom indexes
const IS_RTL = I18nManager.isRTL;

export default class Carousel extends Component {

    static propTypes = {
        data: PropTypes.array.isRequired,
        renderItem: PropTypes.func.isRequired,
        itemWidth: PropTypes.number, // required for horizontal carousel
        itemHeight: PropTypes.number, // required for vertical carousel
        sliderWidth: PropTypes.number, // required for horizontal carousel
        sliderHeight: PropTypes.number, // required for vertical carousel
        activeAnimationType: PropTypes.string,
        activeAnimationOptions: PropTypes.object,
        activeSlideAlignment: PropTypes.oneOf(['center', 'end', 'start']),
        activeSlideOffset: PropTypes.number,
        apparitionDelay: PropTypes.number,
        autoplay: PropTypes.bool,
        autoplayDelay: PropTypes.number,
        autoplayInterval: PropTypes.number,
        callbackOffsetMargin: PropTypes.number,
        containerCustomStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        contentContainerCustomStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        enableMomentum: PropTypes.bool,
        enableSnap: PropTypes.bool,
        firstItem: PropTypes.number,
        hasParallaxImages: PropTypes.bool,
        inactiveSlideOpacity: PropTypes.number,
        inactiveSlideScale: PropTypes.number,
        inactiveSlideShift: PropTypes.number,
        layout: PropTypes.oneOf(['default', 'stack', 'tinder']),
        layoutCardOffset: PropTypes.number,
        lockScrollTimeoutDuration: PropTypes.number,
        lockScrollWhileSnapping: PropTypes.bool,
        loop: PropTypes.bool,
        loopClonesPerSide: PropTypes.number,
        scrollEnabled: PropTypes.bool,
        scrollInterpolator: PropTypes.func,
        slideInterpolatedStyle: PropTypes.func,
        slideStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        shouldOptimizeUpdates: PropTypes.bool,
        swipeThreshold: PropTypes.number,
        useScrollView: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
        vertical: PropTypes.bool,
        onBeforeSnapToItem: PropTypes.func,
        onSnapToItem: PropTypes.func
    };

    static defaultProps = {
        activeAnimationType: 'timing',
        activeAnimationOptions: null,
        activeSlideAlignment: 'center',
        activeSlideOffset: 20,
        apparitionDelay: 0,
        autoplay: false,
        autoplayDelay: 1000,
        autoplayInterval: 3000,
        callbackOffsetMargin: 5,
        containerCustomStyle: {},
        contentContainerCustomStyle: {},
        enableMomentum: false,
        enableSnap: true,
        firstItem: 0,
        hasParallaxImages: false,
        inactiveSlideOpacity: 0.7,
        inactiveSlideScale: 0.9,
        inactiveSlideShift: 0,
        layout: 'default',
        lockScrollTimeoutDuration: 1000,
        lockScrollWhileSnapping: false,
        loop: false,
        loopClonesPerSide: 3,
        scrollEnabled: true,
        slideStyle: {},
        shouldOptimizeUpdates: true,
        swipeThreshold: 20,
        useScrollView: !AnimatedFlatList,
        vertical: false
    }

    constructor (props) {
        super(props);

        this.state = {
            hideCarousel: true,
            interpolators: []
        };

        // The following values are not stored in the state because 'setState()' is asynchronous
        // and this results in an absolutely crappy behavior on Android while swiping (see #156)
        const initialActiveItem = this._getFirstItem(props.firstItem);
        this._activeItem = initialActiveItem;
        this._previousActiveItem = initialActiveItem;
        this._previousFirstItem = initialActiveItem;
        this._previousItemsLength = initialActiveItem;

        this._mounted = false;
        this._positions = [];
        this._currentContentOffset = 0; // store ScrollView's scroll position
        this._canFireBeforeCallback = false;
        this._canFireCallback = false;
        this._scrollOffsetRef = null;
        this._onScrollTriggered = true; // used when momentum is enabled to prevent an issue with edges items
        this._lastScrollDate = 0; // used to work around a FlatList bug
        this._scrollEnabled = props.scrollEnabled !== false;

        this._initPositionsAndInterpolators = this._initPositionsAndInterpolators.bind(this);
        this._renderItem = this._renderItem.bind(this);
        this._onSnap = this._onSnap.bind(this);

        this._onLayout = this._onLayout.bind(this);
        this._onScroll = this._onScroll.bind(this);
        this._onScrollBeginDrag = props.enableSnap ? this._onScrollBeginDrag.bind(this) : undefined;
        this._onScrollEnd = props.enableSnap || props.autoplay ? this._onScrollEnd.bind(this) : undefined;
        this._onScrollEndDrag = !props.enableMomentum ? this._onScrollEndDrag.bind(this) : undefined;
        this._onMomentumScrollEnd = props.enableMomentum ? this._onMomentumScrollEnd.bind(this) : undefined;
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onTouchRelease = this._onTouchRelease.bind(this);

        this._getKeyExtractor = this._getKeyExtractor.bind(this);

        this._setScrollHandler(props);

        // This bool aims at fixing an iOS bug due to scrollTo that triggers onMomentumScrollEnd.
        // onMomentumScrollEnd fires this._snapScroll, thus creating an infinite loop.
        this._ignoreNextMomentum = false;

        // Warnings
        if (!ViewPropTypes) {
            console.warn('react-native-snap-carousel: It is recommended to use at least version 0.44 of React Native with the plugin');
        }
        if (!props.vertical && (!props.sliderWidth || !props.itemWidth)) {
            console.error('react-native-snap-carousel: You need to specify both `sliderWidth` and `itemWidth` for horizontal carousels');
        }
        if (props.vertical && (!props.sliderHeight || !props.itemHeight)) {
            console.error('react-native-snap-carousel: You need to specify both `sliderHeight` and `itemHeight` for vertical carousels');
        }
        if (props.apparitionDelay && !IS_IOS && !props.useScrollView) {
            console.warn('react-native-snap-carousel: Using `apparitionDelay` on Android is not recommended since it can lead to rendering issues');
        }
        if (props.customAnimationType || props.customAnimationOptions) {
            console.warn('react-native-snap-carousel: Props `customAnimationType` and `customAnimationOptions` have been renamed to `activeAnimationType` and `activeAnimationOptions`');
        }
        if (props.onScrollViewScroll) {
            console.error('react-native-snap-carousel: Prop `onScrollViewScroll` has been removed. Use `onScroll` instead');
        }
    }

    componentDidMount () {
        const { apparitionDelay, autoplay, firstItem } = this.props;
        const _firstItem = this._getFirstItem(firstItem);
        const apparitionCallback = () => {
            this.setState({ hideCarousel: false });
            if (autoplay) {
                this.startAutoplay();
            }
        };

        this._mounted = true;
        this._initPositionsAndInterpolators();

        // Without 'requestAnimationFrame' or a `0` timeout, images will randomly not be rendered on Android...
        requestAnimationFrame(() => {
            if (!this._mounted) {
                return;
            }

            this._snapToItem(_firstItem, false, false, true, false);
            this._hackActiveSlideAnimation(_firstItem, 'start', true);

            if (apparitionDelay) {
                this._apparitionTimeout = setTimeout(() => {
                    apparitionCallback();
                }, apparitionDelay);
            } else {
                apparitionCallback();
            }
        });
    }

    shouldComponentUpdate (nextProps, nextState) {
        if (this.props.shouldOptimizeUpdates === false) {
            return true;
        } else {
            return shallowCompare(this, nextProps, nextState);
        }
    }

    componentDidUpdate (prevProps) {
        const { interpolators } = this.state;
        const { firstItem, itemHeight, itemWidth, scrollEnabled, sliderHeight, sliderWidth } = this.props;
        const itemsLength = this._getCustomDataLength(this.props);

        if (!itemsLength) {
            return;
        }

        const nextFirstItem = this._getFirstItem(firstItem, this.props);
        let nextActiveItem = this._activeItem || this._activeItem === 0 ? this._activeItem : nextFirstItem;

        const hasNewSliderWidth = sliderWidth && sliderWidth !== prevProps.sliderWidth;
        const hasNewSliderHeight = sliderHeight && sliderHeight !== prevProps.sliderHeight;
        const hasNewItemWidth = itemWidth && itemWidth !== prevProps.itemWidth;
        const hasNewItemHeight = itemHeight && itemHeight !== prevProps.itemHeight;
        const hasNewScrollEnabled = scrollEnabled !== prevProps.scrollEnabled;

        // Prevent issues with dynamically removed items
        if (nextActiveItem > itemsLength - 1) {
            nextActiveItem = itemsLength - 1;
        }

        // Handle changing scrollEnabled independent of user -> carousel interaction
        if (hasNewScrollEnabled) {
            this._setScrollEnabled(scrollEnabled);
        }

        if (interpolators.length !== itemsLength || hasNewSliderWidth ||
            hasNewSliderHeight || hasNewItemWidth || hasNewItemHeight) {
            this._activeItem = nextActiveItem;
            this._previousItemsLength = itemsLength;

            this._initPositionsAndInterpolators(this.props);

            // Handle scroll issue when dynamically removing items (see #133)
            // This also fixes first item's active state on Android
            // Because 'initialScrollIndex' apparently doesn't trigger scroll
            if (this._previousItemsLength > itemsLength) {
                this._hackActiveSlideAnimation(nextActiveItem, null, true);
            }

            if (hasNewSliderWidth || hasNewSliderHeight || hasNewItemWidth || hasNewItemHeight) {
                this._snapToItem(nextActiveItem, false, false, false, false);
            }
        } else if (nextFirstItem !== this._previousFirstItem && nextFirstItem !== this._activeItem) {
            this._activeItem = nextFirstItem;
            this._previousFirstItem = nextFirstItem;
            this._snapToItem(nextFirstItem, false, true, false, false);
        }

        if (this.props.onScroll !== prevProps.onScroll) {
          this._setScrollHandler(this.props);
        }
    }

    componentWillUnmount () {
        this._mounted = false;
        this.stopAutoplay();
        clearTimeout(this._apparitionTimeout);
        clearTimeout(this._hackSlideAnimationTimeout);
        clearTimeout(this._enableAutoplayTimeout);
        clearTimeout(this._autoplayTimeout);
        clearTimeout(this._snapNoMomentumTimeout);
        clearTimeout(this._edgeItemTimeout);
        clearTimeout(this._lockScrollTimeout);
    }

    get realIndex () {
        return this._activeItem;
    }

    get currentIndex () {
        return this._getDataIndex(this._activeItem);
    }

    get currentScrollPosition () {
        return this._currentContentOffset;
    }

    _setScrollHandler(props) {
      // Native driver for scroll events
      const scrollEventConfig = {
        listener: this._onScroll,
        useNativeDriver: true,
      };
      this._scrollPos = new Animated.Value(0);
      const argMapping = props.vertical
        ? [{ nativeEvent: { contentOffset: { y: this._scrollPos } } }]
        : [{ nativeEvent: { contentOffset: { x: this._scrollPos } } }];

      if (props.onScroll && Array.isArray(props.onScroll._argMapping)) {
        // Because of a react-native issue https://github.com/facebook/react-native/issues/13294
        argMapping.pop();
        const [ argMap ] = props.onScroll._argMapping;
        if (argMap && argMap.nativeEvent && argMap.nativeEvent.contentOffset) {
          // Shares the same animated value passed in props
          this._scrollPos =
            argMap.nativeEvent.contentOffset.x ||
            argMap.nativeEvent.contentOffset.y ||
            this._scrollPos;
        }
        argMapping.push(...props.onScroll._argMapping);
      }
      this._onScrollHandler = Animated.event(
        argMapping,
        scrollEventConfig
      );
    }

    _needsScrollView () {
        const { useScrollView } = this.props;
        return useScrollView || !AnimatedFlatList || this._shouldUseStackLayout() || this._shouldUseTinderLayout();
    }

    _needsRTLAdaptations () {
        const { vertical } = this.props;
        return IS_RTL && !IS_IOS && !vertical;
    }

    _canLockScroll () {
        const { scrollEnabled, enableMomentum, lockScrollWhileSnapping } = this.props;
        return scrollEnabled && !enableMomentum && lockScrollWhileSnapping;
    }

    _enableLoop () {
        const { data, enableSnap, loop } = this.props;
        return enableSnap && loop && data && data.length && data.length > 1;
    }

    _shouldAnimateSlides (props = this.props) {
        const { inactiveSlideOpacity, inactiveSlideScale, scrollInterpolator, slideInterpolatedStyle } = props;
        return inactiveSlideOpacity < 1 ||
            inactiveSlideScale < 1 ||
            !!scrollInterpolator ||
            !!slideInterpolatedStyle ||
            this._shouldUseShiftLayout() ||
            this._shouldUseStackLayout() ||
            this._shouldUseTinderLayout();
    }

    _shouldUseCustomAnimation () {
        const { activeAnimationOptions } = this.props;
        return !!activeAnimationOptions && !this._shouldUseStackLayout() && !this._shouldUseTinderLayout();
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

    _getCustomData (props = this.props) {
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

    _getCustomDataLength (props = this.props) {
        const { data, loopClonesPerSide } = props;
        const dataLength = data && data.length;

        if (!dataLength) {
            return 0;
        }

        return this._enableLoop() ? dataLength + (2 * loopClonesPerSide) : dataLength;
    }

    _getCustomIndex (index, props = this.props) {
        const itemsLength = this._getCustomDataLength(props);

        if (!itemsLength || (!index && index !== 0)) {
            return 0;
        }

        return this._needsRTLAdaptations() ? itemsLength - index - 1 : index;
    }

    _getDataIndex (index) {
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
    _getPositionIndex (index) {
        const { loop, loopClonesPerSide } = this.props;
        return loop ? index + loopClonesPerSide : index;
    }

    _getFirstItem (index, props = this.props) {
        const { loopClonesPerSide } = props;
        const itemsLength = this._getCustomDataLength(props);

        if (!itemsLength || index > itemsLength - 1 || index < 0) {
            return 0;
        }

        return this._enableLoop() ? index + loopClonesPerSide : index;
    }

    _getWrappedRef () {
        if (this._carouselRef && (
            (this._needsScrollView() && this._carouselRef.scrollTo) ||
            (!this._needsScrollView() && this._carouselRef.scrollToOffset)
        )) {
            return this._carouselRef;
        }
        // https://github.com/facebook/react-native/issues/10635
        // https://stackoverflow.com/a/48786374/8412141
        return this._carouselRef && this._carouselRef.getNode && this._carouselRef.getNode();
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

    _getKeyExtractor (item, index) {
        return this._needsScrollView() ? `scrollview-item-${index}` : `flatlist-item-${index}`;
    }

    _getScrollOffset (event) {
        const { vertical } = this.props;
        return (event && event.nativeEvent && event.nativeEvent.contentOffset &&
            event.nativeEvent.contentOffset[vertical ? 'y' : 'x']) || 0;
    }

    _getContainerInnerMargin (opposite = false) {
        const { sliderWidth, sliderHeight, itemWidth, itemHeight, vertical, activeSlideAlignment } = this.props;

        if ((activeSlideAlignment === 'start' && !opposite) ||
            (activeSlideAlignment === 'end' && opposite)) {
            return 0;
        } else if ((activeSlideAlignment === 'end' && !opposite) ||
            (activeSlideAlignment === 'start' && opposite)) {
            return vertical ? sliderHeight - itemHeight : sliderWidth - itemWidth;
        } else {
            return vertical ? (sliderHeight - itemHeight) / 2 : (sliderWidth - itemWidth) / 2;
        }
    }

    _getViewportOffset () {
        const { sliderWidth, sliderHeight, itemWidth, itemHeight, vertical, activeSlideAlignment } = this.props;

        if (activeSlideAlignment === 'start') {
            return vertical ? itemHeight / 2 : itemWidth / 2;
        } else if (activeSlideAlignment === 'end') {
            return vertical ?
                sliderHeight - (itemHeight / 2) :
                sliderWidth - (itemWidth / 2);
        } else {
            return vertical ? sliderHeight / 2 : sliderWidth / 2;
        }
    }

    _getCenter (offset) {
        return offset + this._getViewportOffset() - this._getContainerInnerMargin();
    }

    _getActiveItem (offset) {
        const { activeSlideOffset, swipeThreshold } = this.props;
        const center = this._getCenter(offset);
        const centerOffset = activeSlideOffset || swipeThreshold;

        for (let i = 0; i < this._positions.length; i++) {
            const { start, end } = this._positions[i];
            if (center + centerOffset >= start && center - centerOffset <= end) {
                return i;
            }
        }

        const lastIndex = this._positions.length - 1;
        if (this._positions[lastIndex] && center - centerOffset > this._positions[lastIndex].end) {
            return lastIndex;
        }

        return 0;
    }

    _initPositionsAndInterpolators (props = this.props) {
        const { data, itemWidth, itemHeight, scrollInterpolator, vertical } = props;
        const sizeRef = vertical ? itemHeight : itemWidth;

        if (!data || !data.length) {
            return;
        }

        let interpolators = [];
        this._positions = [];

        this._getCustomData(props).forEach((itemData, index) => {
            const _index = this._getCustomIndex(index, props);
            let animatedValue;

            this._positions[index] = {
                start: index * sizeRef,
                end: index * sizeRef + sizeRef
            };

            if (!this._shouldAnimateSlides(props)) {
                animatedValue = new Animated.Value(1);
            } else if (this._shouldUseCustomAnimation()) {
                animatedValue = new Animated.Value(_index === this._activeItem ? 1 : 0);
            } else {
                let interpolator;

                if (scrollInterpolator) {
                    interpolator = scrollInterpolator(_index, props);
                } else if (this._shouldUseStackLayout()) {
                    interpolator = stackScrollInterpolator(_index, props);
                } else if (this._shouldUseTinderLayout()) {
                    interpolator = tinderScrollInterpolator(_index, props);
                }

                if (!interpolator || !interpolator.inputRange || !interpolator.outputRange) {
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

    _getSlideAnimation (index, toValue) {
        const { interpolators } = this.state;
        const { activeAnimationType, activeAnimationOptions } = this.props;

        const animatedValue = interpolators && interpolators[index];

        if (!animatedValue && animatedValue !== 0) {
            return null;
        }

        const animationCommonOptions = {
            isInteraction: false,
            useNativeDriver: true,
            ...activeAnimationOptions,
            toValue: toValue
        };

        return Animated.parallel([
            Animated['timing'](
                animatedValue,
                { ...animationCommonOptions, easing: Easing.linear }
            ),
            Animated[activeAnimationType](
                animatedValue,
                { ...animationCommonOptions }
            )
        ]);
    }

    _playCustomSlideAnimation (current, next) {
        const { interpolators } = this.state;
        const itemsLength = this._getCustomDataLength();
        const _currentIndex = this._getCustomIndex(current);
        const _currentDataIndex = this._getDataIndex(_currentIndex);
        const _nextIndex = this._getCustomIndex(next);
        const _nextDataIndex = this._getDataIndex(_nextIndex);
        let animations = [];

        // Keep animations in sync when looping
        if (this._enableLoop()) {
            for (let i = 0; i < itemsLength; i++) {
                if (this._getDataIndex(i) === _currentDataIndex && interpolators[i]) {
                    animations.push(this._getSlideAnimation(i, 0));
                } else if (this._getDataIndex(i) === _nextDataIndex && interpolators[i]) {
                    animations.push(this._getSlideAnimation(i, 1));
                }
            }
        } else {
            if (interpolators[current]) {
                animations.push(this._getSlideAnimation(current, 0));
            }
            if (interpolators[next]) {
                animations.push(this._getSlideAnimation(next, 1));
            }
        }

        Animated.parallel(animations, { stopTogether: false }).start();
    }

    _hackActiveSlideAnimation (index, goTo, force = false) {
        const { data } = this.props;

        if (!this._mounted || !this._carouselRef || !this._positions[index] || (!force && this._enableLoop())) {
            return;
        }

        const offset = this._positions[index] && this._positions[index].start;

        if (!offset && offset !== 0) {
            return;
        }

        const itemsLength = data && data.length;
        const direction = goTo || itemsLength === 1 ? 'start' : 'end';

        this._scrollTo(offset + (direction === 'start' ? -1 : 1), false);

        clearTimeout(this._hackSlideAnimationTimeout);
        this._hackSlideAnimationTimeout = setTimeout(() => {
            this._scrollTo(offset, false);
        }, 50); // works randomly when set to '0'
    }

    _lockScroll () {
        const { lockScrollTimeoutDuration } = this.props;
        clearTimeout(this._lockScrollTimeout);
        this._lockScrollTimeout = setTimeout(() => {
            this._releaseScroll();
        }, lockScrollTimeoutDuration);
        this._setScrollEnabled(false);
    }

    _releaseScroll () {
        clearTimeout(this._lockScrollTimeout);
        this._setScrollEnabled(true);
    }

    _repositionScroll (index) {
        const { data, loopClonesPerSide } = this.props;
        const dataLength = data && data.length;

        if (!this._enableLoop() || !dataLength ||
            (index >= loopClonesPerSide && index < dataLength + loopClonesPerSide)) {
            return;
        }

        let repositionTo = index;

        if (index >= dataLength + loopClonesPerSide) {
            repositionTo = index - dataLength;
        } else if (index < loopClonesPerSide) {
            repositionTo = index + dataLength;
        }

        this._snapToItem(repositionTo, false, false, false, false);
    }

    _scrollTo (offset, animated = true) {
        const { vertical } = this.props;
        const wrappedRef = this._getWrappedRef();

        if (!this._mounted || !wrappedRef) {
            return;
        }

        const specificOptions = this._needsScrollView() ? {
            x: vertical ? 0 : offset,
            y: vertical ? offset : 0
        } : {
            offset
        };
        const options = {
            ...specificOptions,
            animated
        };

        if (this._needsScrollView()) {
            wrappedRef.scrollTo(options);
        } else {
            wrappedRef.scrollToOffset(options);
        }
    }

    _onScroll (event) {
        const { callbackOffsetMargin, enableMomentum, onScroll } = this.props;

        const scrollOffset = event ? this._getScrollOffset(event) : this._currentContentOffset;
        const nextActiveItem = this._getActiveItem(scrollOffset);
        const itemReached = nextActiveItem === this._itemToSnapTo;
        const scrollConditions =
            scrollOffset >= this._scrollOffsetRef - callbackOffsetMargin &&
            scrollOffset <= this._scrollOffsetRef + callbackOffsetMargin;

        this._currentContentOffset = scrollOffset;
        this._onScrollTriggered = true;
        this._lastScrollDate = Date.now();

        if (this._activeItem !== nextActiveItem && this._shouldUseCustomAnimation()) {
            this._playCustomSlideAnimation(this._activeItem, nextActiveItem);
        }

        if (enableMomentum) {
            clearTimeout(this._snapNoMomentumTimeout);

            if (this._activeItem !== nextActiveItem) {
                this._activeItem = nextActiveItem;
            }

            if (itemReached) {
                if (this._canFireBeforeCallback) {
                    this._onBeforeSnap(this._getDataIndex(nextActiveItem));
                }

                if (scrollConditions && this._canFireCallback) {
                    this._onSnap(this._getDataIndex(nextActiveItem));
                }
            }
        } else if (this._activeItem !== nextActiveItem && itemReached) {
            if (this._canFireBeforeCallback) {
                this._onBeforeSnap(this._getDataIndex(nextActiveItem));
            }

            if (scrollConditions) {
                this._activeItem = nextActiveItem;

                if (this._canLockScroll()) {
                    this._releaseScroll();
                }

                if (this._canFireCallback) {
                    this._onSnap(this._getDataIndex(nextActiveItem));
                }
            }
        }

        if (nextActiveItem === this._itemToSnapTo &&
            scrollOffset === this._scrollOffsetRef) {
            this._repositionScroll(nextActiveItem);
        }

        if (typeof onScroll === "function" && event) {
            onScroll(event);
        }
    }

    _onStartShouldSetResponderCapture (event) {
        const { onStartShouldSetResponderCapture } = this.props;

        if (onStartShouldSetResponderCapture) {
            onStartShouldSetResponderCapture(event);
        }

        return this._getScrollEnabled();
    }

    _onTouchStart () {
        const { onTouchStart } = this.props

        // `onTouchStart` is fired even when `scrollEnabled` is set to `false`
        if (this._getScrollEnabled() !== false && this._autoplaying) {
            this.pauseAutoPlay();
        }

        if (onTouchStart) {
            onTouchStart()
        }
    }

    _onTouchEnd () {
        const { onTouchEnd } = this.props

        if (this._getScrollEnabled() !== false && this._autoplay && !this._autoplaying) {
            // This event is buggy on Android, so a fallback is provided in _onScrollEnd()
            this.startAutoplay();
        }

        if (onTouchEnd) {
            onTouchEnd()
        }
    }

    // Used when `enableSnap` is ENABLED
    _onScrollBeginDrag (event) {
        const { onScrollBeginDrag } = this.props;

        if (!this._getScrollEnabled()) {
            return;
        }

        this._scrollStartOffset = this._getScrollOffset(event);
        this._scrollStartActive = this._getActiveItem(this._scrollStartOffset);
        this._ignoreNextMomentum = false;
        // this._canFireCallback = false;

        if (onScrollBeginDrag) {
            onScrollBeginDrag(event);
        }
    }

    // Used when `enableMomentum` is DISABLED
    _onScrollEndDrag (event) {
        const { onScrollEndDrag } = this.props;

        if (this._carouselRef) {
            this._onScrollEnd && this._onScrollEnd();
        }

        if (onScrollEndDrag) {
            onScrollEndDrag(event);
        }
    }

    // Used when `enableMomentum` is ENABLED
    _onMomentumScrollEnd (event) {
        const { onMomentumScrollEnd } = this.props;

        if (this._carouselRef) {
            this._onScrollEnd && this._onScrollEnd();
        }

        if (onMomentumScrollEnd) {
            onMomentumScrollEnd(event);
        }
    }

    _onScrollEnd (event) {
        const { autoplayDelay, enableSnap } = this.props;

        if (this._ignoreNextMomentum) {
            // iOS fix
            this._ignoreNextMomentum = false;
            return;
        }

        if (this._currentContentOffset === this._scrollEndOffset) {
            return;
        }

        this._scrollEndOffset = this._currentContentOffset;
        this._scrollEndActive = this._getActiveItem(this._scrollEndOffset);

        if (enableSnap) {
            this._snapScroll(this._scrollEndOffset - this._scrollStartOffset);
        }

        // The touchEnd event is buggy on Android, so this will serve as a fallback whenever needed
        // https://github.com/facebook/react-native/issues/9439
        if (this._autoplay && !this._autoplaying) {
            clearTimeout(this._enableAutoplayTimeout);
            this._enableAutoplayTimeout = setTimeout(() => {
                this.startAutoplay();
            }, autoplayDelay + 50);
        }
    }

    // Due to a bug, this event is only fired on iOS
    // https://github.com/facebook/react-native/issues/6791
    // it's fine since we're only fixing an iOS bug in it, so ...
    _onTouchRelease (event) {
        const { enableMomentum } = this.props;

        if (enableMomentum && IS_IOS) {
            clearTimeout(this._snapNoMomentumTimeout);
            this._snapNoMomentumTimeout = setTimeout(() => {
                this._snapToItem(this._activeItem);
            }, 100);
        }
    }

    _onLayout (event) {
        const { onLayout } = this.props;

        // Prevent unneeded actions during the first 'onLayout' (triggered on init)
        if (this._onLayoutInitDone) {
            this._initPositionsAndInterpolators();
            this._snapToItem(this._activeItem, false, false, false, false);
        } else {
            this._onLayoutInitDone = true;
        }

        if (onLayout) {
            onLayout(event);
        }
    }

    _snapScroll (delta) {
        const { swipeThreshold } = this.props;

        // When using momentum and releasing the touch with
        // no velocity, scrollEndActive will be undefined (iOS)
        if (!this._scrollEndActive && this._scrollEndActive !== 0 && IS_IOS) {
            this._scrollEndActive = this._scrollStartActive;
        }

        if (this._scrollStartActive !== this._scrollEndActive) {
            // Snap to the new active item
            this._snapToItem(this._scrollEndActive);
        } else {
            // Snap depending on delta
            if (delta > 0) {
                if (delta > swipeThreshold) {
                    this._snapToItem(this._scrollStartActive + 1);
                } else {
                    this._snapToItem(this._scrollEndActive);
                }
            } else if (delta < 0) {
                if (delta < -swipeThreshold) {
                    this._snapToItem(this._scrollStartActive - 1);
                } else {
                    this._snapToItem(this._scrollEndActive);
                }
            } else {
                // Snap to current
                this._snapToItem(this._scrollEndActive);
            }
        }
    }

    _snapToItem (index, animated = true, fireCallback = true, initial = false, lockScroll = true) {
        const { enableMomentum, onSnapToItem, onBeforeSnapToItem } = this.props;
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

        if (index !== this._previousActiveItem) {
            this._previousActiveItem = index;

            // Placed here to allow overscrolling for edges items
            if (lockScroll && this._canLockScroll()) {
                this._lockScroll();
            }

            if (fireCallback) {
                if (onBeforeSnapToItem) {
                    this._canFireBeforeCallback = true;
                }

                if (onSnapToItem) {
                    this._canFireCallback = true;
                }
            }
        }

        this._itemToSnapTo = index;
        this._scrollOffsetRef = this._positions[index] && this._positions[index].start;
        this._onScrollTriggered = false;

        if (!this._scrollOffsetRef && this._scrollOffsetRef !== 0) {
            return;
        }

        this._scrollTo(this._scrollOffsetRef, animated);

        this._scrollEndOffset = this._currentContentOffset;

        if (enableMomentum) {
            // iOS fix, check the note in the constructor
            if (!initial) {
                this._ignoreNextMomentum = true;
            }

            // When momentum is enabled and the user is overscrolling or swiping very quickly,
            // 'onScroll' is not going to be triggered for edge items. Then callback won't be
            // fired and loop won't work since the scrollview is not going to be repositioned.
            // As a workaround, '_onScroll()' will be called manually for these items if a given
            // condition hasn't been met after a small delay.
            // WARNING: this is ok only when relying on 'momentumScrollEnd', not with 'scrollEndDrag'
            if (index === 0 || index === itemsLength - 1) {
                clearTimeout(this._edgeItemTimeout);
                this._edgeItemTimeout = setTimeout(() => {
                    if (!initial && index === this._activeItem && !this._onScrollTriggered) {
                        this._onScroll();
                    }
                }, 250);
            }
        }
    }

    _onBeforeSnap (index) {
        const { onBeforeSnapToItem } = this.props;

        if (!this._carouselRef) {
            return;
        }

        this._canFireBeforeCallback = false;
        onBeforeSnapToItem && onBeforeSnapToItem(index);
    }

    _onSnap (index) {
        const { onSnapToItem } = this.props;

        if (!this._carouselRef) {
            return;
        }

        this._canFireCallback = false;
        onSnapToItem && onSnapToItem(index);
    }

    startAutoplay () {
        const { autoplayInterval, autoplayDelay } = this.props;
        this._autoplay = true;

        if (this._autoplaying) {
            return;
        }

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
        clearTimeout(this._autoplayTimeout);
        clearTimeout(this._enableAutoplayTimeout);
        clearInterval(this._autoplayInterval);
    }

    stopAutoplay () {
        this._autoplay = false;
        this.pauseAutoPlay();
    }

    snapToItem (index, animated = true, fireCallback = true) {
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
            if (!this._enableLoop()) {
                return;
            }
            newIndex = 0;
        }
        this._snapToItem(newIndex, animated, fireCallback);
    }

    snapToPrev (animated = true, fireCallback = true) {
        const itemsLength = this._getCustomDataLength();

        let newIndex = this._activeItem - 1;
        if (newIndex < 0) {
            if (!this._enableLoop()) {
                return;
            }
            newIndex = itemsLength - 1;
        }
        this._snapToItem(newIndex, animated, fireCallback);
    }

    // https://github.com/facebook/react-native/issues/1831#issuecomment-231069668
    triggerRenderingHack (offset) {
        // Avoid messing with user scroll
        if (Date.now() - this._lastScrollDate < 500) {
            return;
        }

        const scrollPosition = this._currentContentOffset;
        if (!scrollPosition && scrollPosition !== 0) {
            return;
        }

        const scrollOffset = offset || (scrollPosition === 0 ? 1 : -1);
        this._scrollTo(scrollPosition + scrollOffset, false);
    }

    _getSlideInterpolatedStyle (index, animatedValue) {
        const { layoutCardOffset, slideInterpolatedStyle } = this.props;

        if (slideInterpolatedStyle) {
            return slideInterpolatedStyle(index, animatedValue, this.props);
        } else if (this._shouldUseTinderLayout()) {
            return tinderAnimatedStyles(index, animatedValue, this.props, layoutCardOffset);
        } else if (this._shouldUseStackLayout()) {
            return stackAnimatedStyles(index, animatedValue, this.props, layoutCardOffset);
        } else if (this._shouldUseShiftLayout()) {
            return shiftAnimatedStyles(index, animatedValue, this.props);
        } else {
            return defaultAnimatedStyles(index, animatedValue, this.props);
        }
    }

    _renderItem ({ item, index }) {
        const { interpolators } = this.state;
        const {
            hasParallaxImages,
            itemWidth,
            itemHeight,
            keyExtractor,
            renderItem,
            sliderHeight,
            sliderWidth,
            slideStyle,
            vertical
        } = this.props;

        const animatedValue = interpolators && interpolators[index];

        if (!animatedValue && animatedValue !== 0) {
            return null;
        }

        const animate = this._shouldAnimateSlides();
        const Component = animate ? Animated.View : View;
        const animatedStyle = animate ? this._getSlideInterpolatedStyle(index, animatedValue) : {};

        const parallaxProps = hasParallaxImages ? {
            scrollPosition: this._scrollPos,
            carouselRef: this._carouselRef,
            vertical,
            sliderWidth,
            sliderHeight,
            itemWidth,
            itemHeight
        } : undefined;

        const mainDimension = vertical ? { height: itemHeight } : { width: itemWidth };
        const specificProps = this._needsScrollView() ? {
            key: keyExtractor ? keyExtractor(item, index) : this._getKeyExtractor(item, index)
        } : {};

        return (
            <Component style={[mainDimension, slideStyle, animatedStyle]} pointerEvents={'box-none'} {...specificProps}>
                { renderItem({ item, index }, parallaxProps) }
            </Component>
        );
    }

    _getComponentOverridableProps () {
        const {
            enableMomentum,
            itemWidth,
            itemHeight,
            loopClonesPerSide,
            sliderWidth,
            sliderHeight,
            vertical
        } = this.props;

        const visibleItems = Math.ceil(vertical ?
            sliderHeight / itemHeight :
            sliderWidth / itemWidth) + 1;
        const initialNumPerSide = this._enableLoop() ? loopClonesPerSide : 2;
        const initialNumToRender = visibleItems + (initialNumPerSide * 2);
        const maxToRenderPerBatch = 1 + (initialNumToRender * 2);
        const windowSize = maxToRenderPerBatch;

        const specificProps = !this._needsScrollView() ? {
            initialNumToRender: initialNumToRender,
            maxToRenderPerBatch: maxToRenderPerBatch,
            windowSize: windowSize
            // updateCellsBatchingPeriod
        } : {};

        return {
            decelerationRate: enableMomentum ? 0.9 : 'fast',
            showsHorizontalScrollIndicator: false,
            showsVerticalScrollIndicator: false,
            overScrollMode: 'never',
            automaticallyAdjustContentInsets: false,
            directionalLockEnabled: true,
            pinchGestureEnabled: false,
            scrollsToTop: false,
            removeClippedSubviews: !this._needsScrollView(),
            inverted: this._needsRTLAdaptations(),
            // renderToHardwareTextureAndroid: true,
            ...specificProps
        };
    }

    _getComponentStaticProps () {
        const { hideCarousel } = this.state;
        const {
            containerCustomStyle,
            contentContainerCustomStyle,
            keyExtractor,
            sliderWidth,
            sliderHeight,
            style,
            vertical
        } = this.props;

        const containerStyle = [
            containerCustomStyle || style || {},
            hideCarousel ? { opacity: 0 } : {},
            vertical ?
                { height: sliderHeight, flexDirection: 'column' } :
                // LTR hack; see https://github.com/facebook/react-native/issues/11960
                // and https://github.com/facebook/react-native/issues/13100#issuecomment-328986423
                { width: sliderWidth, flexDirection: this._needsRTLAdaptations() ? 'row-reverse' : 'row' }
        ];
        const contentContainerStyle = [
            vertical ? {
                paddingTop: this._getContainerInnerMargin(),
                paddingBottom: this._getContainerInnerMargin(true)
            } : {
                paddingLeft: this._getContainerInnerMargin(),
                paddingRight: this._getContainerInnerMargin(true)
            },
            contentContainerCustomStyle || {}
        ];

        const specificProps = !this._needsScrollView() ? {
            // extraData: this.state,
            renderItem: this._renderItem,
            numColumns: 1,
            keyExtractor: keyExtractor || this._getKeyExtractor
        } : {};

        return {
            ref: c => this._carouselRef = c,
            data: this._getCustomData(),
            style: containerStyle,
            contentContainerStyle: contentContainerStyle,
            horizontal: !vertical,
            scrollEventThrottle: 1,
            onScroll: this._onScrollHandler,
            onScrollBeginDrag: this._onScrollBeginDrag,
            onScrollEndDrag: this._onScrollEndDrag,
            onMomentumScrollEnd: this._onMomentumScrollEnd,
            onResponderRelease: this._onTouchRelease,
            onStartShouldSetResponderCapture: this._onStartShouldSetResponderCapture,
            onTouchStart: this._onTouchStart,
            onTouchEnd: this._onScrollEnd,
            onLayout: this._onLayout,
            ...specificProps
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

        const ScrollViewComponent = typeof useScrollView === 'function' ? useScrollView : AnimatedScrollView

        return this._needsScrollView() ? (
            <ScrollViewComponent {...props}>
                {
                    this._getCustomData().map((item, index) => {
                        return this._renderItem({ item, index });
                    })
                }
            </ScrollViewComponent>
        ) : (
            <AnimatedFlatList {...props} />
        );
    }
}
