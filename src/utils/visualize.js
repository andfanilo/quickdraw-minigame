import * as d3 from "d3";
import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import {
    preprocess
} from "./utils"

function openVisor() {
    let visorInstance = tfvis.visor();
    if (!visorInstance.isOpen()) {
        visorInstance.toggle();
    }
}

function getFitCallbacks() {
    // https://codelabs.developers.google.com/codelabs/tfjs-training-classfication/index.html#5
    const metrics = ["loss", "val_loss", "acc", "val_acc"];
    const container = {
        tab: "Training",
        name: "Model Training",
        styles: {
            height: "1000px"
        }
    };
    return tfvis.show.fitCallbacks(container, metrics);
}

function showClassAccuracy(labels, preds, class_names) {
    tfvis.metrics
        .perClassAccuracy(labels, preds, class_names.length)
        .then(classAccuracy => {
            const container = {
                name: "Accuracy",
                tab: "Model Evaluation"
            };
            tfvis.show.perClassAccuracy(
                container,
                classAccuracy,
                class_names
            );
        });
}

function showConfusionMatrix(labels, preds, class_names) {
    tfvis.metrics
        .confusionMatrix(labels, preds, class_names.length)
        .then(confMatrix => {
            const container = {
                name: "Confusion Matrix",
                tab: "Model Evaluation"
            };
            tfvis.render.confusionMatrix(
                container,
                confMatrix,
                class_names
            );
        });
}

function showModelInspection(model) {
    const tabName = "Model Inspection"

    const modelSummarySurface = {
        name: "Model Summary",
        tab: tabName
    };
    modelSummarySurface.innerHTML = ""; // clear older drawings

    const conv1Surface = {
        name: "Conv2D Details",
        tab: tabName
    };
    conv1Surface.innerHTML = ""; // clear older drawings

    const conv2Surface = {
        name: "Conv2D_2 Details",
        tab: tabName
    };
    conv2Surface.innerHTML = ""; // clear older drawings

    const denseSurface = {
        name: "Dense_1 Details",
        tab: tabName
    };
    denseSurface.innerHTML = ""; // clear older drawings

    tf.tidy(() => {
        tfvis.show.modelSummary(modelSummarySurface, model);
        tfvis.show.layer(conv1Surface, model.getLayer("conv2d_Conv2D1"));
        tfvis.show.layer(conv2Surface, model.getLayer("conv2d_Conv2D2"));
        tfvis.show.layer(denseSurface, model.getLayer("dense_Dense1"));
    });
}

function showInputData(data) {
    const inputSurface = tfvis.visor().surface({
        name: "Latest drawings",
        tab: "Input Data"
    });
    const inputSurface_drawArea = inputSurface.drawArea;
    inputSurface_drawArea.innerHTML = ""; // clear older drawings

    let arr = data.map(data =>
        tf.tidy(() => preprocess(data["img"]).reshape([28, 28, 1]))
    );
    renderInputTable(inputSurface_drawArea, arr.slice(-60));
}

function showActivations(data, model) {
    const tabName = "Model Activations"
    const conv1ActivationSurface = tfvis.visor().surface({
        name: "Conv2D Activations",
        tab: tabName,
        styles: {
            height: 650
        }
    });
    const conv1ActivationSurface_drawArea = conv1ActivationSurface.drawArea;
    conv1ActivationSurface.innerHTML = ""; // clear older drawings

    const conv2ActivationSurface = tfvis.visor().surface({
        name: "Conv2D_2 Activations",
        tab: tabName,
        styles: {
            width: 1000,
            height: 650
        }
    });
    const conv2ActivationSurface_drawArea = conv2ActivationSurface.drawArea;
    conv2ActivationSurface.innerHTML = ""; // clear older drawings

    let arr = data.map(data =>
        tf.tidy(() => preprocess(data["img"]).reshape([28, 28, 1]))
    );

    const [filters, filterActivations] = tf.tidy(() =>
        getActivationTable("conv2d_Conv2D1", model, arr.slice(-8))
    );
    const [filters_2, filterActivations_2] = tf.tidy(() =>
        getActivationTable("conv2d_Conv2D2", model, arr.slice(-8))
    );

    renderImageTable(
        conv1ActivationSurface_drawArea,
        filters,
        filterActivations
    );
    renderImageTable(
        conv2ActivationSurface_drawArea,
        filters_2,
        filterActivations_2
    );

    tf.dispose(filters);
    tf.dispose(filterActivations);
    tf.dispose(filters_2);
    tf.dispose(filterActivations_2);
    tf.dispose(arr);
}

function renderInputTable(drawArea, samples) {
    for (let i = 0; i < samples.length; i++) {
        let imageTensor = samples[i]
        const canvas = document.createElement("canvas");
        canvas.width = 28;
        canvas.height = 28;
        canvas.style = "margin: 4px;";
        tf.browser.toPixels(imageTensor, canvas).then(() => {
            drawArea.appendChild(canvas);
            imageTensor.dispose();
        });
    }
}

function renderImage(container, tensor, imageOpts) {
    const resized = tf.tidy(() => tf.image.resizeNearestNeighbor(tensor, [imageOpts.height, imageOpts.width]).clipByValue(0.0, 1.0));
    const canvas = container.querySelector('canvas') || document.createElement('canvas');
    canvas.width = imageOpts.width;
    canvas.height = imageOpts.height;
    canvas.style = `margin: 4px; width:${imageOpts.width}px; height:${imageOpts.height}px`;
    container.appendChild(canvas);
    tf.browser.toPixels(resized, canvas).then(() => resized.dispose())
} // Render a table of images, we will show the output for each filter
// in the convolution.

function renderImageTable(container, headerData, data) {
    let table = d3.select(container).select('table');

    if (table.size() === 0) {
        table = d3.select(container).append('table');
        table.append('thead').append('tr');
        table.append('tbody');
    }

    const headers = table.select('thead').select('tr').selectAll('th').data(headerData);
    const headersEnter = headers.enter().append('th');
    headers.merge(headersEnter).each((d, i, group) => {
        const node = group[i];

        if (typeof d == 'string') {
            node.innerHTML = d;
        } else {
            renderImage(node, d, {
                width: 25,
                height: 25
            });
        }
    });
    const rows = table.select('tbody').selectAll('tr').data(data);
    const rowsEnter = rows.enter().append('tr');
    const cells = rows.merge(rowsEnter).selectAll('td').data(d => d);
    const cellsEnter = cells.enter().append('td');
    cells.merge(cellsEnter).each((d, i, group) => {
        const node = group[i];
        renderImage(node, d, {
            width: 40,
            height: 40
        });
    });
    cells.exit().remove();
    rows.exit().remove();
}

// An 'activation' is the output of any of the internal layers of the
// network.
function getActivation(input, model, layer) {
    const activationModel = tf.model({
        inputs: model.input,
        outputs: layer.output
    });
    return activationModel.predict(input);
} // Render a tensor as an image on canvas object. We will render the
// activations from the convolutional layers.

function getActivationTable(layerName, model, samples) {
    const exampleImageSize = 28;
    const layer = model.getLayer(layerName); // Get the filters

    let filters = tf.tidy(() => layer.kernel.val.transpose([3, 0, 1, 2]).unstack()); // It is hard to draw high dimensional filters so we just use a string

    if (filters[0].shape[2] > 3) {
        filters = filters.map((d, i) => `Filter ${i + 1}`);
    }

    filters.unshift('Input'); // Get the inputs

    const xs = tf.tidy(() => {
        samples = tf.stack(samples);
        const numExamples = samples.shape[0];
        return samples.reshape([numExamples, exampleImageSize, exampleImageSize, 1]); // Get the activations
    })

    const activations = tf.tidy(() => {
        return getActivation(xs, model, layer).unstack();
    });
    const activationImageSize = activations[0].shape[0]; // e.g. 24

    const numFilters = activations[0].shape[2]; // e.g. 8

    let filterActivations = activations.map((activation, i) => {
        // activation has shape [activationImageSize, activationImageSize, i];
        const unpackedActivations = Array(numFilters).fill(0).map((_, i) => activation.slice([0, 0, i], [activationImageSize, activationImageSize, 1])); // prepend the input image
        const inputExample = tf.tidy(() => xs.slice([i], [1]).reshape([exampleImageSize, exampleImageSize, 1]));
        unpackedActivations.unshift(inputExample);
        return unpackedActivations;
    });
    return [
        filters,
        filterActivations
    ];
}

export {
    openVisor,
    getFitCallbacks,
    showClassAccuracy,
    showConfusionMatrix,
    showModelInspection,
    showInputData,
    showActivations,
};