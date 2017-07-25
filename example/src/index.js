import React, { Component } from 'react';
import { View, ScrollView, Text, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Carousel from 'react-native-snap-carousel';
import { sliderWidth, itemWidth } from 'example/src/styles/SliderEntry.style';
import SliderEntry from 'example/src/components/SliderEntry';
import styles, { colors } from 'example/src/styles/index.style';
import { ENTRIES1, ENTRIES2 } from 'example/src/static/entries';

export default class example extends Component {

    _renderItem ({item, index}) {
        return (
            <SliderEntry
              data={item}
              even={(index + 1) % 2 === 0}
            />
        );
    }

    get example1 () {
        return (
            <Carousel
              data={ENTRIES1}
              renderItem={this._renderItem}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
              firstItem={2}
              inactiveSlideScale={0.94}
              inactiveSlideOpacity={0.6}
              enableMomentum={false}
              containerCustomStyle={styles.slider}
              contentContainerCustomStyle={styles.sliderContainer}
              removeClippedSubviews={false}
            />
        );
    }

    get example2 () {
        return (
            <Carousel
              data={ENTRIES2}
              renderItem={this._renderItem}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
              inactiveSlideScale={1}
              inactiveSlideOpacity={1}
              enableMomentum={true}
              activeSlideAlignment={'start'}
              autoplay={true}
              autoplayDelay={500}
              autoplayInterval={2500}
              containerCustomStyle={styles.slider}
              contentContainerCustomStyle={styles.sliderContainer}
              removeClippedSubviews={false}
            />
        );
    }

    get gradient () {
        return (
            <LinearGradient
              colors={[colors.background1, colors.background2]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradient}
            />
        );
    }

    render () {
        return (
            <View style={styles.container}>
                <StatusBar
                  translucent={true}
                  backgroundColor={'rgba(0, 0, 0, 0.3)'}
                  barStyle={'light-content'}
                />
                { this.gradient }
                <ScrollView
                  style={styles.scrollview}
                  contentContainerStyle={styles.scrollviewContentContainer}
                  indicatorStyle={'white'}
                  scrollEventThrottle={200}
                  directionalLockEnabled={true}
                >
                    <Text style={styles.title}>Example 1</Text>
                    <Text style={styles.subtitle}>No momentum | Scale | Opacity</Text>
                    { this.example1 }
                    <Text style={styles.title}>Example 2</Text>
                    <Text style={styles.subtitle}>Momentum | Left-aligned | Autoplay</Text>
                    { this.example2 }
                </ScrollView>
            </View>
        );
    }
}
