import React, { Component } from 'react';
import { View, ScrollView, Text, StatusBar } from 'react-native';
import Slider from 'example/src/components/Slider';
import styles from 'example/src/styles/index.style';
import { ENTRIES1, ENTRIES2 } from 'example/src/static/entries';

export default class example extends Component {

    render () {
        return (
            <View style={styles.container}>
                <StatusBar backgroundColor={'transparent'} barStyle={'light-content'} />
                <View style={styles.colorsContainer}>
                    <View style={styles.color1} />
                    <View style={styles.color2} />
                </View>
                <ScrollView style={styles.scrollview}>
                    <Text style={styles.title}>Example 1</Text>
                    <Slider
                      items={ENTRIES1}
                      firstItem={2}
                      inactiveSlideScale={0.94}
                      inactiveSlideOpacity={0.6}
                    />
                    <Text style={styles.title}>Example 2</Text>
                    <Slider
                      items={ENTRIES2}
                      inactiveSlideScale={1}
                      inactiveSlideOpacity={1}
                      autoplay={true}
                      autoplayDelay={500}
                      autoplayInterval={2500}
                    />
                </ScrollView>
            </View>
        );
    }
}
