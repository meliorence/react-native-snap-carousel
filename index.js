import React, { Component, PropTypes } from 'react';
import { ScrollView, Animated, Platform, Easing } from 'react-native';

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
        slideStyle: PropTypes.number.isRequired,
        /**
        * Global wrapper's style
        */
        containerCustomStyle: PropTypes.number,
        /**
        * Content container's style
        */
        contentContainerCustomStyle: PropTypes.number,
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
        autoplay: false,
        autoplayInterval: 3000,
        autoplayDelay: 5000,
        firstItem: 0,
        enableSnap: true,
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
        this._onScrollEndDrag = this._snapEnabled ? this._onScrollEndDrag.bind(this) : false;
        this._onScrollBegin = this._snapEnabled ? this._onScrollBegin.bind(this) : false;
        this._initInterpolators = this._initInterpolators.bind(this);
        this._onTouchRelease = props.autoplay ? this._onTouchRelease.bind(this) : undefined;
        this._onTouchMove = props.autoplay ? this._onTouchMove.bind(this) : undefined;
    }

    componentDidMount () {
        const { firstItem, autoplay } = this.props;

        this._initInterpolators(this.props);
        setTimeout(() => {
            this.snapToItem(firstItem, false, false);
        }, 0);
        if (autoplay) {
            this.startAutoplay();
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
        const { items, sliderWidth, itemWidth } = props;

        items.forEach((item, index) => {
            this._positions[index] = {
                start: index * itemWidth
            };
            this._positions[index].end = this._positions[index].start + itemWidth;
        });
    }

    _initInterpolators () {
        const { items, firstItem } = this.props;
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
        const { animationFunc, animationOptions } = this.props;
        const { activeItem } = this.state;
        const newActiveItem = this._getActiveItem(this._getCenterX(event));

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
    }

    _onScrollEndDrag (event) {
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
        clearTimeout(this._enableAutoplayTimeout);
    }

    _onTouchRelease () {
        const { autoplayDelay } = this.props;

        setTimeout(() => {
            this._enableAutoplayTimeout =
                setTimeout(() => {
                    this.startAutoplay(true);
                }, autoplayDelay);
        }, 1000);
    }

    _snapScroll (deltaX) {
        const { swipeThreshold } = this.props;

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

    snapToItem (index, animated = true, fireCallback = true) {
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
        }

    }

    render () {
        const { sliderWidth, itemWidth, containerCustomStyle, contentContainerCustomStyle } = this.props;

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
              {...this.props}
              style={style}
              contentContainerStyle={contentContainerStyle}
              ref={'scrollview'}
              horizontal={true}
              onScrollBeginDrag={this._onScrollBegin}
              onScrollEndDrag={this._onScrollEndDrag}
              onResponderRelease={this._onTouchRelease}
              onResponderMove={this._onTouchMove}
              onScroll={this._onScroll}
              scrollEventThrottle={50}
              >
                { this.items }
            </ScrollView>
        );
    }
}
