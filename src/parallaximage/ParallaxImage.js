// Inspired by https://github.com/oblador/react-native-parallax/

import React, { Component } from 'react';
import { View, ViewPropTypes, Animated, findNodeHandle } from 'react-native';
import PropTypes from 'prop-types';
import styles from './ParallaxImage.style';

export default class ParallaxImage extends Component {

    static propTypes = {
        carouselRef: PropTypes.object,
        containerStyle: ViewPropTypes.style,
        dimensions: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number
        }),
        image: PropTypes.element,
        itemHeight: PropTypes.number,
        itemWidth: PropTypes.number,
        parallaxFactor: PropTypes.number,
        sliderHeight: PropTypes.number,
        sliderWidth: PropTypes.number,
        scrollPosition: PropTypes.object,
        vertical: PropTypes.bool
    };

    static defaultProps = {
        containerStyle: {},
        parallaxFactor: 0.3
    }

    constructor (props) {
        super(props);
        this.state = {
            offset: 0,
            width: 0,
            height: 0
        };
    }

    setNativeProps (nativeProps) {
        this._container.setNativeProps(nativeProps);
    }

    componentDidMount () {
        setTimeout(() => {
            this._measureLayout();
        }, 0);
    }

    _measureLayout () {
        if (this._container) {
            const {
                dimensions,
                vertical,
                carouselRef,
                sliderWidth,
                sliderHeight,
                itemWidth,
                itemHeight
            } = this.props;

            if (carouselRef) {
                this._container.measureLayout(
                    findNodeHandle(carouselRef),
                    (x, y, width, height, pageX, pageY) => {
                        const offset = vertical ?
                            y - ((sliderHeight - itemHeight) / 2) :
                            x - ((sliderWidth - itemWidth) / 2);

                        if (dimensions) {
                            this.setState({
                                offset: offset
                            });
                        } else {
                            this.setState({
                                offset: offset,
                                width: Math.ceil(width),
                                height: Math.ceil(height)
                            });
                        }
                    }
                );
            }
        }
    }

    render () {
        const { offset } = this.state;
        const {
            scrollPosition,
            dimensions,
            vertical,
            sliderWidth,
            sliderHeight,
            parallaxFactor,
            style,
            containerStyle,
            image,
            ...other
        } = this.props;

        const width = dimensions ? dimensions.width : this.state.width;
        const height = dimensions ? dimensions.height : this.state.height;

        const parallaxPadding = (vertical ? height : width) * parallaxFactor;
        const parallaxStyle = {
            width: vertical ? width : width + parallaxPadding * 2,
            height: vertical ? height + parallaxPadding * 2 : height,
            transform: scrollPosition ? [
                {
                    translateX: !vertical ? scrollPosition.interpolate({
                        inputRange: [offset - sliderWidth, offset + sliderWidth],
                        outputRange: [-parallaxPadding, parallaxPadding],
                        extrapolate: 'clamp'
                    }) : 0
                },
                {
                    translateY: vertical ? scrollPosition.interpolate({
                        inputRange: [offset - sliderHeight, offset + sliderHeight],
                        outputRange: [-parallaxPadding, parallaxPadding],
                        extrapolate: 'clamp'
                    }) : 0
                }
            ] : []
        };

        return (
            <View
              ref={(c) => { this._container = c; }}
              pointerEvents={'none'}
              style={[containerStyle, styles.container]}
              onLayout={this._measureLayout}
            >
                <Animated.Image
                  {...other}
                  style={[style, styles.image, parallaxStyle]}
                />
            </View>
        );
    }
}
