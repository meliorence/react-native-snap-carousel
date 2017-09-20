import React, { Component } from 'react';
import { View, FlatList, Animated, Platform, I18nManager, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import shallowCompare from 'react-addons-shallow-compare';

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
        slideStyle: Animated.View.propTypes.style,
        shouldOptimizeUpdates: PropTypes.bool,
        swipeThreshold: PropTypes.number,
        vertical: PropTypes.bool,
        onSnapToItem: PropTypes.func
    };

    static defaultProps = {
        activeSlideAlignment: 'center',
        activeSlideOffset: 20,
        apparitionDelay: 250,
        autoplay: false,
        autoplayDelay: 5000,
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
        slideStyle: {},
        shouldOptimizeUpdates: true,
        swipeThreshold: 20,
        vertical: false
    }

    constructor (props) {
        super(props);

        const initialActiveItem = this._getFirstItem(props.firstItem);
        this.state = {
            activeItem: initialActiveItem,
            previousActiveItem: initialActiveItem,
            previousFirstItem: initialActiveItem,
            previousItemsLength: initialActiveItem,
            hideCarousel: true,
            interpolators: []
        };

        this._positions = [];
        this._currentContentOffset = 0; // store ScrollView's scroll position
        this._canFireCallback = false; // used only when `enableMomentum` is set to `false`
        this._scrollOffsetRef = null; // used only when `enableMomentum` is set to `false`

        this._getItemLayout = this._getItemLayout.bind(this);
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
        this._onTouchRelease = this._onTouchRelease.bind(this);

        // Native driver for scroll events
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
        const { apparitionDelay } = this.props;

        this._initPositionsAndInterpolators();

        if (apparitionDelay) {
            // Hide FlatList's awful init
            this._apparitionTimeout = setTimeout(() => {
                this._didMountDelayedInit();
            }, apparitionDelay);
        } else {
            this._didMountDelayedInit();
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
        const { activeItem, interpolators, previousFirstItem, previousItemsLength } = this.state;
        const { data, firstItem, itemHeight, itemWidth, sliderHeight, sliderWidth } = nextProps;

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

        // Prevent issues with dynamically removed items
        if (nextActiveItem > itemsLength - 1) {
            nextActiveItem = itemsLength - 1;
        }

        if (interpolators.length !== itemsLength || hasNewSliderWidth ||
            hasNewSliderHeight || hasNewItemWidth || hasNewItemHeight) {
            this.setState({
                activeItem: nextActiveItem,
                previousItemsLength: itemsLength
            }, () => {
                this._initPositionsAndInterpolators(nextProps);

                // Handle scroll issue when dynamically removing items (see #133)
                // This also fixes first item's active state on Android
                // Because 'initialScrollIndex' apparently doesn't trigger scroll
                if (previousItemsLength > itemsLength) {
                    this._hackActiveSlideAnimation(nextActiveItem);
                }

                if (hasNewSliderWidth || hasNewSliderHeight || hasNewItemWidth || hasNewItemHeight) {
                    this.snapToItem(nextActiveItem, false, false);
                }
            });
        } else if (nextFirstItem !== previousFirstItem && nextFirstItem !== activeItem) {
            this.setState({
                activeItem: nextFirstItem,
                previousFirstItem: nextFirstItem
            }, () => {
                this.snapToItem(nextFirstItem);
            });
        }
    }

    componentWillUnmount () {
        this.stopAutoplay();
        clearTimeout(this._apparitionTimeout);
        clearTimeout(this._hackSlideAnimationTimeout);
        clearTimeout(this._enableAutoplayTimeout);
        clearTimeout(this._autoplayTimeout);
        clearTimeout(this._snapNoMomentumTimeout);
        clearTimeout(this._scrollToTimeout);
    }

    get currentIndex () {
        return this.state.activeItem;
    }

    get currentScrollPosition () {
        return this._currentContentOffset;
    }

    _shouldAnimateSlides (props = this.props) {
        const { inactiveSlideOpacity, inactiveSlideScale } = props;
        return inactiveSlideOpacity < 1 || inactiveSlideScale < 1;
    }

    _needsRTLAdaptations () {
        const { vertical } = this.props;
        return IS_RTL && !IS_IOS && !vertical;
    }

    _getCustomIndex (index, props = this.props) {
        const itemsLength = props.data && props.data.length;

        if (!itemsLength || (!index && index !== 0)) {
            return 0;
        }

        return this._needsRTLAdaptations() ? itemsLength - index - 1 : index;
    }

    _getFirstItem (index, props = this.props) {
        const itemsLength = props.data && props.data.length;

        if (!itemsLength || index > itemsLength - 1 || index < 0) {
            return 0;
        }

        return index;
    }

    _didMountDelayedInit () {
        const { firstItem, autoplay } = this.props;
        const _firstItem = this._getFirstItem(firstItem);

        this.snapToItem(_firstItem, false, false, true);
        this._hackActiveSlideAnimation(_firstItem, 'start');
        this.setState({ hideCarousel: false });

        if (autoplay) {
            this.startAutoplay();
        }
    }

    _initPositionsAndInterpolators (props = this.props) {
        const { data, itemWidth, itemHeight, vertical } = props;
        const sizeRef = vertical ? itemHeight : itemWidth;

        if (!data.length) {
            return;
        }

        let interpolators = [];
        this._positions = [];

        data.forEach((itemData, index) => {
            const _index = this._getCustomIndex(index, props);
            const start = (_index - 1) * sizeRef;
            const middle = _index * sizeRef;
            const end = (_index + 1) * sizeRef;
            const value = this._shouldAnimateSlides(props) ? this._scrollPos.interpolate({
                inputRange: [start, middle, end],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp'
            }) : 1;

            this._positions[index] = {
                start: index * sizeRef,
                end: index * sizeRef + sizeRef
            };

            interpolators.push({
                opacity: value,
                scale: value
            });
        });

        this.setState({ interpolators });
    }

    _hackActiveSlideAnimation (index, goTo) {
        const { data, vertical } = this.props;

        if (IS_IOS || !this._flatlist || !this._positions[index]) {
            return;
        }

        const itemsLength = data && data.length;
        const direction = goTo || itemsLength === 1 ? 'start' : 'end';
        const offset = this._positions[index].start;
        const commonOptions = {
            horizontal: !vertical,
            animated: false
        };

        this._flatlist.scrollToOffset({
            offset: offset + (direction === 'start' ? -1 : 1),
            ...commonOptions
        });

        this._hackSlideAnimationTimeout = setTimeout(() => {
            this._flatlist.scrollToOffset({
                offset: offset,
                ...commonOptions
            });
        }, 50); // works randomly when set to '0'
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

    _getViewportOffet () {
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
        return offset + this._getViewportOffet() - this._getContainerInnerMargin();
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

    _onScroll (event) {
        const { activeItem } = this.state;
        const { enableMomentum, onScroll, callbackOffsetMargin } = this.props;

        const scrollOffset = this._getScrollOffset(event);
        const nextActiveItem = this._getActiveItem(scrollOffset);

        this._currentContentOffset = scrollOffset;

        if (activeItem !== nextActiveItem) {
            this.setState({ activeItem: nextActiveItem });
        }

        if (enableMomentum) {
            clearTimeout(this._snapNoMomentumTimeout);
        }

        if (!enableMomentum &&
            this._canFireCallback &&
            nextActiveItem === this._itemToSnapTo &&
            (scrollOffset >= this._scrollOffsetRef - callbackOffsetMargin ||
            scrollOffset <= this._scrollOffsetRef + callbackOffsetMargin)) {
            this._canFireCallback = false;
            this._onSnap(nextActiveItem);
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

        if (this._flatlist) {
            this._onScrollEnd && this._onScrollEnd();
        }

        if (onScrollEndDrag) {
            onScrollEndDrag(event);
        }
    }

    // Used when `enableMomentum` is ENABLED
    _onMomentumScrollEnd (event) {
        const { onMomentumScrollEnd } = this.props;

        if (this._flatlist) {
            this._onScrollEnd && this._onScrollEnd();
        }

        if (onMomentumScrollEnd) {
            onMomentumScrollEnd(event);
        }
    }

    _onScrollEnd (event) {
        const { autoplay, enableSnap } = this.props;

        if (this._ignoreNextMomentum) {
            // iOS fix
            this._ignoreNextMomentum = false;
            return;
        }

        this._scrollEndOffset = this._currentContentOffset;
        this._scrollEndActive = this._getActiveItem(this._scrollEndOffset);

        if (enableSnap) {
            this._snapScroll(this._scrollEndOffset - this._scrollStartOffset);
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

        this._initPositionsAndInterpolators();
        this.snapToItem(this.currentIndex, false, false);

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
            this.snapToItem(this._scrollEndActive);
        } else {
            // Snap depending on delta
            if (delta > 0) {
                if (delta > swipeThreshold) {
                    this.snapToItem(this._scrollStartActive + 1);
                } else {
                    this.snapToItem(this._scrollEndActive);
                }
            } else if (delta < 0) {
                if (delta < -swipeThreshold) {
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

    _onSnap (index) {
        const { onSnapToItem } = this.props;

        if (this._flatlist) {
            onSnapToItem && onSnapToItem(index);
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
        const { data, enableMomentum, onSnapToItem } = this.props;
        const itemsLength = data.length;

        if (!itemsLength || !this._flatlist) {
            return;
        }

        if (!index || index < 0) {
            index = 0;
        } else if (itemsLength > 0 && index >= itemsLength) {
            index = itemsLength - 1;
        }

        if (index === previousActiveItem) {
            fireCallback = false;
        }

        if (!enableMomentum) {
            this._scrollOffsetRef = this._positions[index] && this._positions[index].start;

            // 'scrollEndDrag' might be fired when "peaking" to another item. We need to
            // make sure that callback is fired when scrolling back to the right one.
            this._itemToSnapTo = index;

            // Callback needs to be fired while scrolling when relying on 'scrollEndDrag'.
            // Thus we need a flag to make sure that it's going to be called only once.
            if (onSnapToItem && fireCallback) {
                this._canFireCallback = true;
            }
        }

        this.setState({ previousActiveItem: index }, () => {
            this._flatlist.scrollToIndex({
                index,
                viewPosition: 0,
                viewOffset: 0,
                animated
            });

            // Android hack since `onScroll` sometimes seems to not be triggered
            this._hackActiveSlideAnimation(index);

            if (enableMomentum) {
                // iOS fix, check the note in the constructor
                if (!initial && IS_IOS) {
                    this._ignoreNextMomentum = true;
                }

                // Callback can be fired here when relying on 'onMomentumScrollEnd'
                if (fireCallback) {
                    this._onSnap(index);
                }
            }
        });
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

        const animate = this._shouldAnimateSlides();
        const Component = animate ? Animated.View : View;
        const animatedStyle = {
            opacity: animate ? animatedValue.opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [inactiveSlideOpacity, 1]
            }) : 1,
            transform: [{
                scale: animate ? animatedValue.scale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [inactiveSlideScale, 1]
                }) : 1
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
            <Component style={[slideStyle, animatedStyle]} pointerEvents="box-none">
                { renderItem({ item, index }, parallaxProps) }
            </Component>
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
            itemWidth,
            itemHeight,
            keyExtractor,
            renderItem,
            sliderWidth,
            sliderHeight,
            style,
            vertical
        } = this.props;

        if (!data || !renderItem) {
            return false;
        }

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
            <AnimatedFlatList
              decelerationRate={enableMomentum ? 0.9 : 'fast'}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              overScrollMode={'never'}
              directionalLockEnabled={true}
              automaticallyAdjustContentInsets={false}
              scrollsToTop={false}
              initialNumToRender={visibleItems + 5}
              maxToRenderPerBatch={enableMomentum ? visibleItems * 2 : 5}
              windowSize={enableMomentum ? Math.max(11, (visibleItems * 2) + 1) : 11}
              // updateCellsBatchingPeriod
              {...this.props}
              ref={(c) => { if (c) { this._flatlist = c._component; } }}
              data={data}
              renderItem={this._renderItem}
              // extraData={this.state}
              getItemLayout={this._getItemLayout}
              keyExtractor={keyExtractor || this._getKeyExtractor}
              initialScrollIndex={firstItem || undefined}
              numColumns={1}
              style={containerStyle}
              contentContainerStyle={contentContainerStyle}
              horizontal={!vertical}
              inverted={this._needsRTLAdaptations()}
              scrollEventThrottle={1}
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
