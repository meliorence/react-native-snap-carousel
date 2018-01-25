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
export function stackScrollInterpolator (index, carouselProps) {
    const range = [3, 2, 1, 0, -1];
    const inputRange = getInputRangeFromIndexes(range, index, carouselProps);
    const outputRange = range;

    return {
        inputRange,
        outputRange
    };
}
export function stackAnimatedStyles (index, animatedValue, carouselProps, cardOffset) {
    const sizeRef = carouselProps.vertical ? carouselProps.itemHeight : carouselProps.itemWidth;
    const translateProp = carouselProps.vertical ? 'translateY' : 'translateX';

    const card1Scale = 0.9;
    const card2Scale = 0.8;

    cardOffset = !cardOffset && cardOffset !== 0 ? 18 : cardOffset;

    const getTranslateFromScale = (index, scale) => {
        const centerFactor = 1 / scale * index;
        const centeredPosition = -Math.round(sizeRef * centerFactor);
        const edgeAlignment = (sizeRef - (sizeRef * scale)) / 2;
        const offset = Math.round(cardOffset * index / scale);
        return centeredPosition + edgeAlignment + offset;
    };

    return {
        zIndex: carouselProps.data.length - index,
        opacity: animatedValue.interpolate({
            inputRange: [0, 1, 2, 3],
            outputRange: [1, 0.75, 0.5, 0],
            extrapolate: 'clamp'
        }),
        transform: [{
            scale: animatedValue.interpolate({
                inputRange: [-1, 0, 1, 2],
                outputRange: [card1Scale, 1, card1Scale, card2Scale],
                extrapolate: 'clamp'
            })
        }, {
            [translateProp]: animatedValue.interpolate({
                inputRange: [-1, 0, 1, 2, 3],
                outputRange: [
                    -sizeRef * 0.5,
                    0,
                    getTranslateFromScale(1, card1Scale),
                    getTranslateFromScale(2, card2Scale),
                    getTranslateFromScale(3, card2Scale)
                ],
                extrapolate: 'clamp'
            })
        }]
    };
}

// Tinder animation
// Imitate the popular Tinder layout

export function tinderScrollInterpolator (index, carouselProps) {
    const range = [3, 2, 1, 0, -1];
    const inputRange = getInputRangeFromIndexes(range, index, carouselProps);
    const outputRange = range;

    return {
        inputRange,
        outputRange
    };
}
export function tinderAnimatedStyles (index, animatedValue, carouselProps, cardOffset) {
    const sizeRef = carouselProps.vertical ? carouselProps.itemHeight : carouselProps.itemWidth;
    const mainTranslateProp = carouselProps.vertical ? 'translateY' : 'translateX';
    const secondaryTranslateProp = carouselProps.vertical ? 'translateX' : 'translateY';

    const card1Scale = 0.95;
    const card2Scale = 0.9;
    const card3Scale = 0.85;

    cardOffset = !cardOffset && cardOffset !== 0 ? 14 : cardOffset;

    const getMainTranslateFromScale = (index, scale) => {
        const centerFactor = 1 / scale * index;
        return -Math.round(sizeRef * centerFactor);
    };

    const getSecondaryTranslateFromScale = (index, scale) => {
        return Math.round(cardOffset * index / scale);
    };

    return {
        zIndex: carouselProps.data.length - index,
        opacity: animatedValue.interpolate({
            inputRange: [-1, 0, 1, 2, 3],
            outputRange: [0, 1, 1, 1, 0],
            // inputRange: [2, 3],
            // outputRange: [1, 0],
            extrapolate: 'clamp'
        }),
        transform: [{
            scale: animatedValue.interpolate({
                inputRange: [0, 1, 2, 3],
                outputRange: [1, card1Scale, card2Scale, card3Scale],
                extrapolate: 'clamp'
            })
        }, {
            rotate: animatedValue.interpolate({
                inputRange: [-1, 0],
                outputRange: ['-22deg', '0deg'],
                extrapolate: 'clamp'
            })
        }, {
            [mainTranslateProp]: animatedValue.interpolate({
                inputRange: [-1, 0, 1, 2, 3],
                outputRange: [
                    -sizeRef * 0.75,
                    0,
                    getMainTranslateFromScale(1, card1Scale),
                    getMainTranslateFromScale(2, card2Scale),
                    getMainTranslateFromScale(3, card3Scale)
                ],
                extrapolate: 'clamp'
            })
        }, {
            [secondaryTranslateProp]: animatedValue.interpolate({
                inputRange: [0, 1, 2, 3],
                outputRange: [
                    0,
                    getSecondaryTranslateFromScale(1, card1Scale),
                    getSecondaryTranslateFromScale(2, card2Scale),
                    getSecondaryTranslateFromScale(3, card3Scale)
                ],
                extrapolate: 'clamp'
            })
        }]
    };
}
