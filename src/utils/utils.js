import * as tf from "@tensorflow/tfjs";

function preprocess(img) {
    /**
     * Convert an image from canvas to a tensor that the model can process
     */
    return tf.tidy(() => {
        //convert to a tensor
        let tensor = tf.browser.fromPixels(img, 1);

        //resize
        const resized = tf.image
            .resizeBilinear(tensor, [28, 28], true)
            .toFloat();

        //normalize
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        //We add a dimension to get a batch shape
        const batched = normalized.expandDims(0);
        return batched;
    });
}

function debugTFMemory(msg) {
    /**
     * Log tensorflowjs used memory in console.
     * It helps debug memory leaks
     */
    console.log("=================== " + msg + " ===================");
    console.log(tf.memory());
    console.log("=================== " + msg + " ===================");
    console.log("");
}

function roughSizeOfObject(object) {
    /**
     * https: //stackoverflow.com/a/11900218
     */
    var objectList = [];
    var stack = [object];
    var bytes = 0;

    while (stack.length) {
        var value = stack.pop();

        if (typeof value === 'boolean') {
            bytes += 4;
        } else if (typeof value === 'string') {
            bytes += value.length * 2;
        } else if (typeof value === 'number') {
            bytes += 8;
        } else if (
            typeof value === 'object' &&
            objectList.indexOf(value) === -1
        ) {
            objectList.push(value);

            for (var i in value) {
                stack.push(value[i]);
            }
        }
    }
    return bytes;
}

export {
    preprocess,
    debugTFMemory,
    roughSizeOfObject
};