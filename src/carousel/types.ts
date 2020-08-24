import type {
    StyleProp,
    ViewStyle,
    Animated,
    NativeScrollEvent,
    NativeSyntheticEvent,
    FlatListProps,
    ScrollView,
    FlatList
} from 'react-native';
import type { ReactNode } from 'react';

type CarouselBaseProps<TData> = {
  data: TData[];
  activeSlideAlignment: 'center' | 'end' | 'start';
  activeSlideOffset: number;
  apparitionDelay: number;
  autoplay: boolean;
  autoplayDelay: number;
  autoplayInterval: number;
  callbackOffsetMargin: number;
  containerCustomStyle: StyleProp<ViewStyle>;
  contentContainerCustomStyle: StyleProp<ViewStyle>;
  enableSnap: boolean;
  firstItem: number;
  inactiveSlideOpacity: number;
  inactiveSlideScale: number;
  inactiveSlideShift: number;
  layout: 'default' | 'stack' | 'tinder';
  layoutCardOffset?: number;
  loop: boolean;
  loopClonesPerSide: number;
  scrollEnabled: boolean;
  scrollInterpolator?: (index: number, props: CarouselBaseProps<TData>) => {
    inputRange: number[];
    outputRange: number[];
  };
  slideInterpolatedStyle?: (
    index: number,
    animatedValue: Animated.AnimatedInterpolation,
    props: CarouselBaseProps<TData>
  ) => StyleProp<ViewStyle>;
  slideStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  shouldOptimizeUpdates: boolean;
  useExperimentalSnap: boolean;
  useScrollView: boolean | React.ComponentType<unknown>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollIndexChanged?: (index: number) => void;
  onSnapToItem?: (index: number) => void;
};

type InheritedPropsFromFlatlist<TData> = Pick<
  FlatListProps<TData>,
  | 'onTouchStart'
  | 'onTouchEnd'
  | 'onMomentumScrollEnd'
  | 'onLayout'
  | 'keyExtractor'
  | 'CellRendererComponent'
  | 'getItemLayout'
  | 'style'
>;

type VerticalCarouselProps<TData> = {
  vertical: true;
  itemHeight: number;
  sliderHeight: number;
  renderItem: (
    baseData: { index: number; dataIndex: number; item: TData },
    parallaxData: {
      scrollPosition: Animated.Value | undefined,
      carouselRef: ScrollView | FlatList<TData> | null,
      vertical: true,
      itemHeight: number,
      sliderHeight: number,
    }
  ) => ReactNode;
};

type HorizontalCarouselProps<TData> = {
  vertical: false | undefined;
  itemWidth: number;
  sliderWidth: number;
  renderItem: (
    baseData: { index: number; dataIndex: number; item: TData },
    parallaxData: {
      scrollPosition: Animated.Value | undefined,
      carouselRef: ScrollView | FlatList<TData> | null,
      vertical: false,
      itemWidth: number,
      sliderWidth: number,
    }
  ) => ReactNode;
};

export type CarouselProps<TData> = CarouselBaseProps<TData> &
  (HorizontalCarouselProps<TData> | VerticalCarouselProps<TData>) &
  InheritedPropsFromFlatlist<TData>;

export type CarouselState = {
  hideCarousel: boolean;
  interpolators: (Animated.Value | Animated.AnimatedInterpolation)[];
};
