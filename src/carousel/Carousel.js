import React, { Component } from 'react';
import { ScrollView, Animated, Platform, Easing, I18nManager, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import shallowCompare from 'react-addons-shallow-compare';
import _debounce from 'lodash.debounce';

// React Native automatically handles RTL layouts; unfortunately, it's buggy with horizontal ScrollView
// See https://github.com/facebook/react-native/issues/11960
// Handling it requires a bunch of hacks
// NOTE: the following variable is not declared in the constructor
// otherwise it is undefined at init, which messes with custom indexes
const IS_RTL = I18nManager.isRTL;

export default class Carousel extends Component {

    static propTypes = {
        ...ScrollView.propTypes,
        /**
        * Width in pixels of carousel's items
        * Required with 'horizontal' mode
        */
        itemWidth: PropTypes.number,
        /**
        * Height in pixels of carousel's items
        * Required with 'vertical' mode
        */
        itemHeight: PropTypes.number,
        /**
        * Width in pixels of the carousel itself
        * Required with 'horizontal' mode
        */
        sliderWidth: PropTypes.number,
        /**
        * Height in pixels of the carousel itself
        * Required with 'horizontal' mode
        */
        sliderHeight: PropTypes.number,
        /**
        * From slider's center, minimum slide distance
        * to be scrolled before being set to active
        */
        activeSlideOffset: PropTypes.number,
        /**
        * Animated animation to use. Provide the name
        * of the method, defaults to timing
        */
        animationFunc: PropTypes.string,
        /**
        * Animation options to be merged with the
        * default ones. Can be used w/ animationFunc
        */
        animationOptions: PropTypes.object,
        /**
        * Trigger autoplay
        */
        autoplay: PropTypes.bool,
        /**
        * Delay before enabling autoplay on startup and
        * after releasing the touch
        */
        autoplayDelay: PropTypes.number,
        /**
        * Delay until navigating to the next item
        */
        autoplayInterval: PropTypes.number,
        /**
         * Override container's inner horizontal padding
         * WARNING: current padding calculation is necessary for slide's centering
         * Be aware that using this prop can mess with carousel's behavior
         */
        carouselHorizontalPadding: PropTypes.number,
        /**
         * Override container's inner vertical padding
         * WARNING: current padding calculation is necessary for slide's centering
         * Be aware that using this prop can mess with carousel's behavior
         */
        carouselVerticalPadding: PropTypes.number,
        /**
        * Global wrapper's style
        */
        containerCustomStyle: ViewPropTypes.style,
        /**
        * Content container's style
        */
        contentContainerCustomStyle: ViewPropTypes.style,
        /**
        * If enabled, snapping will be triggered once
        * the ScrollView stops moving, not when the
        * user releases his finger
        */
        enableMomentum: PropTypes.bool,
        /**
        * If enabled, releasing the touch will scroll
        * to the center of the nearest/active item
        */
        enableSnap: PropTypes.bool,
        /**
        * Index of the first item to display
        */
        firstItem: PropTypes.number,
        /**
        * Opacity value of the inactive slides
        */
        inactiveSlideOpacity: PropTypes.number,
        /**
        * Scale factor of the inactive slides
        */
        inactiveSlideScale: PropTypes.number,
        /**
        * When momentum is disabled, this prop defines the
        * timeframe during which multiple 'endDrag' calls
        * should be "grouped" into a single one.
        * This debounce also helps smoothing the snap effect
        * by providing a bit of inertia when touch is released.
        * Note that it will delay callback's execution.
        */
        scrollEndDragDebounceValue: PropTypes.number,
        /**
         * Style of each item's container
         */
        slideStyle: Animated.View.propTypes.style,
        /**
         * whether to implement a `shouldComponentUpdate`
         * strategy to minimize updates
         */
        shouldOptimizeUpdates: PropTypes.bool,
        /**
         * Snapping on android is kinda choppy, especially
         * when swiping quickly so you can disable it
         */
        snapOnAndroid: PropTypes.bool,
        /**
        * Delta x when swiping to trigger the snap
        */
        swipeThreshold: PropTypes.number,
        /**
        * Layout slides vertically
        */
        vertical: PropTypes.bool,
        /**
         * Interface for ScrollView's `onScroll` callback (deprecated)
         */
        onScrollViewScroll: PropTypes.func,
        /**
         * Fired when snapping to an item
         */
        onSnapToItem: PropTypes.func
    };

    static defaultProps = {
        activeSlideOffset: 25,
        animationFunc: 'timing',
        animationOptions: {
            duration: 600,
            easing: Easing.elastic(1)
        },
        autoplay: false,
        autoplayDelay: 5000,
        autoplayInterval: 3000,
        carouselHorizontalPadding: null,
        carouselVerticalPadding: null,
        containerCustomStyle: {},
        contentContainerCustomStyle: {},
        enableMomentum: false,
        enableSnap: true,
        firstItem: 0,
        inactiveSlideOpacity: 1,
        inactiveSlideScale: 0.9,
        scrollEndDragDebounceValue: Platform.OS === 'ios' ? 50 : 150,
        slideStyle: {},
        shouldOptimizeUpdates: true,
        snapOnAndroid: true,
        swipeThreshold: 20,
        vertical: false
    }

    constructor (props) {
        super(props);

        const initialActiveItem = this._getFirstItem(props.firstItem);
        this.state = {
            activeItem: initialActiveItem,
            previousActiveItem: initialActiveItem, // used only when `enableMomentum` is set to `true`
            previousFirstItem: initialActiveItem,
            interpolators: []
        };

        this._positions = [];
        this._currentContentOffset = 0; // store ScrollView's scroll position
        this._hasFiredEdgeItemCallback = false; // deal with overscroll and callback
        this._canFireCallback = false; // used only when `enableMomentum` is set to `false`
        this._isShortSnapping = false; // used only when `enableMomentum` is set to `false`
        this._initInterpolators = this._initInterpolators.bind(this);
        this._onScroll = this._onScroll.bind(this);
        this._onScrollBeginDrag = this._snapEnabled ? this._onScrollBeginDrag.bind(this) : null;
        this._onScrollEnd = this._snapEnabled || props.autoplay ? this._onScrollEnd.bind(this) : null;
        this._onScrollEndDrag = !props.enableMomentum ? this._onScrollEndDrag.bind(this) : null;
        this._onMomentumScrollEnd = props.enableMomentum ? this._onMomentumScrollEnd.bind(this) : null;
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchRelease = this._onTouchRelease.bind(this);
        this._onLayout = this._onLayout.bind(this);
        this._onSnap = this._onSnap.bind(this);

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
        if (props.onScrollViewScroll) {
            console.warn('react-native-snap-carousel: Prop `onScrollViewScroll` is deprecated. Please use `onScroll` instead');
        }
        if (!props.vertical && (!props.sliderWidth || !props.itemWidth)) {
            console.warn('react-native-snap-carousel: You need to specify both `sliderWidth` and `itemWidth` for horizontal carousels');
        }
        if (props.vertical && (!props.sliderHeight || !props.itemHeight)) {
            console.warn('react-native-snap-carousel: You need to specify both `sliderHeight` and `itemHeight` for vertical carousels');
        }
    }

    componentDidMount () {
        const { firstItem, autoplay } = this.props;
        const _firstItem = this._getFirstItem(firstItem);

        this._initInterpolators(this.props);

        setTimeout(() => {
            this.snapToItem(_firstItem, false, false, true);

            if (autoplay) {
                this.startAutoplay();
            }
        }, 0);
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
        const { firstItem, sliderWidth, sliderHeight, itemWidth, itemHeight } = nextProps;

        const childrenLength = React.Children.count(nextProps.children);
        const nextFirstItem = this._getFirstItem(firstItem, nextProps);
        const nextActiveItem = activeItem || activeItem === 0 ? activeItem : nextFirstItem;

        const hasNewSliderWidth = sliderWidth && sliderWidth !== this.props.sliderWidth;
        const hasNewSliderHeight = sliderHeight && sliderHeight !== this.props.sliderHeight;
        const hasNewItemWidth = itemWidth && itemWidth !== this.props.itemWidth;
        const hasNewItemHeight = itemHeight && itemHeight !== this.props.itemHeight;

        if ((childrenLength && interpolators.length !== childrenLength) ||
            hasNewSliderWidth || hasNewSliderHeight || hasNewItemWidth || hasNewItemHeight) {
            this._positions = [];
            this._calcCardPositions(nextProps);
            this._initInterpolators(nextProps);

            this.setState({ activeItem: nextActiveItem });

            if (hasNewSliderWidth || hasNewSliderHeight || hasNewItemWidth || hasNewItemHeight ||
                (IS_RTL && !nextProps.vertical)) {
                this.snapToItem(nextActiveItem, false, false);
            }
        } else if (nextFirstItem !== previousFirstItem && nextFirstItem !== activeItem) {
            this.setState({
                previousFirstItem: nextFirstItem,
                activeItem: nextFirstItem
            });
            this.snapToItem(nextFirstItem);
        }
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

        return enableSnap && (Platform.OS === 'ios' || snapOnAndroid);
    }

    get currentIndex () {
        return this.state.activeItem;
    }

    get currentScrollPosition () {
        return this._currentContentOffset;
    }

    _getCustomIndex (index, props = this.props) {
        const childrenLength = this._children(props).length;

        if (!childrenLength || (!index && index !== 0)) {
            return 0;
        }

        return IS_RTL && !props.vertical ?
            childrenLength - index - 1 :
            index;
    }

    _getFirstItem (index, props = this.props) {
        const childrenLength = this._children(props).length;

        if (!childrenLength || index > childrenLength - 1 || index < 0) {
            return 0;
        }

        return index;
    }

    _calcCardPositions (props = this.props) {
        const { itemWidth, itemHeight, vertical } = props;

        const sizeRef = vertical ? itemHeight : itemWidth;

        this._children(props).map((item, index) => {
            const _index = this._getCustomIndex(index, props);
            this._positions[index] = {
                start: _index * sizeRef,
                end: _index * sizeRef + sizeRef
            };
        });
    }

    _initInterpolators (props = this.props) {
        const { firstItem } = props;
        const _firstItem = this._getFirstItem(firstItem, props);
        let interpolators = [];

        this._children(props).map((item, index) => {
            const value = index === _firstItem ? 1 : 0;
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
        return 0;
    }

    _getCenter (offset) {
        const { sliderWidth, sliderHeight, itemWidth, itemHeight, vertical } = this.props;

        const containerMargin = vertical ?
            (sliderHeight - itemHeight) / 2 :
            (sliderWidth - itemWidth) / 2;

        return offset - containerMargin + ((vertical ? sliderHeight : sliderWidth) / 2);
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
        const { enableMomentum, onScroll, onScrollViewScroll } = this.props;
        const { activeItem } = this.state;

        const scrollOffset = this._getScrollOffset(event);
        const newActiveItem = this._getActiveItem(scrollOffset);
        const itemsLength = this._positions.length;
        let animations = [];

        this._currentContentOffset = scrollOffset;

        if (enableMomentum) {
            clearTimeout(this._snapNoMomentumTimeout);
        }

        if (activeItem !== newActiveItem) {
            // WARNING: `setState()` is asynchronous
            this.setState({ activeItem: newActiveItem }, () => {
                // When "short snapping", we can rely on the "activeItem/newActiveItem" comparison
                if (!enableMomentum && this._canFireCallback && this._isShortSnapping) {
                    this._isShortSnapping = false;
                    this._onSnap(newActiveItem);
                }
            });

            // With dynamically removed items, `activeItem` and
            // `newActiveItem`'s interpolators might be `undefined`
            if (this.state.interpolators[activeItem]) {
                animations.push(this._getSlideAnimation(activeItem, 0));
            }
            if (this.state.interpolators[newActiveItem]) {
                animations.push(this._getSlideAnimation(newActiveItem, 1));
            }
            Animated.parallel(animations, { stopTogether: false }).start();

            if (activeItem === 0 || activeItem === itemsLength - 1) {
                this._hasFiredEdgeItemCallback = false;
            }
        }

        // When scrolling, we need to check that we are not "short snapping",
        // that the new slide is different from the very first one,
        // that we are scrolling to the relevant slide,
        // and that callback can be fired
        if (!enableMomentum && this._canFireCallback && !this._isShortSnapping &&
            (this._scrollStartActive !== newActiveItem || !this._hasFiredEdgeItemCallback) &&
            this._itemToSnapTo === newActiveItem) {
            this.setState({ activeItem: newActiveItem }, () => {
                this._onSnap(newActiveItem);
            });
        }

        if (onScroll) {
            onScroll(event);
        }

        // Deprecated
        if (onScrollViewScroll) {
            onScrollViewScroll(event);
        }
    }

    _onTouchStart () {
        if (this._autoplaying) {
            this.stopAutoplay();
        }
    }

    _onScrollBeginDrag (event) {
        this._scrollStartOffset = this._getScrollOffset(event);
        this._scrollStartActive = this._getActiveItem(this._scrollStartOffset);
        this._ignoreNextMomentum = false;
        this._canFireCallback = false;
    }

    // Used when `enableMomentum` is DISABLED
    _onScrollEndDrag (event) {
        // event.persist(); // See https://stackoverflow.com/a/24679479
        this._onScrollEndDragDebounced();
    }

    _onScrollEndDragDebounced (event) {
        if (this._scrollview && this._onScrollEnd) {
            this._onScrollEnd();
        }
    }

    // Used when `enableMomentum` is ENABLED
    _onMomentumScrollEnd (event) {
        if (this._scrollview && this._onScrollEnd) {
            this._onScrollEnd();
        }
    }

    _onScrollEnd (event) {
        const { autoplayDelay, autoplay } = this.props;

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
            clearTimeout(this._enableAutoplayTimeout);
            this._enableAutoplayTimeout = setTimeout(() => {
                this.startAutoplay(true);
            }, autoplayDelay + 200);
        }
    }

    // Due to a bug, this event is only fired on iOS
    // https://github.com/facebook/react-native/issues/6791
    // it's fine since we're only fixing an iOS bug in it, so ...
    _onTouchRelease (event) {
        if (this.props.enableMomentum && Platform.OS === 'ios') {
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
        if (!this._scrollEndActive && this._scrollEndActive !== 0 && Platform.OS === 'ios') {
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
        const { enableMomentum, onSnapToItem } = this.props;

        const itemsLength = this._positions.length;

        if (this._scrollview) {
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

    startAutoplay (instantly = false) {
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
        }, instantly ? 0 : autoplayDelay);
    }

    stopAutoplay () {
        this._autoplaying = false;
        clearInterval(this._autoplayInterval);
    }

    snapToItem (index, animated = true, fireCallback = true, initial = false) {
        const { previousActiveItem } = this.state;
        const { enableMomentum, vertical, scrollEndDragDebounceValue } = this.props;

        const itemsLength = this._positions.length;

        if (!index) {
            index = 0;
        }

        if (itemsLength > 0 && index >= itemsLength) {
            index = itemsLength - 1;
            if (this._scrollStartActive === itemsLength - 1 && this._hasFiredEdgeItemCallback) {
                fireCallback = false;
            }
        } else if (index < 0) {
            index = 0;
            if (this._scrollStartActive === 0 && this._hasFiredEdgeItemCallback) {
                fireCallback = false;
            }
        } else if (enableMomentum && index === previousActiveItem) {
            fireCallback = false;
        }

        // Make sure the component hasn't been unmounted
        if (this._scrollview) {
            const snapTo = itemsLength && this._positions[index].start;

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
                }, Math.max(200, scrollEndDragDebounceValue + 50));
            }

            this._scrollview.scrollTo({
                x: vertical ? 0 : snapTo,
                y: vertical ? snapTo : 0,
                animated
            });

            // iOS fix, check the note in the constructor
            if (!initial && Platform.OS === 'ios') {
                this._ignoreNextMomentum = true;
            }
        }
    }

    snapToNext (animated = true) {
        const itemsLength = this._positions.length;

        let newIndex = this.currentIndex + 1;
        if (newIndex > itemsLength - 1) {
            newIndex = 0;
        }
        this.snapToItem(newIndex, animated);
    }

    snapToPrev (animated = true) {
        const itemsLength = this._positions.length;

        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) {
            newIndex = itemsLength - 1;
        }
        this.snapToItem(newIndex, animated);
    }

    _children (props = this.props) {
        return React.Children.toArray(props.children);
    }

    _childSlides () {
        const { slideStyle, inactiveSlideScale, inactiveSlideOpacity } = this.props;

        if (!this.state.interpolators || !this.state.interpolators.length) {
            return false;
        };

        return this._children().map((child, index) => {
            const animatedValue = this.state.interpolators[index];

            if (!animatedValue || !animatedValue.opacity || !animatedValue.scale) {
                return false;
            }

            return (
              <Animated.View
                key={`carousel-item-${index}`}
                style={[
                    slideStyle,
                    {
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
                    }
                ]}>
                    { child }
              </Animated.View>
            );
        });
    }

    render () {
        const {
            sliderWidth,
            sliderHeight,
            itemWidth,
            itemHeight,
            containerCustomStyle,
            contentContainerCustomStyle,
            enableMomentum,
            vertical,
            carouselHorizontalPadding,
            carouselVerticalPadding
        } = this.props;

        const horizontalMargin = carouselHorizontalPadding || carouselHorizontalPadding === 0 ?
            carouselHorizontalPadding :
            (sliderWidth - itemWidth) / 2;
        const verticalMargin = carouselVerticalPadding || carouselVerticalPadding === 0 ?
            carouselVerticalPadding :
            (sliderHeight - itemHeight) / 2;
        const style = [
            containerCustomStyle || {},
            vertical ?
                { height: sliderHeight, flexDirection: 'column' } :
                // LTR hack; see https://github.com/facebook/react-native/issues/11960
                { width: sliderWidth, flexDirection: IS_RTL ? 'row-reverse' : 'row' }
        ];
        const contentContainerStyle = [
            contentContainerCustomStyle || {},
            vertical ?
                { paddingVertical: verticalMargin } :
                { paddingHorizontal: horizontalMargin }
        ];

        return (
            <ScrollView
              decelerationRate={enableMomentum ? 0.9 : 'normal'}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              overScrollMode={'never'}
              {...this.props}
              ref={(scrollview) => { this._scrollview = scrollview; }}
              style={style}
              contentContainerStyle={contentContainerStyle}
              horizontal={!vertical}
              onScroll={this._onScroll}
              onScrollBeginDrag={this._onScrollBeginDrag}
              onScrollEndDrag={this._onScrollEndDrag}
              onMomentumScrollEnd={this._onMomentumScrollEnd}
              onResponderRelease={this._onTouchRelease}
              onTouchStart={this._onTouchStart}
              onLayout={this._onLayout}
            >
                { this._childSlides() }
            </ScrollView>
        );
    }
}
