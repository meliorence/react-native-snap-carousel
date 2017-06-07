import React, { Component, PropTypes } from 'react';
import { ScrollView, Animated, Platform, Easing, I18nManager } from 'react-native';
import shallowCompare from 'react-addons-shallow-compare';
import _debounce from 'lodash.debounce';
import _throttle from 'lodash.throttle';

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
        containerCustomStyle: ScrollView.propTypes.style,
        /**
        * Content container's style
        */
        contentContainerCustomStyle: ScrollView.propTypes.style,
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
        * When momentum is disabled, this throttle helps
        * smoothing slides' snapping by providing a bit
        * of inertia when touch is released
        * Note that this will delay callback's execution
        */
        scrollEndDragThrottleValue: PropTypes.number,
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
        * This defines the timeframe during which multiple callback
        * calls should be "grouped" into a single one
        * Note that this will delay callback's execution
        */
        snapCallbackDebounceValue: PropTypes.number,
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
            easing: Easing.elastic(1),
            duration: 600
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
        scrollEndDragThrottleValue: Platform.OS === 'ios' ? 50 : 150,
        slideStyle: {},
        shouldOptimizeUpdates: true,
        snapOnAndroid: true,
        snapCallbackDebounceValue: 250,
        swipeThreshold: 20,
        vertical: false
    }

    constructor (props) {
        super(props);
        this.state = {
            activeItem: this._getFirstItem(props.firstItem),
            oldItemIndex: this._getFirstItem(props.firstItem), // used only when `enableMomentum` is set to `true`
            interpolators: []
        };
        this._positions = [];
        this._canExecuteCallback = props.onSnapToItem !== undefined;
        this._initInterpolators = this._initInterpolators.bind(this);
        this._onScroll = this._onScroll.bind(this);
        this._onScrollBeginDrag = this._snapEnabled ? this._onScrollBeginDrag.bind(this) : null;
        this._onScrollEnd = this._snapEnabled || props.autoplay ? this._onScrollEnd.bind(this) : null;
        this._onScrollEndDrag = !props.enableMomentum ? this._onScrollEndDrag.bind(this) : null;
        this._onMomentumScrollEnd = props.enableMomentum ? this._onMomentumScrollEnd.bind(this) : null;
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchRelease = this._onTouchRelease.bind(this);
        this._onLayout = this._onLayout.bind(this);

        // Throttle `_onScrollEndDrag` execution
        // This aims at improving snap feeling
        this._onScrollEndDragThrottled = _throttle(
            this._onScrollEndDragThrottled,
            props.scrollEndDragThrottleValue,
            { leading: false, trailing: true }
        ).bind(this);

        // Debounce snap callback's execution
        // This aims at providing a workaround for issue #34
        this._onSnapToItemDebounced = _debounce(
            this._onSnapToItemDebounced,
            props.snapCallbackDebounceValue,
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
        const { activeItem, interpolators } = this.state;
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

    _getCustomIndex (index, props = this.props) {
        const itemsLength = this._children(props).length;

        if (!itemsLength || (!index && index !== 0)) {
            return 0;
        }

        return IS_RTL && !props.vertical ?
            itemsLength - index - 1 :
            index;
    }

    _getFirstItem (index, props = this.props) {
        const itemsLength = this._children(props).length;

        if (index > itemsLength - 1 || index < 0) {
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
            interpolators.push(new Animated.Value(index === _firstItem ? 1 : 0));
        });
        this.setState({ interpolators });
    }

    _getActiveItem (center) {
        const { activeSlideOffset } = this.props;

        for (let i = 0; i < this._positions.length; i++) {
            const { start, end } = this._positions[i];
            if (center + activeSlideOffset >= start && center - activeSlideOffset <= end) {
                return i;
            }
        }
        return 0;
    }

    _getCenterX (event) {
        const { sliderWidth, itemWidth } = this.props;
        const containerHorizontalMargin = (sliderWidth - itemWidth) / 2;

        return event.nativeEvent.contentOffset.x + sliderWidth / 2 - containerHorizontalMargin;
    }

    _getCenterY (event) {
        const { sliderHeight, itemHeight } = this.props;
        const containerVerticalMargin = (sliderHeight - itemHeight) / 2;

        return event.nativeEvent.contentOffset.y + sliderHeight / 2 - containerVerticalMargin;
    }

    _onScroll (event) {
        const { animationFunc, animationOptions, enableMomentum, onScroll, onScrollViewScroll, vertical } = this.props;
        const { activeItem } = this.state;

        const center = vertical ? this._getCenterY(event) : this._getCenterX(event);
        const newActiveItem = this._getActiveItem(center);

        if (enableMomentum) {
            clearTimeout(this._snapNoMomentumTimeout);
        }

        if (onScroll) {
            onScroll(event);
        }

        // Deprecated
        if (onScrollViewScroll) {
            onScrollViewScroll(event);
        }

        if (activeItem !== newActiveItem) {
            this.setState({ activeItem: newActiveItem });

            if (!enableMomentum) {
                this._onSnapToItemDebounced(newActiveItem);
            }

            Animated.parallel([
                Animated[animationFunc](
                    this.state.interpolators[activeItem],
                    { ...animationOptions, toValue: 0 }
                ),
                Animated[animationFunc](
                    this.state.interpolators[newActiveItem],
                    { ...animationOptions, toValue: 1 }
                )
            ]).start();
        }
    }

    _onTouchStart () {
        if (this._autoplaying) {
            this.stopAutoplay();
        }
    }

    _onScrollBeginDrag (event) {
        this._scrollStartX = event.nativeEvent.contentOffset.x;
        this._scrollStartActive = this.currentIndex;
        this._ignoreNextMomentum = false;
    }

    // Used when `enableMomentum` is DISABLED
    _onScrollEndDrag (event) {
        event.persist(); // See https://stackoverflow.com/a/24679479
        this._onScrollEndDragThrottled(event);
    }

    _onScrollEndDragThrottled (event) {
        if (this._scrollview) {
            this._onScrollEnd(event);
        }
    }

    // Used when `enableMomentum` is ENABLED
    _onMomentumScrollEnd (event) {
        this._onScrollEnd(event);
    }

    _onScrollEnd (event) {
        const { autoplayDelay, autoplay } = this.props;

        if (this._ignoreNextMomentum) {
            // iOS fix
            this._ignoreNextMomentum = false;
            return;
        }

        this._scrollEndX = event.nativeEvent.contentOffset.x;
        this._scrollEndActive = this.currentIndex;

        if (this._snapEnabled) {
            const deltaX = this._scrollEndX - this._scrollStartX;
            this._snapScroll(deltaX);
        }

        if (autoplay) {
            // Restart autoplay after a little while
            // This could be done when releasing touch
            // but the event is buggy on Android...
            clearTimeout(this._enableAutoplayTimeout);
            this._enableAutoplayTimeout =
                setTimeout(() => {
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
            this._snapNoMomentumTimeout =
                setTimeout(() => {
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

    _snapScroll (deltaX) {
        const { swipeThreshold, vertical } = this.props;

        // When using momentum and releasing the touch with
        // no velocity, scrollEndActive will be undefined (iOS)
        if (!this._scrollEndActive && this._scrollEndActive !== 0 && Platform.OS === 'ios') {
            this._scrollEndActive = this._scrollStartActive;
        }

        if (this._scrollStartActive !== this._scrollEndActive) {
            // Snap to the new active item
            this.snapToItem(this._scrollEndActive);
        } else {
            // Snap depending on delta
            if (deltaX > 0) {
                if (deltaX > swipeThreshold) {
                    if (IS_RTL && !vertical) {
                        this.snapToItem(this._scrollStartActive - 1);
                    } else {
                        this.snapToItem(this._scrollStartActive + 1);
                    }
                } else {
                    this.snapToItem(this._scrollEndActive);
                }
            } else if (deltaX < 0) {
                if (deltaX < -swipeThreshold) {
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

    _onSnapToItemDebounced (index) {
        const { enableMomentum, onSnapToItem } = this.props;

        if (this._scrollview) {
            if (enableMomentum) {
                onSnapToItem && onSnapToItem(index);
            } else if (this._canExecuteCallback) {
                this._canExecuteCallback = false;
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
        this._autoplayTimeout =
            setTimeout(() => {
                this._autoplaying = true;
                this._autoplayInterval =
                    setInterval(() => {
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
        const { oldItemIndex } = this.state;
        const { enableMomentum, vertical } = this.props;

        const itemsLength = this._positions.length;

        if (!index) {
            index = 0;
        }

        if (itemsLength > 0 && index >= itemsLength) {
            index = itemsLength - 1;
            fireCallback = false;
        } else if (index < 0) {
            index = 0;
            fireCallback = false;
        } else if (enableMomentum && index === oldItemIndex) {
            fireCallback = false;
        }

        // Make sure the component hasn't been unmounted
        if (this._scrollview) {
            const snapTo = itemsLength && this._positions[index].start;

            this._scrollview.scrollTo({
                x: vertical ? 0 : snapTo,
                y: vertical ? snapTo : 0,
                animated
            });

            if (enableMomentum) {
                this.setState({ oldItemIndex: index });
                // Callback can be fired here when relying on 'onMomentumScrollEnd'
                if (fireCallback) {
                    this._onSnapToItemDebounced(index);
                }
            } else {
                // Callback needs to be fired while scrolling when relying on 'onScrollEndDrag'
                // Thus we need a flag on top of the debounce function to avoid calling it too often
                this._canExecuteCallback = this.props.onSnapToItem && fireCallback;
            }

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

            if (!animatedValue) {
                return false;
            }

            return (
              <Animated.View
                key={`carousel-item-${index}`}
                style={[
                    slideStyle,
                    {
                        opacity: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [inactiveSlideOpacity, 1]
                        }),
                        transform: [{
                            scale: animatedValue.interpolate({
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

        const horizontalMargin = carouselHorizontalPadding || (sliderWidth - itemWidth) / 2;
        const verticalMargin = carouselVerticalPadding || (sliderHeight - itemHeight) / 2;

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
