import type {
  StyleProp,
  ViewStyle,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  FlatListProps,
} from 'react-native';

type CarouselBaseProps<TData> = {
  data: TData[];
  renderItem: (
    baseData: { index: number; dataIndex: number; item: TData },
    parallaxData?: any
  ) => any;
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
  hasParallaxImages: boolean;
  inactiveSlideOpacity: number;
  inactiveSlideScale: number;
  inactiveSlideShift: number;
  layout: 'default' | 'stack' | 'tinder';
  layoutCardOffset: number;
  loop: boolean;
  loopClonesPerSide: number;
  scrollEnabled: boolean;
  // TODO: check real type later
  scrollInterpolator: (index: number, props: CarouselBaseProps<TData>) => any;
  // TODO: check real type later
  slideInterpolatedStyle: (
    index: number,
    animatedValue: Animated.Value,
    props: CarouselBaseProps<TData>
  ) => any;
  slideStyle?: StyleProp<ViewStyle>;
  shouldOptimizeUpdates: boolean;
  useExperimentalSnap: boolean;
  // TODO: check real type later
  useScrollView: boolean | React.ComponentType<any>;
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

type VerticalCarouselProps = {
  vertical: true;
  itemWidth?: number;
  itemHeight: number;
  sliderWidth?: number;
  sliderHeight: number;
};

type HorizontalCarouselProps = {
  vertical?: false;
  itemWidth: number;
  itemHeight?: number;
  sliderWidth: number;
  sliderHeight?: number;
};

export type CarouselProps<TData> = CarouselBaseProps<TData> &
  (VerticalCarouselProps | HorizontalCarouselProps) &
  InheritedPropsFromFlatlist<TData>;

export type CarouselState = {
  hideCarousel: boolean;
  interpolators: any[];
};
