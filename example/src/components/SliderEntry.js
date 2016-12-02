import React, { Component, PropTypes } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import styles from 'example/src/styles/SliderEntry.style';

export default class SliderEntry extends Component {

    static propTypes = {
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string,
        illustration: PropTypes.string
    };

    render () {
        const { title, subtitle, illustration } = this.props;

        return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.slideInnerContainer}
              onPress={() => { alert(`You've clicked '${title}'`); }}
              >
                <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: illustration }}
                      style={styles.image}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={2}>{ title.toUpperCase() }</Text>
                    <Text style={styles.subtitle} numberOfLines={2}>{ subtitle }</Text>
                </View>
            </TouchableOpacity>
        );
    }
}
