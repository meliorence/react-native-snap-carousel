import { StyleSheet } from 'react-native';

const DEFAULT_DOT_SIZE = 7;
const DEFAULT_DOT_COLOR = 'rgba(0, 0, 0, 0.75)';

export default StyleSheet.create({
    sliderPagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 30
    },
    sliderPaginationDot: {
        width: DEFAULT_DOT_SIZE,
        height: DEFAULT_DOT_SIZE,
        borderRadius: DEFAULT_DOT_SIZE / 2,
        marginHorizontal: 8,
        backgroundColor: DEFAULT_DOT_COLOR
    }
});
