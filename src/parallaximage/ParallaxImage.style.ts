import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
    },
    image: {
        position: 'relative',
        resizeMode: 'cover',
        width: undefined,
        height: undefined
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
