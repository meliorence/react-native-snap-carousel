import React, { Component } from 'react';
import { Animated, Easing, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import styles from './Pagination.style';

export default class PaginationDot extends Component {

    static propTypes = {
        active: PropTypes.bool,
        style: ViewPropTypes.style,
        inactiveOpacity: PropTypes.number,
        inactiveScale: PropTypes.number
    };

    static defaultProps = {
        inactiveOpacity: 0.5,
        inactiveScale: 0.5
    }

    constructor (props) {
        super(props);
        this.state = {
            animOpacity: new Animated.Value(0),
            animTransform: new Animated.Value(0)
        };
    }

    componentDidMount () {
        if (this.props.active) {
            this._animate(1);
        }
    }

    componentWillReceiveProps (nextProps) {
        if (nextProps.active !== this.props.active) {
            this._animate(nextProps.active ? 1 : 0);
        }
    }

    _animate (toValue = 0) {
        const { animOpacity, animTransform } = this.state;

        Animated.parallel([
            Animated.timing(animOpacity, {
                toValue,
                duration: 250,
                easing: Easing.linear,
                isInteraction: false,
                useNativeDriver: true
            }),
            Animated.spring(animTransform, {
                toValue,
                friction: 4,
                tension: 50,
                isInteraction: false,
                useNativeDriver: true
            })
        ]).start();
    }

    render () {
        const { animOpacity, animTransform } = this.state;
        const { style, inactiveOpacity, inactiveScale } = this.props;

        const animatedStyle = {
            opacity: animOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [inactiveOpacity, 1]
            }),
            transform: [{
                scale: animTransform.interpolate({
                    inputRange: [0, 1],
                    outputRange: [inactiveScale, 1]
                })
            }]
        };
        const dotStyle = [
            styles.sliderPaginationDot,
            style || {},
            animatedStyle
        ];

        return (
            <Animated.View style={dotStyle} />
        );
    }
}
