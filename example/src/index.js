import React, { Component } from 'react';
import { View, ScrollView, Text, StatusBar } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { sliderWidth, itemWidth } from 'example/src/styles/SliderEntry.style';
import SliderEntry from 'example/src/components/SliderEntry';
import mainStyles from 'example/src/styles/index.style';
import sliderStyles from 'example/src/styles/Slider.style';
import { ENTRIES1, ENTRIES2 } from 'example/src/static/entries';

export default class example extends Component {

    _renderItem (entry) {
        return (
            <SliderEntry {...entry} />
        );
    }

    get example1 () {
        return (
            <Carousel
              items={ENTRIES1}
              firstItem={2}
              inactiveSlideScale={0.94}
              inactiveSlideOpacity={0.6}
              renderItem={this._renderItem}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
              slideStyle={sliderStyles.slide}
              containerCustomStyle={sliderStyles.slider}
              contentContainerCustomStyle={sliderStyles.sliderContainer}
              showsHorizontalScrollIndicator={false}
              snapOnAndroid={true}
              removeClippedSubviews={false}
            />
        );
    }

    get example2 () {
        return (
            <Carousel
              items={ENTRIES2}
              inactiveSlideScale={1}
              inactiveSlideOpacity={1}
              enableMomentum={false}              
              autoplay={true}
              autoplayDelay={500}
              autoplayInterval={2500}
              renderItem={this._renderItem}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
              slideStyle={sliderStyles.slide}
              containerCustomStyle={sliderStyles.slider}
              contentContainerCustomStyle={sliderStyles.sliderContainer}
              showsHorizontalScrollIndicator={false}
              snapOnAndroid={true}
              removeClippedSubviews={false}
            />
        );
    }

    render () {
        return (
            <View style={mainStyles.container}>
                <StatusBar backgroundColor={'transparent'} barStyle={'light-content'} />
                <View style={mainStyles.colorsContainer}>
                    <View style={mainStyles.color1} />
                    <View style={mainStyles.color2} />
                </View>
                <ScrollView style={mainStyles.scrollview}>
                    <Text style={mainStyles.title}>Example 1</Text>
                    { this.example1 }
                    <Text style={mainStyles.title}>Example 2 (no momentum)</Text>
                    { this.example2 }
                </ScrollView>
            </View>
        );
    }
}
