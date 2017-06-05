import React, { Component, PropTypes } from 'react';
import { ScrollView, Animated, Platform, Easing, I18nManager } from 'react-native';
import shallowCompare from 'react-addons-shallow-compare';

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
        * Width in pixels of your elements
        */
        itemWidth: PropTypes.number.isRequired,
        /**
         * Width in pixels of your slider according
         * to your styles
         */
        sliderWidth: PropTypes.number.isRequired,
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
         * Override container's inner padding
         * WARNING: current padding calculation is necessary for slide's centering
         * Be aware that using this prop can mess with carousel's behavior
         */
        carouselHorizontalPadding: PropTypes.number,
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
         * Interface for ScrollView's `onScroll` callback
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
        containerCustomStyle: {},
        contentContainerCustomStyle: {},
        enableMomentum: false,
        enableSnap: true,
        firstItem: 0,
        inactiveSlideOpacity: 1,
        inactiveSlideScale: 0.9,
        slideStyle: {},
        shouldOptimizeUpdates: true,
        snapOnAndroid: true,
        swipeThreshold: 20
    }

    constructor (props) {
        super(props);
        this.state = {
            activeItem: this._getFirstItem(props.firstItem),
            oldItemIndex: this._getFirstItem(props.firstItem),
            interpolators: []
        };
        this._positions = [];
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onScroll = this._onScroll.bind(this);
        this._onScrollEnd = this._snapEnabled ? this._onScrollEnd.bind(this) : false;
        this._onScrollBegin = this._snapEnabled ? this._onScrollBegin.bind(this) : false;
        this._initInterpolators = this._initInterpolators.bind(this);
        this._onTouchRelease = this._onTouchRelease.bind(this);
        this._onLayout = this._onLayout.bind(this);
        // This bool aims at fixing an iOS bug due to scrollTo that triggers onMomentumScrollEnd.
        // onMomentumScrollEnd fires this._snapScroll, thus creating an infinite loop.
        this._ignoreNextMomentum = false;
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
        const { firstItem, itemWidth } = nextProps;

        const childrenLength = React.Children.count(nextProps.children);
        const nextFirstItem = this._getFirstItem(firstItem, nextProps);
        const nextActiveItem = activeItem || activeItem === 0 ? activeItem : nextFirstItem;

        if (itemWidth && itemWidth !== this.props.itemWidth) {
            this._calcCardPositions(nextProps);
        }

        if (childrenLength && interpolators.length !== childrenLength) {
            this._positions = [];
            this._calcCardPositions(nextProps);
            this._initInterpolators(nextProps);

            this.setState({ activeItem: nextActiveItem });

            if (IS_RTL) {
                this.snapToItem(nextActiveItem, false, false, false);
            }
        }
    }

    componentWillUnmount () {
        this.stopAutoplay();
        clearTimeout(this._enableAutoplayTimeout);
        clearTimeout(this._autoplayTimeout);
        clearTimeout(this._snapNoMomentumTimeout);
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

        return IS_RTL ?
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
        const { itemWidth } = props;

        this._children(props).map((item, index) => {
            const _index = this._getCustomIndex(index, props);
            this._positions[index] = {
                start: _index * itemWidth,
                end: _index * itemWidth + itemWidth
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

    _getActiveItem (centerX) {
        const { activeSlideOffset } = this.props;

        for (let i = 0; i < this._positions.length; i++) {
            const { start, end } = this._positions[i];
            if (centerX + activeSlideOffset >= start && centerX - activeSlideOffset <= end) {
                return i;
            }
        }
        return 0;
    }

    _getCenterX (event) {
        const { sliderWidth, itemWidth } = this.props;
        const containerSideMargin = (sliderWidth - itemWidth) / 2;

        return event.nativeEvent.contentOffset.x + sliderWidth / 2 - containerSideMargin;
    }

    _onScroll (event) {
        const { animationFunc, animationOptions, enableMomentum, onScrollViewScroll } = this.props;
        const { activeItem } = this.state;
        const newActiveItem = this._getActiveItem(this._getCenterX(event));

        if (enableMomentum) {
            clearTimeout(this._snapNoMomentumTimeout);
        }

        if (onScrollViewScroll) {
            onScrollViewScroll(event);
        }

        if (activeItem !== newActiveItem) {
            this.setState({ activeItem: newActiveItem });

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

    _onScrollBegin (event) {
        this._scrollStartX = event.nativeEvent.contentOffset.x;
        this._scrollStartActive = this.currentIndex;
        this._ignoreNextMomentum = false;
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

        const deltaX = this._scrollEndX - this._scrollStartX;

        if (this._snapEnabled) {
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
            this._snapNoMomentumTimeout =
                setTimeout(() => {
                    this.snapToItem(this.currentIndex);
                }, 100);
        }
    }

    _onLayout (event) {
        this._calcCardPositions();
        this.snapToItem(this.currentIndex, false, false, false);
    }

    _snapScroll (deltaX) {
        const { swipeThreshold } = this.props;

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
                    if (IS_RTL) {
                        this.snapToItem(this._scrollStartActive - 1);
                    } else {
                        this.snapToItem(this._scrollStartActive + 1);
                    }
                } else {
                    this.snapToItem(this._scrollEndActive);
                }
            } else if (deltaX < 0) {
                if (deltaX < -swipeThreshold) {
                    if (IS_RTL) {
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
        const itemsLength = this._positions.length;

        if (!index) {
            index = 0;
        }

        if (index >= itemsLength) {
            index = itemsLength - 1;
            fireCallback = false;
        } else if (index < 0) {
            index = 0;
            fireCallback = false;
        } else if (index === this.state.oldItemIndex) {
            fireCallback = false;
        }

        const snapX = itemsLength && this._positions[index].start;

        // Make sure the component hasn't been unmounted
        if (this._scrollview) {
            this.setState({ oldItemIndex: index });
            this._scrollview.scrollTo({ x: snapX, y: 0, animated });
            this.props.onSnapToItem && fireCallback && this.props.onSnapToItem(index);

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
                        opacity: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [inactiveSlideOpacity, 1] }),
                        transform: [{
                            scale: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [inactiveSlideScale, 1] })
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
            itemWidth,
            containerCustomStyle,
            contentContainerCustomStyle,
            enableMomentum,
            carouselHorizontalPadding
        } = this.props;

        const containerSideMargin = carouselHorizontalPadding || (sliderWidth - itemWidth) / 2;

        const style = [
            containerCustomStyle || {},
            // LTR hack; see https://github.com/facebook/react-native/issues/11960
            { flexDirection: IS_RTL ? 'row-reverse' : 'row' }
        ];
        const contentContainerStyle = [
            contentContainerCustomStyle || {},
            { paddingHorizontal: containerSideMargin }
        ];

        return (
            <ScrollView
              decelerationRate={enableMomentum ? 0.9 : 'normal'}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              overScrollMode={'never'}
              {...this.props}
              ref={(scrollview) => { this._scrollview = scrollview; }}
              style={style}
              contentContainerStyle={contentContainerStyle}
              horizontal={true}
              onScrollBeginDrag={this._onScrollBegin}
              onMomentumScrollEnd={enableMomentum ? this._onScrollEnd : undefined}
              onScrollEndDrag={!enableMomentum ? this._onScrollEnd : undefined}
              onResponderRelease={this._onTouchRelease}
              onScroll={this._onScroll}
              onTouchStart={this._onTouchStart}
              onLayout={this._onLayout}
            >
                { this._childSlides() }
            </ScrollView>
        );
    }
}
