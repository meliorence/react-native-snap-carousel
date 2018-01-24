// Get scroll interpolator's input range from an array of slide indexes
// Indexes are relative to the current active slide (index 0)
// For example, using [3, 2, 1, 0, -1] will return:
// [
//     (index - 3) * sizeRef, // active + 3
//     (index - 2) * sizeRef, // active + 2
//     (index - 1) * sizeRef, // active + 1
//     index * sizeRef, // active
//     (index + 1) * sizeRef // active - 1
// ]
export function getInputRangeFromIndexes (range, index, carouselProps) {
    const sizeRef = carouselProps.vertical ? carouselProps.itemHeight : carouselProps.itemWidth;
    let inputRange = [];

    for (let i = 0; i < range.length; i++) {
        inputRange.push((index - range[i]) * sizeRef);
    }

    return inputRange;
}

// Default behavior
// Scale and/or opacity effect
// Based on props 'inactiveSlideOpacity' and 'inactiveSlideScale'
export function defaultScrollInterpolator (index, carouselProps) {
    const range = [1, 0, -1];
    const inputRange = getInputRangeFromIndexes(range, index, carouselProps);
    const outputRange = [0, 1, 0];

    return {
        inputRange,
        outputRange
    };
}
export function defaultAnimatedStyles (index, animatedValue, carouselProps) {
    let animatedOpacity = {};
    let animatedScale = {};

    if (carouselProps.inactiveSlideOpacity < 1) {
        animatedOpacity = {
            opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [carouselProps.inactiveSlideOpacity, 1]
            })
        };
    }

    if (carouselProps.inactiveSlideScale < 1) {
        animatedScale = {
            transform: [{
                scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [carouselProps.inactiveSlideScale, 1]
                })
            }]
        };
    }

    return {
        ...animatedOpacity,
        ...animatedScale
    };
}

// Shift animation
// Same as the default one, but the active slide is also shifted up or down
// Based on prop 'inactiveSlideShift'
export function shiftAnimatedStyles (index, animatedValue, carouselProps) {
    let animatedOpacity = {};
    let animatedScale = {};
    let animatedTranslate = {};

    if (carouselProps.inactiveSlideOpacity < 1) {
        animatedOpacity = {
            opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [carouselProps.inactiveSlideOpacity, 1]
            })
        };
    }

    if (carouselProps.inactiveSlideScale < 1) {
        animatedScale = {
            scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [carouselProps.inactiveSlideScale, 1]
            })
        };
    }

    if (carouselProps.inactiveSlideShift !== 0) {
        const translateProp = carouselProps.vertical ? 'translateX' : 'translateY';
        animatedTranslate = {
            [translateProp]: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [carouselProps.inactiveSlideShift, 0]
            })
        };
    }

    return {
        ...animatedOpacity,
        transform: [
            { ...animatedScale },
            { ...animatedTranslate }
        ]
    };
}

// Stack animation
// Imitate a deck/stack of cards (see #195)
// TODO: check if output values work on larger and smaller devices
export function stackScrollInterpolator (index, carouselProps) {
    const range = [3, 2, 1, 0, -1];
    const inputRange = getInputRangeFromIndexes(range, index, carouselProps);
    const outputRange = range;

    return {
        inputRange,
        outputRange
    };
}
export function stackAnimatedStyles (index, animatedValue, carouselProps) {
    const sizeRef = carouselProps.vertical ? carouselProps.itemHeight : carouselProps.itemWidth;
    const translateProp = carouselProps.vertical ? 'translateY' : 'translateX';

    return {
        zIndex: carouselProps.data.length - index,
        opacity: animatedValue.interpolate({
            inputRange: [-1, 0, 1, 2, 3],
            outputRange: [1, 1, 0.75, 0.5, 0]
        }),
        transform: [{
            scale: animatedValue.interpolate({
                inputRange: [-1, 0, 1, 2, 3],
                outputRange: [0.9, 1, 0.9, 0.8, 0.8]
            })
        }, {
            [translateProp]: animatedValue.interpolate({
                inputRange: [-1, 0, 1, 2, 3],
                outputRange: [
                    -sizeRef * 0.5,
                    0,
                    -sizeRef * 0.99,
                    -sizeRef * 2.25,
                    -sizeRef * 3.45
                ]
            })
        }]
    };
}
