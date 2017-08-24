import React, { PureComponent } from 'react';
import { View, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import PaginationDot from './PaginationDot';
import styles from './Pagination.style';

export default class Pagination extends PureComponent {

    static propTypes = {
        activeDotIndex: PropTypes.number.isRequired,
        dotsLength: PropTypes.number.isRequired,
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
        vertical: PropTypes.bool
    };

    static defaultProps = {
        inactiveDotOpacity: 0.5,
        inactiveDotScale: 0.5,
        vertical: false
    }

    get dots () {
        const {
            activeDotIndex,
            dotsLength,
            dotColor,
            dotElement,
            dotStyle,
            inactiveDotColor,
            inactiveDotElement,
            inactiveDotOpacity,
            inactiveDotScale,
            inactiveDotStyle,
            renderDots
        } = this.props;

        if (renderDots) {
            return renderDots(activeDotIndex, dotsLength, this);
        }

        const DefaultDot = <PaginationDot
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
                    active: i === activeDotIndex
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
            <View
              pointerEvents={'none'}
              style={style}
            >
                { this.dots }
            </View>
        );
    }
}
