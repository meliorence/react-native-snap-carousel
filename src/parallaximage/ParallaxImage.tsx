// Parallax effect inspired by https://github.com/oblador/react-native-parallax/

import React, { Component } from 'react';
import {
  View,
  Animated,
  Easing,
  ActivityIndicator,
  findNodeHandle,
  ImageProps,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  ImageLoadEventData,
  ImageErrorEventData,
} from 'react-native';
import styles from './ParallaxImage.style';
import type Carousel from 'src/carousel/Carousel';

type ParallaxImageProps = {
  carouselRef: Carousel<any> | null; // passed from <Carousel />
  itemHeight: number; // passed from <Carousel />
  itemWidth: number; // passed from <Carousel />
  scrollPosition: Animated.Value; // passed from <Carousel />
  sliderHeight: number; // passed from <Carousel />
  sliderWidth: number; // passed from <Carousel />
  vertical: boolean; // passed from <Carousel />
  containerStyle: StyleProp<ViewStyle>;
  dimensions: {
    width: number;
    height: number;
  };
  fadeDuration: number;
  parallaxFactor: number;
  showSpinner: boolean;
  spinnerColor: string;
  // TODO: type it
  AnimatedImageComponent: typeof Animated.Image;
} & ImageProps;

type ParallaxImageState = {
  offset: number;
  width: number;
  height: number;
  status: 1 | 2 | 3 | 4;
  animOpacity: Animated.Value;
};

export default class ParallaxImage extends Component<
  ParallaxImageProps,
  ParallaxImageState
> {
  static defaultProps = {
    containerStyle: {},
    fadeDuration: 500,
    parallaxFactor: 0.3,
    showSpinner: true,
    spinnerColor: 'rgba(0, 0, 0, 0.4)',
    AnimatedImageComponent: Animated.Image,
  };

  _container?: View | null;
  _mounted?: boolean;

  constructor(props: ParallaxImageProps) {
    super(props);
    this.state = {
      offset: 0,
      width: 0,
      height: 0,
      status: 1, // 1 -> loading; 2 -> loaded // 3 -> transition finished; 4 -> error
      animOpacity: new Animated.Value(0),
    };
    this._onLoad = this._onLoad.bind(this);
    this._onError = this._onError.bind(this);
    this._measureLayout = this._measureLayout.bind(this);
  }
  setNativeProps(nativeProps: { [key: string]: unknown }) {
    this._container?.setNativeProps(nativeProps);
  }

  componentDidMount() {
    this._mounted = true;

    setTimeout(() => {
      this._measureLayout();
    }, 0);
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  _measureLayout() {
    if (this._container) {
      const {
        dimensions,
        vertical,
        carouselRef,
        sliderWidth,
        sliderHeight,
        itemWidth,
        itemHeight,
      } = this.props;

      const nodeHandle = findNodeHandle(carouselRef);

      if (carouselRef && nodeHandle) {
        this._container.measureLayout(
          nodeHandle,
          (x, y, width, height) => {
            const offset = vertical
              ? y - (sliderHeight - itemHeight) / 2
              : x - (sliderWidth - itemWidth) / 2;

            this.setState({
              offset: offset,
              width:
                dimensions && dimensions.width
                  ? dimensions.width
                  : Math.ceil(width),
              height:
                dimensions && dimensions.height
                  ? dimensions.height
                  : Math.ceil(height),
            });
          },
          () => {}
        );
      }
    }
  }

  _onLoad(event: NativeSyntheticEvent<ImageLoadEventData>) {
    const { animOpacity } = this.state;
    const { fadeDuration, onLoad } = this.props;

    if (!this._mounted) {
      return;
    }

    this.setState({ status: 2 });

    if (onLoad) {
      onLoad(event);
    }

    Animated.timing(animOpacity, {
      toValue: 1,
      duration: fadeDuration,
      easing: Easing.out(Easing.quad),
      isInteraction: false,
      useNativeDriver: true,
    }).start(() => {
      this.setState({ status: 3 });
    });
  }

  // If arg is missing from method signature, it just won't be called
  _onError(event: NativeSyntheticEvent<ImageErrorEventData>) {
    const { onError } = this.props;

    this.setState({ status: 4 });

    if (onError) {
      onError(event);
    }
  }

  get image() {
    const { status, animOpacity, offset, width, height } = this.state;
    const {
      scrollPosition,
      // False positive :( other doesn't have the dimension key
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      dimensions,
      vertical,
      sliderWidth,
      sliderHeight,
      parallaxFactor,
      style,
      AnimatedImageComponent,
      ...other
    } = this.props;
    const parallaxPadding = (vertical ? height : width) * parallaxFactor;
    const requiredStyles = { position: 'relative' };
    const dynamicStyles = {
      width: vertical ? width : width + parallaxPadding * 2,
      height: vertical ? height + parallaxPadding * 2 : height,
      opacity: animOpacity,
      transform: scrollPosition
        ? [
            {
              translateX: !vertical
                ? scrollPosition.interpolate({
                    inputRange: [offset - sliderWidth, offset + sliderWidth],
                    outputRange: [-parallaxPadding, parallaxPadding],
                    extrapolate: 'clamp',
                  })
                : 0,
            },
            {
              translateY: vertical
                ? scrollPosition.interpolate({
                    inputRange: [offset - sliderHeight, offset + sliderHeight],
                    outputRange: [-parallaxPadding, parallaxPadding],
                    extrapolate: 'clamp',
                  })
                : 0,
            },
          ]
        : [],
    };

    return (
      <AnimatedImageComponent
        {...other}
        style={[styles.image, style, requiredStyles, dynamicStyles]}
        onLoad={this._onLoad}
        onError={status !== 3 ? this._onError : undefined} // prevent infinite-loop bug
      />
    );
  }

  get spinner() {
    const { status } = this.state;
    const { showSpinner, spinnerColor } = this.props;

    return status === 1 && showSpinner ? (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size={'small'}
          color={spinnerColor}
          animating={true}
        />
      </View>
    ) : (
      false
    );
  }

  render() {
    const { containerStyle } = this.props;

    return (
      <View
        ref={(c) => {
          this._container = c;
        }}
        pointerEvents={'none'}
        style={[containerStyle, styles.container]}
        onLayout={this._measureLayout}
      >
        {this.image}
        {this.spinner}
      </View>
    );
  }
}
