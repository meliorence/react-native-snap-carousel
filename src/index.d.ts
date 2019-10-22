import React, { Component, ReactNode, ReactElement } from 'react';
import {
  StyleProp,
  ViewStyle,
  ListViewDataSource,
  ListRenderItem,
  FlatListProps
} from 'react-native';

type Item = any;

declare module 'react-native-snap-carousel' {
  export type SlideAlignment = 'center' | 'end' | 'start';

  export type CarouselLayout = 'default' | 'stack' | 'tinder';

  export interface CarouselProps extends FlatListProps<Item> {
    data: Array<[]>;
    renderItem: ListRenderItem<Item>;
    itemWidth?: number; // required for horizontal carousel
    itemHeight?: number; // required for vertical carousel
    sliderWidth?: number; // required for horizontal carousel
    sliderHeight?: number; // required for vertical carousel
    activeAnimationType?: string;
    activeAnimationOptions?: object;
    activeSlideAlignment?: SlideAlignment;
    activeSlideOffset?: number;
    apparitionDelay?: number;
    autoplay?: boolean;
    autoplayDelay?: number;
    autoplayInterval?: number;
    callbackOffsetMargin?: number;
    containerCustomStyle?: StyleProp<ViewStyle>;
    contentContainerCustomStyle?: StyleProp<ViewStyle>;
    enableMomentum?: boolean;
    enableSnap?: boolean;
    firstItem?: number;
    hasParallaxImages?: boolean;
    inactiveSlideOpacity?: number;
    inactiveSlideScale?: number;
    inactiveSlideShift?: number;
    layout?: CarouselLayout;
    layoutCardOffset?: number;
    lockScrollTimeoutDuration?: number;
    lockScrollWhileSnapping?: boolean;
    loop?: boolean;
    loopClonesPerSide?: number;
    scrollEnabled?: boolean;
    scrollInterpolator?: () => void;
    slideInterpolatedStyle?: () => void;
    slideStyle?: StyleProp<ViewStyle>;
    shouldOptimizeUpdates?: boolean;
    swipeThreshold?: number;
    useScrollView?: (() => void) | boolean;
    vertical?: boolean;
    onBeforeSnapToItem?: () => void;
    onSnapToItem?: () => void;
  }

  export interface ParallaxImageProps {
    carouselRef?: object; // passed from <Carousel />
    itemHeight?: number; // passed from <Carousel />
    itemWidth?: number; // passed from <Carousel />
    scrollPosition?: object; // passed from <Carousel />
    sliderHeight?: number; // passed from <Carousel />
    sliderWidth?: number; // passed from <Carousel />
    vertical?: boolean; // passed from <Carousel />
    containerStyle?: StyleProp<ViewStyle>;
    dimensions?: {
      width?: number;
      height?: number;
    };
    fadeDuration?: number;
    parallaxFactor?: number;
    showSpinner?: boolean;
    spinnerColor?: string;
    AnimatedImageComponent?: (() => void) | object;
  }

  export interface PaginationProps {
    activeDotIndex: number;
    dotsLength: number;
    activeOpacity?: number;
    carouselRef?: object;
    containerStyle?: StyleProp<ViewStyle>;
    dotColor?: string;
    dotContainerStyle?: StyleProp<ViewStyle>;
    dotElement?: ReactElement;
    dotStyle?: StyleProp<ViewStyle>;
    inactiveDotColor?: string;
    inactiveDotElement?: ReactElement;
    inactiveDotOpacity?: number;
    inactiveDotScale?: number;
    inactiveDotStyle?: StyleProp<ViewStyle>;
    renderDots?: () => void;
    tappableDots?: boolean;
    vertical?: boolean;
    accessibilityLabel?: string;
  }

  class Carousel extends React.Component<CarouselProps> {}
  class ParallaxImage extends React.Component<ParallaxImageProps> {}
  class Pagination extends React.Component<PaginationProps> {}
}

export default Carousel;
