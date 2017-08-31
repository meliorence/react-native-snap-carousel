import React, { PureComponent } from 'react';
import { View, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import PaginationDot from './PaginationDot';
import styles from './Pagination.style';

export default class Pagination extends PureComponent {

    static propTypes = {
        activeDotIndex: PropTypes.number.isRequired,
        dotsLength: PropTypes.number.isRequired,
        carouselRef: PropTypes.object,
        containerStyle: ViewPropTypes ? ViewPropTypes.style : View.propTypes.style,
        dotColor: PropTypes.string,
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

    get dots () {
        const {
            activeDotIndex,
            carouselRef,
            dotsLength,
            dotColor,
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
            return renderDots(activeDotIndex, dotsLength, this);
        }

        const DefaultDot = <PaginationDot
          carouselRef={carouselRef}
          tappable={tappableDots && typeof carouselRef !== 'undefined'}
          color={dotColor}
          style={dotStyle}
          inactiveColor={inactiveDotColor}
          inactiveOpacity={inactiveDotOpacity}
          inactiveScale={inactiveDotScale}
          inactiveStyle={inactiveDotStyle}
        />;

        let dots = [];

        for (let i = 0; i < dotsLength; i++) {
            const isActive = i === activeDotIndex;
            dots.push(React.cloneElement(
                (isActive ? dotElement : inactiveDotElement) || DefaultDot,
                {
                    key: `pagination-dot-${i}`,
                    active: i === activeDotIndex,
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
            { flexDirection: vertical ? 'column' : 'row' },
            containerStyle || {}
        ];

        return (
            <View pointerEvents={'box-none'} style={style}>
                { this.dots }
            </View>
        );
    }
}
