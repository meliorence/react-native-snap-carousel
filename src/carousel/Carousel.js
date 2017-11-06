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
        inactiveSlideShift: PropTypes.number,
        lockScrollWhileSnapping: PropTypes.bool,
        loop: PropTypes.bool,
        loopClonesPerSide: PropTypes.number,
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
        inactiveSlideShift: 0,
        lockScrollWhileSnapping: false,
        loop: false,
        loopClonesPerSide: 3,
        slideStyle: {},
        shouldOptimizeUpdates: true,
        swipeThreshold: 20,
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

        this._positions = [];
        this._currentContentOffset = 0; // store ScrollView's scroll position
        this._canFireCallback = false;
        this._scrollOffsetRef = null;
        this._onScrollTriggered = true; // used when momentum is enabled to prevent an issue with edges items
        this._scrollEnabled = props.scrollEnabled === false ? false : true;

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
        const { interpolators } = this.state;
        const { firstItem, itemHeight, itemWidth, sliderHeight, sliderWidth } = nextProps;
        const itemsLength = this._getCustomDataLength(nextProps);

        if (!itemsLength) {
            return;
        }

        const nextFirstItem = this._getFirstItem(firstItem, nextProps);
        let nextActiveItem = this._activeItem || this._activeItem === 0 ? this._activeItem : nextFirstItem;

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
            this._activeItem = nextActiveItem;
            this._previousItemsLength = itemsLength;

            this._initPositionsAndInterpolators(nextProps);

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
            this._snapToItem(nextFirstItem, true, true, false, false);
        }
    }

    componentWillUnmount () {
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

    _shouldAnimateSlides (props = this.props) {
        const { inactiveSlideOpacity, inactiveSlideScale, inactiveSlideShift } = props;
        return inactiveSlideOpacity < 1 || inactiveSlideScale < 1 || inactiveSlideShift !== 0;
    }

    _needsRTLAdaptations () {
        const { vertical } = this.props;
        return IS_RTL && !IS_IOS && !vertical;
    }

    _canLockScroll () {
        const { enableMomentum, lockScrollWhileSnapping } = this.props;
        return !enableMomentum && lockScrollWhileSnapping;
    }

    _enableLoop () {
        const { data, enableSnap, loop } = this.props;
        return enableSnap && loop && data.length && data.length > 1;
    }

    _getCustomData (props = this.props) {
        const { data, loopClonesPerSide } = props;
        const dataLength = data.length;

        if (!data || !dataLength) {
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

    _getScrollEnabled () {
        return this._scrollEnabled;
    }

    _setScrollEnabled (value = true) {
        if (this.props.scrollEnabled === false || !this._flatlist || !this._flatlist.setNativeProps) {
            return;
        }

        // 'setNativeProps()' is used instead of 'setState()' because the latter
        // really takes a toll on Android behavior when momentum is disabled
        this._flatlist.setNativeProps({ scrollEnabled: value });
        this._scrollEnabled = value;
    }

    _getKeyExtractor (item, index) {
        return `carousel-item-${index}`;
    }

    _getScrollOffset (event) {
        const { vertical } = this.props;
        return (event && event.nativeEvent && event.nativeEvent.contentOffset &&
            Math.round(event.nativeEvent.contentOffset[vertical ? 'y' : 'x'])) || 0;
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

    _didMountDelayedInit () {
        const { firstItem, autoplay } = this.props;
        const _firstItem = this._getFirstItem(firstItem);

        this._snapToItem(_firstItem, false, false, true, false);
        this._hackActiveSlideAnimation(_firstItem, 'start', true);
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

        this._getCustomData(props).forEach((itemData, index) => {
            const _index = this._getCustomIndex(index, props);
            const start = (_index - 1) * sizeRef;
            const middle = _index * sizeRef;
            const end = (_index + 1) * sizeRef;
            const animatedValue = this._shouldAnimateSlides(props) ? this._scrollPos.interpolate({
                inputRange: [start, middle, end],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp'
            }) : 1;

            this._positions[index] = {
                start: index * sizeRef,
                end: index * sizeRef + sizeRef
            };

            interpolators.push(animatedValue);
        });

        this.setState({ interpolators });
    }

    _hackActiveSlideAnimation (index, goTo, force = false) {
        const { data } = this.props;

        if (IS_IOS || !this._flatlist || !this._positions[index] || (!force && this._enableLoop())) {
            return;
        }

        const offset = this._positions[index] && this._positions[index].start;

        if (!offset && offset !== 0) {
            return;
        }

        const itemsLength = data && data.length;
        const direction = goTo || itemsLength === 1 ? 'start' : 'end';

        this._flatlist && this._flatlist._listRef && this._flatlist.scrollToOffset({
            offset: offset + (direction === 'start' ? -1 : 1),
            animated: false
        });

        clearTimeout(this._hackSlideAnimationTimeout);
        this._hackSlideAnimationTimeout = setTimeout(() => {
            // https://github.com/facebook/react-native/issues/10635
            this._flatlist && this._flatlist._listRef && this._flatlist.scrollToOffset({
                offset: offset,
                animated: false
            });
        }, 50); // works randomly when set to '0'
    }

    _lockScroll () {
        clearTimeout(this._lockScrollTimeout);
        this._lockScrollTimeout = setTimeout(() => {
            this._releaseScroll();
        }, 1000);
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

    _onScroll (event) {
        const { enableMomentum, onScroll, callbackOffsetMargin } = this.props;

        const scrollOffset = event ? this._getScrollOffset(event) : this._currentContentOffset;
        const nextActiveItem = this._getActiveItem(scrollOffset);
        const scrollConditions = nextActiveItem === this._itemToSnapTo &&
            scrollOffset >= this._scrollOffsetRef - callbackOffsetMargin &&
            scrollOffset <= this._scrollOffsetRef + callbackOffsetMargin;

        this._currentContentOffset = scrollOffset;
        this._onScrollTriggered = true;

        if (enableMomentum) {
            clearTimeout(this._snapNoMomentumTimeout);

            if (this._activeItem !== nextActiveItem) {
                this._activeItem = nextActiveItem;
            }

            if (scrollConditions && this._canFireCallback) {
                this._onSnap(this._getDataIndex(nextActiveItem));
            }
        } else if (scrollConditions && this._activeItem !== nextActiveItem) {
            this._activeItem = nextActiveItem;

            if (this._canLockScroll()) {
                this._releaseScroll();
            }

            if (this._canFireCallback) {
                this._onSnap(this._getDataIndex(nextActiveItem));
            }
        }

        if (nextActiveItem === this._itemToSnapTo &&
            scrollOffset === this._scrollOffsetRef) {
            this._repositionScroll(nextActiveItem);
        }

        if (onScroll && event) {
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
        // `onTouchStart` is fired even when `scrollEnabled` is set to `false`
        if (this._getScrollEnabled() !== false && this._autoplaying) {
            this.stopAutoplay();
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
        const { enableMomentum, onSnapToItem } = this.props;
        const itemsLength = this._getCustomDataLength();

        if (!itemsLength || !this._flatlist || !this._flatlist._listRef) {
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

            if (onSnapToItem && fireCallback) {
                this._canFireCallback = true;
            }
        }

        this._itemToSnapTo = index;
        this._scrollOffsetRef = this._positions[index] && this._positions[index].start;
        this._onScrollTriggered = false;

        if (!this._scrollOffsetRef && this._scrollOffsetRef !== 0) {
            return;
        }

        this._flatlist && this._flatlist._listRef && this._flatlist.scrollToOffset({
            offset: this._scrollOffsetRef,
            animated
        });

        if (enableMomentum) {
            // iOS fix, check the note in the constructor
            if (IS_IOS && !initial) {
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

    _onSnap (index) {
        const { onSnapToItem } = this.props;

        if (!this._flatlist) {
            return;
        }

        this._canFireCallback = false;
        onSnapToItem && onSnapToItem(index);
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

    snapToItem (index, animated = true) {
        if (!index || index < 0) {
            index = 0;
        }

        const positionIndex = this._getPositionIndex(index);

        if (positionIndex === this._activeItem) {
            return;
        }

        this._snapToItem(positionIndex, animated);
    }

    snapToNext (animated = true) {
        const itemsLength = this._getCustomDataLength();

        let newIndex = this._activeItem + 1;
        if (newIndex > itemsLength - 1) {
            if (!this._enableLoop()) {
                return;
            }
            newIndex = 0;
        }
        this._snapToItem(newIndex, animated);
    }

    snapToPrev (animated = true) {
        const itemsLength = this._getCustomDataLength();

        let newIndex = this._activeItem - 1;
        if (newIndex < 0) {
            if (!this._enableLoop()) {
                return;
            }
            newIndex = itemsLength - 1;
        }
        this._snapToItem(newIndex, animated);
    }

    _renderItem ({ item, index }) {
        const { interpolators } = this.state;
        const {
            inactiveSlideShift,
            hasParallaxImages,
            inactiveSlideScale,
            inactiveSlideOpacity,
            itemWidth,
            itemHeight,
            renderItem,
            sliderHeight,
            sliderWidth,
            slideStyle,
            vertical
        } = this.props;

        const animatedValue = interpolators && interpolators[index];

        if (!animatedValue && animatedValue !== 0) {
            return false;
        }

        const animate = this._shouldAnimateSlides();
        const Component = animate ? Animated.View : View;
        const translateProp = vertical ? 'translateX' : 'translateY';

        const animatedStyle = animate ? {
            opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [inactiveSlideOpacity, 1]
            }),
            transform: [{
                scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [inactiveSlideScale, 1]
                })
            }, {
                [translateProp]: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [inactiveSlideShift, 0]
                })
            }]
        } : {};

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
            <Component style={[slideStyle, animatedStyle]} pointerEvents={'box-none'}>
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
            itemWidth,
            itemHeight,
            keyExtractor,
            loopClonesPerSide,
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
        const initialNumPerSide = this._enableLoop() ? loopClonesPerSide : 2;
        const initialNumToRender = visibleItems + (initialNumPerSide * 2);
        const maxToRenderPerBatch = 1 + (initialNumToRender * 2);
        const windowSize = maxToRenderPerBatch;

        return (
            <AnimatedFlatList
              decelerationRate={enableMomentum ? 0.9 : 'fast'}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              overScrollMode={'never'}
              automaticallyAdjustContentInsets={false}
              directionalLockEnabled={true}
              pinchGestureEnabled={false}
              scrollsToTop={false}
              initialNumToRender={initialNumToRender}
              maxToRenderPerBatch={maxToRenderPerBatch}
              windowSize={windowSize}
              // updateCellsBatchingPeriod
              // renderToHardwareTextureAndroid={true}
              removeClippedSubviews={true}
              inverted={this._needsRTLAdaptations()}
              {...this.props}
              ref={(c) => { if (c) { this._flatlist = c._component; } }}
              data={this._getCustomData()}
              renderItem={this._renderItem}
              // extraData={this.state}
              getItemLayout={undefined} // see #193
              initialScrollIndex={undefined} // see #193
              keyExtractor={keyExtractor || this._getKeyExtractor}
              numColumns={1}
              style={containerStyle}
              contentContainerStyle={contentContainerStyle}
              horizontal={!vertical}
              scrollEventThrottle={1}
              onScroll={this._onScrollHandler}
              onScrollBeginDrag={this._onScrollBeginDrag}
              onScrollEndDrag={this._onScrollEndDrag}
              onMomentumScrollEnd={this._onMomentumScrollEnd}
              onResponderRelease={this._onTouchRelease}
              onStartShouldSetResponderCapture={this._onStartShouldSetResponderCapture}
              onTouchStart={this._onTouchStart}
              onLayout={this._onLayout}
            />
        );
    }
}
