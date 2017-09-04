import React, { Component } from 'react';
import { View, FlatList, Animated, Platform, Easing, I18nManager, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import shallowCompare from 'react-addons-shallow-compare';
import _debounce from 'lodash.debounce';

const IS_IOS = Platform.OS === 'ios';

// Native driver for scroll events
// See: https://facebook.github.io/react-native/blog/2017/02/14/using-native-driver-for-animated.html
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// React Native automatically handles RTL layouts; unfortunately, it's buggy with horizontal ScrollView
// See https://github.com/facebook/react-native/issues/11960
// NOTE: the following variable is not declared in the constructor
// otherwise it is undefined at init, which messes with custom indexes
const IS_RTL = I18nManager.isRTL;

export default class Carousel extends Component {

    static propTypes = {
        ...FlatList.propTypes,
        data: PropTypes.array.isRequired,
        renderItem: PropTypes.func.isRequired,
        itemWidth: PropTypes.number, // required for horizontal carousel
        itemHeight: PropTypes.number, // required for vertical carousel
        sliderWidth: PropTypes.number,  // required for horizontal carousel
        sliderHeight: PropTypes.number, // required for vertical carousel
        activeSlideAlignment: PropTypes.oneOf(['center', 'end', 'start']),
        activeSlideOffset: PropTypes.number,
        animationFunc: PropTypes.string,
        animationOptions: PropTypes.object,
        apparitionDelay: PropTypes.number,
        autoplay: PropTypes.bool,
        autoplayDelay: PropTypes.number,
        autoplayInterval: PropTypes.number,
        containerCustomStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        contentContainerCustomStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        enableMomentum: PropTypes.bool,
        enableSnap: PropTypes.bool,
        firstItem: PropTypes.number,
        hasParallaxImages: PropTypes.bool,
        inactiveSlideOpacity: PropTypes.number,
        inactiveSlideScale: PropTypes.number,
        scrollEndDragDebounceValue: PropTypes.number,
        slideStyle: Animated.View.propTypes.style,
        shouldOptimizeUpdates: PropTypes.bool,
        snapOnAndroid: PropTypes.bool,
        swipeThreshold: PropTypes.number,
        useNativeOnScroll: PropTypes.bool,
        vertical: PropTypes.bool,
        onSnapToItem: PropTypes.func
    };

    static defaultProps = {
        activeSlideAlignment: 'center',
        activeSlideOffset: 25,
        animationFunc: 'timing',
        animationOptions: {
            duration: 600,
            easing: Easing.elastic(1)
        },
        apparitionDelay: 250,
        autoplay: false,
        autoplayDelay: 5000,
        autoplayInterval: 3000,
        containerCustomStyle: {},
        contentContainerCustomStyle: {},
        enableMomentum: false,
        enableSnap: true,
        firstItem: 0,
        hasParallaxImages: false,
        inactiveSlideOpacity: 0.7,
        inactiveSlideScale: 0.9,
        scrollEndDragDebounceValue: IS_IOS ? 50 : 150,
        slideStyle: {},
        shouldOptimizeUpdates: true,
        snapOnAndroid: true,
        swipeThreshold: 20,
        useNativeOnScroll: false,
        vertical: false
    }

    constructor (props) {
        super(props);

        const initialActiveItem = this._getFirstItem(props.firstItem);
        this.state = {
            activeItem: initialActiveItem,
            previousActiveItem: initialActiveItem, // used only when `enableMomentum` is set to `true`
            previousFirstItem: initialActiveItem,
            hideCarousel: true,
            interpolators: []
        };

        this._positions = [];
        this._currentContentOffset = 0; // store ScrollView's scroll position
        this._hasFiredEdgeItemCallback = true; // deal with overscroll and callback
        this._canFireCallback = false; // used only when `enableMomentum` is set to `false`
        this._isShortSnapping = false; // used only when `enableMomentum` is set to `false`

        this._initInterpolators = this._initInterpolators.bind(this);
        this._getItemLayout = this._getItemLayout.bind(this);
        this._renderItem = this._renderItem.bind(this);
        this._onScroll = this._onScroll.bind(this);
        this._onScrollEnd = this._snapEnabled || props.autoplay ? this._onScrollEnd.bind(this) : undefined;
        this._onScrollBeginDrag = this._snapEnabled ? this._onScrollBeginDrag.bind(this) : undefined;
        this._onScrollEndDrag = !props.enableMomentum ? this._onScrollEndDrag.bind(this) : undefined;
        this._onMomentumScrollEnd = props.enableMomentum ? this._onMomentumScrollEnd.bind(this) : undefined;
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchRelease = this._onTouchRelease.bind(this);
        this._onLayout = this._onLayout.bind(this);
        this._onSnap = this._onSnap.bind(this);

        // Native driver for scroll events
        if (props.useNativeOnScroll || props.hasParallaxImages || props.scrollEventThrottle < 16) {
            const scrollEventConfig = {
                listener: this._onScroll,
                useNativeDriver: true
            };
            this._scrollPos = new Animated.Value(0);
            this._onScrollHandler = props.vertical ?
                Animated.event(
                    [{ nativeEvent: { contentOffset: { y: this._scrollPos } } }],
                    scrollEventConfig
                ) : Animated.event(
                    [{ nativeEvent: { contentOffset: { x: this._scrollPos } } }],
                    scrollEventConfig
                );
        } else {
            this._onScrollHandler = this._onScroll;
        }

        // Debounce `_onScrollEndDrag` execution
        // This aims at improving snap feeling and callback reliability
        this._onScrollEndDragDebounced = !props.scrollEndDragDebounceValue ?
            this._onScrollEndDragDebounced.bind(this) :
            _debounce(
                this._onScrollEndDragDebounced,
                props.scrollEndDragDebounceValue,
                { leading: false, trailing: true }
            ).bind(this);

        // This bool aims at fixing an iOS bug due to scrollTo that triggers onMomentumScrollEnd.
        // onMomentumScrollEnd fires this._snapScroll, thus creating an infinite loop.
        this._ignoreNextMomentum = false;

        // Warnings
        if (!ViewPropTypes) {
            console.warn('react-native-snap-carousel: It is recommended to use at least version 0.44 of React Native with the plugin');
        }
        if (!props.vertical && (!props.sliderWidth || !props.itemWidth)) {
            console.warn('react-native-snap-carousel: You need to specify both `sliderWidth` and `itemWidth` for horizontal carousels');
        }
        if (props.vertical && (!props.sliderHeight || !props.itemHeight)) {
            console.warn('react-native-snap-carousel: You need to specify both `sliderHeight` and `itemHeight` for vertical carousels');
        }
        if (props.onScrollViewScroll) {
            console.warn('react-native-snap-carousel: Prop `onScrollViewScroll` has been removed. Use `onScroll` instead');
        }
    }

    componentDidMount () {
        const { firstItem, autoplay, apparitionDelay } = this.props;
        const _firstItem = this._getFirstItem(firstItem);

        this._initInterpolators(this.props, true);

        setTimeout(() => {
            this.snapToItem(_firstItem, false, false, true);

            if (autoplay) {
                this.startAutoplay();
            }
        }, 0);

        // hide FlatList's awful init
        setTimeout(() => {
            this.setState({ hideCarousel: false });
        }, apparitionDelay);
    }

    shouldComponentUpdate (nextProps, nextState) {
        if (this.props.shouldOptimizeUpdates === false) {
            return true;
        } else {
            return shallowCompare(this, nextProps, nextState);
        }
    }

    componentWillReceiveProps (nextProps) {
        const { activeItem, interpolators, previousFirstItem } = this.state;
        const { data, firstItem, sliderWidth, sliderHeight, itemWidth, itemHeight } = nextProps;

        const itemsLength = data.length;

        if (!itemsLength) {
            return;
        }

        const nextFirstItem = this._getFirstItem(firstItem, nextProps);
        let nextActiveItem = activeItem || activeItem === 0 ? activeItem : nextFirstItem;

        const hasNewSliderWidth = sliderWidth && sliderWidth !== this.props.sliderWidth;
        const hasNewSliderHeight = sliderHeight && sliderHeight !== this.props.sliderHeight;
        const hasNewItemWidth = itemWidth && itemWidth !== this.props.itemWidth;
        const hasNewItemHeight = itemHeight && itemHeight !== this.props.itemHeight;

        if (interpolators.length !== itemsLength || hasNewSliderWidth ||
            hasNewSliderHeight || hasNewItemWidth || hasNewItemHeight) {
            this.setState({ activeItem: nextActiveItem }, () => {
                this._positions = [];
                this._calcCardPositions(nextProps);
                this._initInterpolators(nextProps);

                // Prevent issues with dynamically removed items (see 'componentDidUpdate')
                if (nextActiveItem > itemsLength - 1) {
                    return;
                }

                if (hasNewSliderWidth || hasNewSliderHeight || hasNewItemWidth || hasNewItemHeight ||
                    (IS_RTL && !nextProps.vertical)) {
                    this.snapToItem(nextActiveItem, false, false);
                }
            });
        } else if (nextFirstItem !== previousFirstItem && nextFirstItem !== activeItem) {
            this.setState({
                previousFirstItem: nextFirstItem,
                activeItem: nextFirstItem
            }, () => {
                this.snapToItem(nextFirstItem);
            });
        }
    }

    componentDidUpdate (prevProps, prevState) {
        const previousItemsLength = prevProps && prevProps.data && prevProps.data.length;
        const itemsLength = this.props && this.props.data && this.props.data.length;

        // Handle state and scroll issue when dynamically removing items (see #133)
        if (!previousItemsLength || !itemsLength || previousItemsLength <= itemsLength) {
            return;
        }

        const { activeItem } = this.state;
        let nextActiveItem = activeItem;

        if (nextActiveItem > itemsLength - 1) {
            nextActiveItem = itemsLength - 1;
        }

        if (nextActiveItem < 0) {
            return;
        }

        this.setState({ activeItem: nextActiveItem }, () => {
            this.snapToItem(nextActiveItem, false, true);
            this._getSlideAnimation(nextActiveItem, 1).start();
        });
    }

    componentWillUnmount () {
        this.stopAutoplay();
        clearTimeout(this._enableAutoplayTimeout);
        clearTimeout(this._autoplayTimeout);
        clearTimeout(this._snapNoMomentumTimeout);
        clearTimeout(this._scrollToTimeout);
    }

    get _snapEnabled () {
        const { enableSnap, snapOnAndroid } = this.props;
        return enableSnap && (IS_IOS || snapOnAndroid);
    }

    get currentIndex () {
        return this.state.activeItem;
    }

    get currentScrollPosition () {
        return this._currentContentOffset;
    }

    _getCustomIndex (index, props = this.props) {
        const itemsLength = props.data && props.data.length;

        if (!itemsLength || (!index && index !== 0)) {
            return 0;
        }

        return IS_RTL && !props.vertical ?
            itemsLength - index - 1 :
            index;
    }

    _getFirstItem (index, props = this.props) {
        const itemsLength = props.data && props.data.length;

        if (!itemsLength || index > itemsLength - 1 || index < 0) {
            return 0;
        }

        return index;
    }

    _calcCardPositions (props = this.props) {
        const { data, itemWidth, itemHeight, vertical } = props;
        const sizeRef = vertical ? itemHeight : itemWidth;

        data.forEach((itemData, index) => {
            const _index = this._getCustomIndex(index, props);
            this._positions[index] = {
                start: _index * sizeRef,
                end: _index * sizeRef + sizeRef
            };
        });
    }

    _initInterpolators (props = this.props, initial = false) {
        const { activeItem } = this.state;
        const { data, firstItem } = props;

        let interpolators = [];
        const focusedItem = !initial && (activeItem || activeItem === 0) ?
            activeItem :
            this._getFirstItem(firstItem, props);

        data.forEach((itemData, index) => {
            const value = index === focusedItem ? 1 : 0;
            interpolators.push({
                opacity: new Animated.Value(value),
                scale: new Animated.Value(value)
            });
        });
        this.setState({ interpolators });
    }

    _getScrollOffset (event) {
        const { vertical } = this.props;
        return (event && event.nativeEvent && event.nativeEvent.contentOffset &&
            event.nativeEvent.contentOffset[vertical ? 'y' : 'x']) || 0;
    }

    _getActiveItem (offset) {
        const { activeSlideOffset } = this.props;
        const center = this._getCenter(offset);

        for (let i = 0; i < this._positions.length; i++) {
            const { start, end } = this._positions[i];
            if (center + activeSlideOffset >= start && center - activeSlideOffset <= end) {
                return i;
            }
        }

        const lastIndex = this._positions.length - 1;
        if (this._positions[lastIndex] && center - activeSlideOffset > this._positions[lastIndex].end) {
            return lastIndex;
        }

        return 0;
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

    _getCenter (offset) {
        const { sliderWidth, sliderHeight, itemWidth, itemHeight, vertical, activeSlideAlignment } = this.props;

        let viewportOffset;
        if (activeSlideAlignment === 'start') {
            viewportOffset = vertical ? itemHeight / 2 : itemWidth / 2;
        } else if (activeSlideAlignment === 'end') {
            viewportOffset = vertical ?
                sliderHeight - (itemHeight / 2) :
                sliderWidth - (itemWidth / 2);
        } else {
            viewportOffset = vertical ? sliderHeight / 2 : sliderWidth / 2;
        }

        return offset + viewportOffset - (this._getContainerInnerMargin() * (IS_RTL ? -1 : 1));
    }

    _getKeyExtractor (item, index) {
        return `carousel-item-${index}`;
    }

    _getItemLayout (data, index) {
        const { itemWidth, itemHeight, vertical } = this.props;
        const itemSize = vertical ? itemHeight : itemWidth;

        return {
            length: itemSize,
            offset: itemSize * index,
            index
        };
    }

    _getItemOffset (index) {
        // 'viewPosition' doesn't work for the first item
        // It is always aligned to the left
        // Unfortunately, 'viewOffset' doesn't work on Android ATM
        if ((!IS_RTL && index === 0) ||
            (IS_RTL && index === this.props.data.length - 1)) {
            return this._getContainerInnerMargin();
        }

        return 0;
    }

    _getSlideAnimation (index, toValue) {
        const { animationFunc, animationOptions } = this.props;
        const animationCommonOptions = {
            isInteraction: false,
            useNativeDriver: true,
            ...animationOptions,
            toValue: toValue
        };

        return Animated.parallel([
            Animated['timing'](
                this.state.interpolators[index].opacity,
                { ...animationCommonOptions, easing: Easing.linear }
            ),
            Animated[animationFunc](
                this.state.interpolators[index].scale,
                { ...animationCommonOptions }
            )
        ]);
    }

    _onScroll (event) {
        const { activeItem } = this.state;
        const { data, enableMomentum, onScroll } = this.props;

        const scrollOffset = this._getScrollOffset(event);
        const nextActiveItem = this._getActiveItem(scrollOffset);
        const itemsLength = data.length;
        let animations = [];

        this._currentContentOffset = scrollOffset;

        if (enableMomentum) {
            clearTimeout(this._snapNoMomentumTimeout);
        }

        if (activeItem !== nextActiveItem) {
            if (activeItem === 0 || activeItem === itemsLength - 1) {
                this._hasFiredEdgeItemCallback = false;
            }

            // WARNING: `setState()` is asynchronous
            this.setState({ activeItem: nextActiveItem }, () => {
                // When "short snapping", we can rely on the "activeItem/nextActiveItem" comparison
                if (!enableMomentum && this._canFireCallback && this._isShortSnapping) {
                    this._isShortSnapping = false;
                    this._onSnap(nextActiveItem);
                }
            });

            // With dynamically removed items, `activeItem` and
            // `nextActiveItem`'s interpolators might be `undefined`
            if (this.state.interpolators[activeItem]) {
                animations.push(this._getSlideAnimation(activeItem, 0));
            }
            if (this.state.interpolators[nextActiveItem]) {
                animations.push(this._getSlideAnimation(nextActiveItem, 1));
            }
            if (animations.length) {
                Animated.parallel(animations, { stopTogether: false }).start();
            }
        }

        // When scrolling, we need to check that we are not "short snapping",
        // that the new slide is different from the very first one,
        // that we are scrolling to the relevant slide,
        // and that callback can be fired
        if (!enableMomentum && this._canFireCallback && !this._isShortSnapping &&
            (this._scrollStartActive !== nextActiveItem || !this._hasFiredEdgeItemCallback) &&
            this._itemToSnapTo === nextActiveItem) {
            this.setState({ activeItem: nextActiveItem }, () => {
                this._onSnap(nextActiveItem);
            });
        }

        if (onScroll) {
            onScroll(event);
        }
    }

    _onTouchStart () {
        // `onTouchStart` is fired even when `scrollEnabled` is set to `false`
        if (this.props.scrollEnabled !== false && this._autoplaying) {
            this.stopAutoplay();
        }
    }

    // Used when `enableSnap` is ENABLED
    _onScrollBeginDrag (event) {
        const { onScrollBeginDrag } = this.props;

        this._scrollStartOffset = this._getScrollOffset(event);
        this._scrollStartActive = this._getActiveItem(this._scrollStartOffset);
        this._ignoreNextMomentum = false;
        this._canFireCallback = false;

        if (onScrollBeginDrag) {
            onScrollBeginDrag(event);
        }
    }

    // Used when `enableMomentum` is DISABLED
    _onScrollEndDrag (event) {
        const { onScrollEndDrag } = this.props;

        // event.persist(); // See https://stackoverflow.com/a/24679479
        this._onScrollEndDragDebounced();

        if (onScrollEndDrag) {
            onScrollEndDrag(event);
        }
    }

    _onScrollEndDragDebounced (event) {
        if (this._flatlist && this._onScrollEnd) {
            this._onScrollEnd();
        }
    }

    // Used when `enableMomentum` is ENABLED
    _onMomentumScrollEnd (event) {
        const { onMomentumScrollEnd } = this.props;

        if (this._flatlist && this._onScrollEnd) {
            this._onScrollEnd();
        }

        if (onMomentumScrollEnd) {
            onMomentumScrollEnd(event);
        }
    }

    _onScrollEnd (event) {
        const { autoplay } = this.props;

        if (this._ignoreNextMomentum) {
            // iOS fix
            this._ignoreNextMomentum = false;
            return;
        }

        this._scrollEndOffset = this._currentContentOffset;
        this._scrollEndActive = this._getActiveItem(this._scrollEndOffset);

        if (this._snapEnabled) {
            const delta = this._scrollEndOffset - this._scrollStartOffset;
            this._snapScroll(delta);
        }

        if (autoplay) {
            // Restart autoplay after a little while
            // This could be done when releasing touch
            // but the event is buggy on Android...
            // https://github.com/facebook/react-native/issues/9439
            clearTimeout(this._enableAutoplayTimeout);
            this._enableAutoplayTimeout = setTimeout(() => {
                this.startAutoplay();
            }, 300);
        }
    }

    // Due to a bug, this event is only fired on iOS
    // https://github.com/facebook/react-native/issues/6791
    // it's fine since we're only fixing an iOS bug in it, so ...
    _onTouchRelease (event) {
        if (this.props.enableMomentum && IS_IOS) {
            clearTimeout(this._snapNoMomentumTimeout);
            this._snapNoMomentumTimeout = setTimeout(() => {
                this.snapToItem(this.currentIndex);
            }, 100);
        }
    }

    _onLayout (event) {
        const { onLayout } = this.props;

        this._calcCardPositions();
        this.snapToItem(this.currentIndex, false, false);

        if (onLayout) {
            onLayout(event);
        }
    }

    _snapScroll (delta) {
        const { swipeThreshold, vertical } = this.props;

        // When using momentum and releasing the touch with
        // no velocity, scrollEndActive will be undefined (iOS)
        if (!this._scrollEndActive && this._scrollEndActive !== 0 && IS_IOS) {
            this._scrollEndActive = this._scrollStartActive;
        }

        if (this._scrollStartActive !== this._scrollEndActive) {
            // Flag necessary in order to fire the callback
            // at the right time in `_onScroll()`
            this._isShortSnapping = false;

            // Snap to the new active item
            this.snapToItem(this._scrollEndActive);
        } else {
            this._isShortSnapping = true;

            // Snap depending on delta
            if (delta > 0) {
                if (delta > swipeThreshold) {
                    if (IS_RTL && !vertical) {
                        this.snapToItem(this._scrollStartActive - 1);
                    } else {
                        this.snapToItem(this._scrollStartActive + 1);
                    }
                } else {
                    this.snapToItem(this._scrollEndActive);
                }
            } else if (delta < 0) {
                if (delta < -swipeThreshold) {
                    if (IS_RTL && !vertical) {
                        this.snapToItem(this._scrollStartActive + 1);
                    } else {
                        this.snapToItem(this._scrollStartActive - 1);
                    }
                } else {
                    this.snapToItem(this._scrollEndActive);
                }
            } else {
                // Snap to current
                this.snapToItem(this._scrollEndActive);
            }
        }
    }

    _onSnap (index) {
        const { data, enableMomentum, onSnapToItem } = this.props;
        const itemsLength = data.length;

        if (this._flatlist) {
            if (enableMomentum) {
                onSnapToItem && onSnapToItem(index);
            } else if (this._canFireCallback) {
                this._canFireCallback = false;

                if (index === 0 || index === itemsLength - 1) {
                    this._hasFiredEdgeItemCallback = true;
                }

                onSnapToItem && onSnapToItem(index);
            }
        }
    }

    startAutoplay () {
        const { autoplayInterval, autoplayDelay } = this.props;

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

    stopAutoplay () {
        this._autoplaying = false;
        clearInterval(this._autoplayInterval);
    }

    snapToItem (index, animated = true, fireCallback = true, initial = false) {
        const { previousActiveItem } = this.state;
        const { data, enableMomentum, scrollEndDragDebounceValue } = this.props;
        const itemsLength = data.length;

        if (!itemsLength) {
            return;
        }

        if (!index) {
            index = 0;
        }

        if (itemsLength > 0 && index >= itemsLength) {
            index = itemsLength - 1;
            this._isShortSnapping = false; // prevent issue #105
            if (this._scrollStartActive === itemsLength - 1 && this._hasFiredEdgeItemCallback) {
                fireCallback = false;
            }
        } else if (index < 0) {
            index = 0;
            this._isShortSnapping = false; // prevent issue #105
            if (this._scrollStartActive === 0 && this._hasFiredEdgeItemCallback) {
                fireCallback = false;
            }
        } else if (enableMomentum && index === previousActiveItem) {
            fireCallback = false;
        }

        // Make sure the component hasn't been unmounted
        if (this._flatlist) {
            if (enableMomentum) {
                this.setState({ previousActiveItem: index });
                // Callback can be fired here when relying on 'onMomentumScrollEnd'
                if (fireCallback) {
                    this._onSnap(index);
                }
            } else {
                // `_onScrollEndDragDebounced()` might occur when "peaking" to another item
                // Therefore we need to make sure that callback is fired when scrolling
                // back to the right one
                this._itemToSnapTo = index;

                // Callback needs to be fired while scrolling when relying on 'onScrollEndDrag'
                // Thus we need a flag on top of the debounce function to call it only once
                this._canFireCallback = this.props.onSnapToItem && fireCallback;

                // If user has scrolled to an edge item before the end of `scrollEndDragDebounceValue`
                // `onScroll()` won't be triggered and callback is not going to be fired
                // So we check if scroll position has been updated after a small delay and,
                // if not, it's safe to assume that callback should be called
                const scrollPosition = this._currentContentOffset;
                clearTimeout(this._scrollToTimeout);
                this._scrollToTimeout = setTimeout(() => {
                    if (scrollPosition === this._currentContentOffset && this._canFireCallback) {
                        this._onSnap(index);
                    }
                }, Math.max(500, scrollEndDragDebounceValue + 50));
            }

            // Unfortunately, 'viewPosition' is quite buggy at the moment
            // Moreover, 'viewOffset' just doesn't work on Android
            // const viewOffset = this._getItemOffset(index);
            // let viewPosition = 0.5;
            // if (activeSlideAlignment === 'start') {
            //     viewPosition = IS_RTL ? 1 : 0;
            // } else if (activeSlideAlignment === 'end') {
            //     viewPosition = IS_RTL ? 0 : 1;
            // }

            this._flatlist.scrollToIndex({
                index,
                viewPosition: 0,
                viewOffset: 0,
                animated
            });

            // iOS fix, check the note in the constructor
            if (!initial && IS_IOS) {
                this._ignoreNextMomentum = true;
            }
        }
    }

    snapToNext (animated = true) {
        const itemsLength = this.props.data.length;

        let newIndex = this.currentIndex + 1;
        if (newIndex > itemsLength - 1) {
            newIndex = 0;
        }
        this.snapToItem(newIndex, animated);
    }

    snapToPrev (animated = true) {
        const itemsLength = this.props.data.length;

        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) {
            newIndex = itemsLength - 1;
        }
        this.snapToItem(newIndex, animated);
    }

    _renderItem ({ item, index }) {
        const { interpolators } = this.state;
        const {
            renderItem,
            sliderWidth,
            sliderHeight,
            itemWidth,
            itemHeight,
            slideStyle,
            inactiveSlideScale,
            inactiveSlideOpacity,
            vertical,
            hasParallaxImages
        } = this.props;

        const animatedValue = interpolators && interpolators[index];

        if (!animatedValue || !animatedValue.opacity || !animatedValue.scale) {
            return false;
        }

        const animatedStyle = {
            opacity: animatedValue.opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [inactiveSlideOpacity, 1]
            }),
            transform: [{
                scale: animatedValue.scale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [inactiveSlideScale, 1]
                })
            }]
        };

        const parallaxProps = hasParallaxImages ? {
            scrollPosition: this._scrollPos,
            carouselRef: this._flatlist,
            vertical,
            sliderWidth,
            sliderHeight,
            itemWidth,
            itemHeight
        } : undefined;

        return (
            <Animated.View style={[slideStyle, animatedStyle]}>
                { renderItem({ item, index }, parallaxProps) }
            </Animated.View>
        );
    }

    render () {
        const { hideCarousel } = this.state;
        const {
            containerCustomStyle,
            contentContainerCustomStyle,
            data,
            enableMomentum,
            firstItem,
            hasParallaxImages,
            itemWidth,
            itemHeight,
            keyExtractor,
            renderItem,
            sliderWidth,
            sliderHeight,
            useNativeOnScroll,
            vertical
        } = this.props;

        if (!data || !renderItem) {
            return false;
        }

        const wrapList = useNativeOnScroll || hasParallaxImages;
        const Component = wrapList ? AnimatedFlatList : FlatList;

        const style = [
            containerCustomStyle || {},
            hideCarousel ? { opacity: 0 } : {},
            vertical ?
                { height: sliderHeight, flexDirection: 'column' } :
                // LTR hack; see https://github.com/facebook/react-native/issues/11960
                { width: sliderWidth, flexDirection: IS_RTL ? 'row-reverse' : 'row' }
        ];
        const contentContainerStyle = [
            contentContainerCustomStyle || {},
            vertical ? {
                paddingTop: this._getContainerInnerMargin(),
                paddingBottom: this._getContainerInnerMargin(true)
            } : {
                paddingLeft: this._getContainerInnerMargin(),
                paddingRight: this._getContainerInnerMargin(true)
            }
        ];

        const visibleItems = Math.ceil(vertical ?
            sliderHeight / itemHeight :
            sliderWidth / itemWidth) + 1;

        return (
            <Component
              decelerationRate={enableMomentum ? 0.9 : 'normal'}
              scrollEventThrottle={useNativeOnScroll ? 1 : 16}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              overScrollMode={'never'}
              directionalLockEnabled={true}
              initialNumToRender={visibleItems + 5}
              maxToRenderPerBatch={enableMomentum ? visibleItems * 2 : 5}
              windowSize={enableMomentum ? Math.max(11, (visibleItems * 2) + 1) : 11}
              // updateCellsBatchingPeriod
              {...this.props}
              ref={(c) => { if (c) { this._flatlist = wrapList ? c._component : c; } }}
              data={data}
              renderItem={this._renderItem}
              // extraData={this.state}
              getItemLayout={this._getItemLayout}
              keyExtractor={keyExtractor || this._getKeyExtractor}
              initialScrollIndex={firstItem || undefined}
              numColumns={1}
              style={style}
              contentContainerStyle={contentContainerStyle}
              horizontal={!vertical}
              onScroll={this._onScrollHandler}
              onScrollBeginDrag={this._onScrollBeginDrag}
              onScrollEndDrag={this._onScrollEndDrag}
              onMomentumScrollEnd={this._onMomentumScrollEnd}
              onResponderRelease={this._onTouchRelease}
              onTouchStart={this._onTouchStart}
              onLayout={this._onLayout}
            />
        );
    }
}
