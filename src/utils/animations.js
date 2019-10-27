import { Platform } from 'react-native';

const IS_ANDROID = Platform.OS === 'android';

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

    return { inputRange, outputRange };
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
// WARNING: The effect had to be visually inverted on Android because this OS doesn't honor the `zIndex`property
// This means that the item with the higher zIndex (and therefore the tap receiver) remains the one AFTER the currently active item
// The `elevation` property compensates for that only visually, which is not good enough
export function stackScrollInterpolator (index, carouselProps) {
    const range = IS_ANDROID ?
        [1, 0, -1, -2, -3] :
        [3, 2, 1, 0, -1];
    const inputRange = getInputRangeFromIndexes(range, index, carouselProps);
    const outputRange = range;

    return { inputRange, outputRange };
}
export function stackAnimatedStyles (index, animatedValue, carouselProps, cardOffset) {
    const sizeRef = carouselProps.vertical ? carouselProps.itemHeight : carouselProps.itemWidth;
    const translateProp = carouselProps.vertical ? 'translateY' : 'translateX';

    const card1Scale = 0.9;
    const card2Scale = 0.8;

    cardOffset = !cardOffset && cardOffset !== 0 ? 18 : cardOffset;

    const getTranslateFromScale = (cardIndex, scale) => {
        const centerFactor = 1 / scale * cardIndex;
        const centeredPosition = -Math.round(sizeRef * centerFactor);
        const edgeAlignment = Math.round((sizeRef - (sizeRef * scale)) / 2);
        const offset = Math.round(cardOffset * Math.abs(cardIndex) / scale);

        return IS_ANDROID ?
            centeredPosition - edgeAlignment - offset :
            centeredPosition + edgeAlignment + offset;
    };

    const opacityOutputRange = carouselProps.inactiveSlideOpacity === 1 ? [1, 1, 1, 0] : [1, 0.75, 0.5, 0];

    return IS_ANDROID ? {
        // elevation: carouselProps.data.length - index, // fix zIndex bug visually, but not from a logic point of view
        opacity: animatedValue.interpolate({
            inputRange: [-3, -2, -1, 0],
            outputRange: opacityOutputRange.reverse(),
            extrapolate: 'clamp'
        }),
        transform: [{
            scale: animatedValue.interpolate({
                inputRange: [-2, -1, 0, 1],
                outputRange: [card2Scale, card1Scale, 1, card1Scale],
                extrapolate: 'clamp'
            })
        }, {
            [translateProp]: animatedValue.interpolate({
                inputRange: [-3, -2, -1, 0, 1],
                outputRange: [
                    getTranslateFromScale(-3, card2Scale),
                    getTranslateFromScale(-2, card2Scale),
                    getTranslateFromScale(-1, card1Scale),
                    0,
                    sizeRef * 0.5
                ],
                extrapolate: 'clamp'
            })
        }]
    } : {
        zIndex: carouselProps.data.length - index,
        opacity: animatedValue.interpolate({
            inputRange: [0, 1, 2, 3],
            outputRange: opacityOutputRange,
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
// WARNING: The effect had to be visually inverted on Android because this OS doesn't honor the `zIndex`property
// This means that the item with the higher zIndex (and therefore the tap receiver) remains the one AFTER the currently active item
// The `elevation` property compensates for that only visually, which is not good enough
export function tinderScrollInterpolator (index, carouselProps) {
    const range = IS_ANDROID ?
        [1, 0, -1, -2, -3] :
        [3, 2, 1, 0, -1];
    const inputRange = getInputRangeFromIndexes(range, index, carouselProps);
    const outputRange = range;

    return { inputRange, outputRange };
}
export function tinderAnimatedStyles (index, animatedValue, carouselProps, cardOffset) {
    const sizeRef = carouselProps.vertical ? carouselProps.itemHeight : carouselProps.itemWidth;
    const mainTranslateProp = carouselProps.vertical ? 'translateY' : 'translateX';
    const secondaryTranslateProp = carouselProps.vertical ? 'translateX' : 'translateY';

    const card1Scale = 0.96;
    const card2Scale = 0.92;
    const card3Scale = 0.88;

    const peekingCardsOpacity = IS_ANDROID ? 0.92 : 1;

    cardOffset = !cardOffset && cardOffset !== 0 ? 9 : cardOffset;

    const getMainTranslateFromScale = (cardIndex, scale) => {
        const centerFactor = 1 / scale * cardIndex;
        return -Math.round(sizeRef * centerFactor);
    };

    const getSecondaryTranslateFromScale = (cardIndex, scale) => {
        return Math.round(cardOffset * Math.abs(cardIndex) / scale);
    };

    return IS_ANDROID ? {
        // elevation: carouselProps.data.length - index, // fix zIndex bug visually, but not from a logic point of view
        opacity: animatedValue.interpolate({
            inputRange: [-3, -2, -1, 0, 1],
            outputRange: [0, peekingCardsOpacity, peekingCardsOpacity, 1, 0],
            extrapolate: 'clamp'
        }),
        transform: [{
            scale: animatedValue.interpolate({
                inputRange: [-3, -2, -1, 0],
                outputRange: [card3Scale, card2Scale, card1Scale, 1],
                extrapolate: 'clamp'
            })
        }, {
            rotate: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '22deg'],
                extrapolate: 'clamp'
            })
        }, {
            [mainTranslateProp]: animatedValue.interpolate({
                inputRange: [-3, -2, -1, 0, 1],
                outputRange: [
                    getMainTranslateFromScale(-3, card3Scale),
                    getMainTranslateFromScale(-2, card2Scale),
                    getMainTranslateFromScale(-1, card1Scale),
                    0,
                    sizeRef * 1.1
                ],
                extrapolate: 'clamp'
            })
        }, {
            [secondaryTranslateProp]: animatedValue.interpolate({
                inputRange: [-3, -2, -1, 0],
                outputRange: [
                    getSecondaryTranslateFromScale(-3, card3Scale),
                    getSecondaryTranslateFromScale(-2, card2Scale),
                    getSecondaryTranslateFromScale(-1, card1Scale),
                    0
                ],
                extrapolate: 'clamp'
            })
        }]
    } : {
        zIndex: carouselProps.data.length - index,
        opacity: animatedValue.interpolate({
            inputRange: [-1, 0, 1, 2, 3],
            outputRange: [0, 1, peekingCardsOpacity, peekingCardsOpacity, 0],
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
                    -sizeRef * 1.1,
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
