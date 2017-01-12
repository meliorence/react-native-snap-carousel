import React, { Component, PropTypes } from 'react';
import { ScrollView, Animated, Platform, Easing } from 'react-native';
import shallowCompare from 'react-addons-shallow-compare';

export default class Carousel extends Component {

    static propTypes = {
        ...ScrollView.propTypes,
        /**
         * Supply items to loop on
         */
        items: PropTypes.array.isRequired,
        /**
         * Width in pixels of your slider according
         * to your styles
         */
        sliderWidth: PropTypes.number.isRequired,
        /**
         * Width in pixels of your elements
         */
        itemWidth: PropTypes.number.isRequired,
        /**
         * Function returning a react element. The entry
         * data is the 1st parameter, its index is the 2nd
         */
        renderItem: PropTypes.func.isRequired,
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
        * Global wrapper's style
        */
        containerCustomStyle: Animated.View.propTypes.style,
        /**
        * Content container's style
        */
        contentContainerCustomStyle: Animated.View.propTypes.style,
        /**
         * Delta x when swiping to trigger the snap
         */
        swipeThreshold: PropTypes.number,
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
         * Scale factor of the inactive slides
         */
        inactiveSlideScale: PropTypes.number,
        /**
         * Opacity value of the inactive slides
         */
        inactiveSlideOpacity: PropTypes.number,
        /**
         * Index of the first item to display
         */
        firstItem: PropTypes.number,
        /**
         * Trigger autoplay
         */
        autoplay: PropTypes.bool,
        /**
         * Delay until navigating to the next item
         */
        autoplayInterval: PropTypes.number,
        /**
         * Delay before enabling autoplay on startup and
         * after releasing the touch
         */
        autoplayDelay: PropTypes.number,
        /**
         * If enabled, releasing the touch will scroll
         * to the center of the nearest/active item
         */
        enableSnap: PropTypes.bool,
        /**
         * If enabled, snapping will be triggered once
         * the ScrollView stops moving, not when the
         * user releases his finger
        */
        enableMomentum: PropTypes.bool,
        /**
         * Snapping on android is kinda choppy, especially
         * when swiping quickly so you can disable it
         */
        snapOnAndroid: PropTypes.bool,
        /**
         * Fired when snapping to an item
         */
        onSnapToItem: PropTypes.func
    };

    static defaultProps = {
        shouldOptimizeUpdates: true,
        autoplay: false,
        autoplayInterval: 3000,
        autoplayDelay: 5000,
        firstItem: 0,
        enableSnap: true,
        enableMomentum: true,
        snapOnAndroid: false,
        swipeThreshold: 20,
        animationFunc: 'timing',
        animationOptions: {
            easing: Easing.elastic(1)
        },
        slideStyle: {},
        containerCustomStyle: null,
        contentContainerCustomStyle: null,
        inactiveSlideScale: 0.9,
        inactiveSlideOpacity: 1
    }

    constructor (props) {
        super(props);
        this.state = {
            activeItem: props.firstItem
        };
        this._positions = [];
        this._calcCardPositions(props);
        this._onScroll = this._onScroll.bind(this);
        this._onScrollEnd = this._snapEnabled ? this._onScrollEnd.bind(this) : false;
        this._onScrollBegin = this._snapEnabled ? this._onScrollBegin.bind(this) : false;
        this._initInterpolators = this._initInterpolators.bind(this);
        this._onTouchRelease = this._onTouchRelease.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        // This bool aims at fixing an iOS bug due to scrolTo that triggers onMomentumScrollEnd.
        // onMomentumScrollEnd fires this._snapScroll, thus creating an infinite loop.
        this._ignoreNextMomentum = false;
    }

    componentDidMount () {
        const { firstItem, autoplay } = this.props;

        this._initInterpolators(this.props);
        setTimeout(() => {
            this.snapToItem(firstItem, false, false, true);
        }, 0);
        if (autoplay) {
            this.startAutoplay();
        }
    }

    shouldComponentUpdate (nextProps, nextState) {
        if (this.props.shouldOptimizeUpdates === false) {
            return true;
        } else {
            return shallowCompare(this, nextProps, nextState);
        }
    }

    componentWillReceiveProps (nextProps) {
        const { items, firstItem } = nextProps;

        if (items.length !== this.props.items.length) {
            this._positions = [];
            this._calcCardPositions(nextProps);
            this._initInterpolators(nextProps);
            this.setState({ activeItem: firstItem });
        }
    }

    componentWillUnmount () {
        this.stopAutoplay();
    }

    get _snapEnabled () {
        const { enableSnap, snapOnAndroid } = this.props;

        return enableSnap && (Platform.OS === 'ios' || snapOnAndroid);
    }

    get _nextItem () {
        const { activeItem } = this.state;

        return this._positions[activeItem + 1] ? activeItem + 1 : 0;
    }

    _calcCardPositions (props = this.props) {
        const { items, itemWidth } = props;

        items.forEach((item, index) => {
            this._positions[index] = {
                start: index * itemWidth
            };
            this._positions[index].end = this._positions[index].start + itemWidth;
        });
    }

    _initInterpolators (props = this.props) {
        const { items, firstItem } = props;
        let interpolators = [];

        items.forEach((item, index) => {
            interpolators.push(new Animated.Value(index === firstItem ? 1 : 0));
        });
        this.setState({ interpolators });
    }

    _getActiveItem (centerX, offset = 25) {
        for (let i = 0; i < this._positions.length; i++) {
            const { start, end } = this._positions[i];
            if (centerX + offset >= start && centerX - offset <= end) {
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
        const { animationFunc, animationOptions, enableMomentum } = this.props;
        const { activeItem } = this.state;
        const newActiveItem = this._getActiveItem(this._getCenterX(event));

        if (enableMomentum) {
            clearTimeout(this._snapNoMomentumTimeout);
        }

        if (activeItem !== newActiveItem) {
            Animated[animationFunc](
                this.state.interpolators[activeItem],
                { ...animationOptions, toValue: 0 }
            ).start();
            this.setState({ activeItem: newActiveItem });
            Animated[animationFunc](
                this.state.interpolators[newActiveItem],
                { ...animationOptions, toValue: 1 }
            ).start();
        }
    }

    _onScrollBegin (event) {
        this._scrollStartX = event.nativeEvent.contentOffset.x;
        this._scrollStartActive = this.state.activeItem;
        this._ignoreNextMomentum = false;
    }

    _onScrollEnd (event) {
        if (this._ignoreNextMomentum) {
            // iOS fix
            this._ignoreNextMomentum = false;
            return;
        }
        this._scrollEndX = event.nativeEvent.contentOffset.x;
        this._scrollEndActive = this.state.activeItem;

        const deltaX = this._scrollEndX - this._scrollStartX;

        if (this._snapEnabled) {
            this._snapScroll(deltaX);
        }
    }

    _onTouchMove () {
        if (this._autoplaying) {
            this.stopAutoplay();
        }
    }

    // Due to a bug, this event is only fired on iOS
    // https://github.com/facebook/react-native/issues/6791
    // it's fine since we're only fixing an iOS bug in it, so ...
    _onTouchRelease (event) {
        const { enableMomentum } = this.props;

        if (enableMomentum && Platform.OS === 'ios') {
            this._snapNoMomentumTimeout =
                setTimeout(() => {
                    this._snapScroll(0);
                }, 100);
        }
    }

    _snapScroll (deltaX) {
        const { swipeThreshold } = this.props;

        // When using momentum and releasing the touch with
        // no velocity, scrollEndActive will be undefined (iOS)
        if (!this._scrollEndActive && Platform.OS === 'ios') {
            this._scrollEndActive = this._scrollStartActive;
        }

        if (this._scrollStartActive !== this._scrollEndActive) {
            // Snap to the new active item
            this.snapToItem(this._scrollEndActive);
        } else {
            // Snap depending on delta
            if (deltaX > 0) {
                if (deltaX > swipeThreshold) {
                    this.snapToItem(this._scrollStartActive + 1);
                } else {
                    this.snapToItem(this._scrollEndActive);
                }
            } else if (deltaX < 0) {
                if (deltaX < -swipeThreshold) {
                    this.snapToItem(this._scrollStartActive - 1);
                } else {
                    this.snapToItem(this._scrollEndActive);
                }
            } else {
                // Snap to current
                this.snapToItem(this._scrollEndActive);
            }
        }
    }

    get items () {
        const { items, renderItem, slideStyle, inactiveSlideScale, inactiveSlideOpacity } = this.props;
        if (!this.state.interpolators || !this.state.interpolators.length) {
            return false;
        }

        return items.map((entry, index) => {
            const animatedValue = this.state.interpolators[index];
            return (
                <Animated.View
                  key={`carousel-item-${index}`}
                  style={[
                      slideStyle,
                      {transform: [{
                          scale: animatedValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [inactiveSlideScale, 1]
                          })
                      }],
                          opacity: animatedValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [inactiveSlideOpacity, 1]
                          })
                      }
                  ]}>
                    { renderItem(entry, index) }
                </Animated.View>
            );
        });
    }

    get currentIndex () {
        return this.state.activeItem;
    }

    startAutoplay (instantly = false) {
        const { autoplayInterval, autoplayDelay } = this.props;

        if (this._autoplaying) {
            return;
        }

        setTimeout(() => {
            this._autoplaying = true;
            this._autoplayInterval =
                setInterval(() => {
                    this.snapToItem(this._nextItem);
                }, autoplayInterval);
        }, instantly ? 0 : autoplayDelay);
    }

    stopAutoplay () {
        this._autoplaying = false;
        clearInterval(this._autoplayInterval);
    }

    snapToItem (index, animated = true, fireCallback = true, initial = false) {
        const { autoplayDelay, autoplay } = this.props;
        const itemsLength = this._positions.length;

        if (index >= itemsLength) {
            index = itemsLength - 1;
            fireCallback = false;
        } else if (index < 0) {
            index = 0;
            fireCallback = false;
        }

        const snapX = this._positions[index].start;

        // Make sure the component hasn't been unmounted
        if (this.refs.scrollview) {
            this.refs.scrollview.scrollTo({x: snapX, y: 0, animated});
            this.props.onSnapToItem && fireCallback && this.props.onSnapToItem(index, this.props.items[index]);

            // iOS fix, check the note in the constructor
            if (!initial && Platform.OS === 'ios') {
                this._ignoreNextMomentum = true;
            }
        }

        if (autoplay) {
            // Restart autoplay after a little while
            // This could be done when releasing touch
            // but the event is buggy on Android...
            clearTimeout(this._enableAutoplayTimeout);
            this._enableAutoplayTimeout =
                setTimeout(() => {
                    this.startAutoplay(true);
                }, autoplayDelay + 1000);
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

    render () {
        const { sliderWidth, itemWidth, containerCustomStyle, contentContainerCustomStyle, enableMomentum } = this.props;

        const containerSideMargin = (sliderWidth - itemWidth) / 2;
        const style = [
            { paddingHorizontal: Platform.OS === 'ios' ? containerSideMargin : 0 },
            containerCustomStyle || {}
        ];
        const contentContainerStyle = [
            { paddingHorizontal: Platform.OS === 'android' ? containerSideMargin : 0 },
            contentContainerCustomStyle || {}
        ];

        return (
            <ScrollView
              decelerationRate={0.9}
              style={style}
              contentContainerStyle={contentContainerStyle}
              ref={'scrollview'}
              horizontal={true}
              onScrollBeginDrag={this._onScrollBegin}
              onMomentumScrollEnd={enableMomentum ? this._onScrollEnd : undefined}
              onScrollEndDrag={!enableMomentum ? this._onScrollEnd : undefined}
              onResponderRelease={this._onTouchRelease}
              onResponderMove={this._onTouchMove}
              onMoveShouldSetResponder={() => true} // enables _onTouchMove on Android
              onScroll={this._onScroll}
              scrollEventThrottle={50}
              {...this.props}
              >
                { this.items }
            </ScrollView>
        );
    }
}
