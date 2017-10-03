import React, { PureComponent } from 'react';
import { I18nManager, Platform, View, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import PaginationDot from './PaginationDot';
import styles from './Pagination.style';

const IS_IOS = Platform.OS === 'ios';
const IS_RTL = I18nManager.isRTL;

export default class Pagination extends PureComponent {

    static propTypes = {
        activeDotIndex: PropTypes.number.isRequired,
        dotsLength: PropTypes.number.isRequired,
        activeOpacity: PropTypes.number,
        carouselRef: PropTypes.object,
        containerStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        dotColor: PropTypes.string,
        dotContainerStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        dotElement: PropTypes.element,
        dotStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        inactiveDotColor: PropTypes.string,
        inactiveDotElement: PropTypes.element,
        inactiveDotOpacity: PropTypes.number,
        inactiveDotScale: PropTypes.number,
        inactiveDotStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        renderDots: PropTypes.func,
        tappableDots: PropTypes.bool,
        vertical: PropTypes.bool
    };

    static defaultProps = {
        inactiveDotOpacity: 0.5,
        inactiveDotScale: 0.5,
        tappableDots: false,
        vertical: false
    }

    constructor (props) {
        super(props);

        // Warnings
        if ((props.dotColor && !props.inactiveDotColor) || (!props.dotColor && props.inactiveDotColor)) {
            console.warn(
                'react-native-snap-carousel | Pagination: ' +
                'You need to specify both `dotColor` and `inactiveDotColor`'
            );
        }
        if ((props.dotElement && !props.inactiveDotElement) || (!props.dotElement && props.inactiveDotElement)) {
            console.warn(
                'react-native-snap-carousel | Pagination: ' +
                'You need to specify both `dotElement` and `inactiveDotElement`'
            );
        }
        if (props.tappableDots && !props.carouselRef) {
            console.warn(
                'react-native-snap-carousel | Pagination: ' +
                'You must specify prop `carouselRef` when setting `tappableDots` to `true`'
            );
        }
    }

    _needsRTLAdaptations () {
        const { vertical } = this.props;
        return IS_RTL && !IS_IOS && !vertical;
    }

    get _activeDotIndex () {
        const { activeDotIndex, dotsLength } = this.props;
        return this._needsRTLAdaptations() ? dotsLength - activeDotIndex - 1 : activeDotIndex;
    }

    get dots () {
        const {
            activeOpacity,
            carouselRef,
            dotsLength,
            dotColor,
            dotContainerStyle,
            dotElement,
            dotStyle,
            inactiveDotColor,
            inactiveDotElement,
            inactiveDotOpacity,
            inactiveDotScale,
            inactiveDotStyle,
            renderDots,
            tappableDots
        } = this.props;

        if (renderDots) {
            return renderDots(this._activeDotIndex, dotsLength, this);
        }

        const DefaultDot = <PaginationDot
          carouselRef={carouselRef}
          tappable={tappableDots && typeof carouselRef !== 'undefined'}
          activeOpacity={activeOpacity}
          color={dotColor}
          containerStyle={dotContainerStyle}
          style={dotStyle}
          inactiveColor={inactiveDotColor}
          inactiveOpacity={inactiveDotOpacity}
          inactiveScale={inactiveDotScale}
          inactiveStyle={inactiveDotStyle}
        />;

        let dots = [];

        for (let i = 0; i < dotsLength; i++) {
            const isActive = i === this._activeDotIndex;
            dots.push(React.cloneElement(
                (isActive ? dotElement : inactiveDotElement) || DefaultDot,
                {
                    key: `pagination-dot-${i}`,
                    active: i === this._activeDotIndex,
                    index: i
                }
            ));
        }

        return dots;
    }

    render () {
        const { dotsLength, containerStyle, vertical } = this.props;

        if (!dotsLength || dotsLength < 2) {
            return false;
        }

        const style = [
            styles.sliderPagination,
            { flexDirection: vertical ?
                'column' :
                (this._needsRTLAdaptations() ? 'row-reverse' : 'row')
            },
            containerStyle || {}
        ];

        return (
            <View pointerEvents={'box-none'} style={style}>
                { this.dots }
            </View>
        );
    }
}
