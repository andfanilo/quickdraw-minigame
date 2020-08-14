import * as tf from "@tensorflow/tfjs";
import {
  openVisor,
  getFitCallbacks,
  showClassAccuracy,
  showConfusionMatrix
} from "./visualize";
import {
  preprocess
} from "./utils";

class TFModel {
  constructor() {
    this.model = tf.sequential();
  }

  getModel() {
    return this.model;
  }

  resetModel() {
    tf.dispose(this.model);
    this.model = tf.sequential();
  }

  build_CNN(numConv1 = 8, numConv2 = 16, numDense = 64, numClasses = 5) {
    // https://codelabs.developers.google.com/codelabs/tfjs-training-classfication/index.html#4
    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const IMAGE_CHANNELS = 1;

    this.model.add(
      tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
        kernelSize: 5,
        filters: numConv1,
        strides: 1,
        activation: "relu",
        kernelInitializer: "glorotNormal",
        name: "conv2d_Conv2D1"
      })
    );

    this.model.add(
      tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2]
      })
    );

    this.model.add(
      tf.layers.conv2d({
        kernelSize: 5,
        filters: numConv2,
        strides: 1,
        activation: "relu",
        kernelInitializer: "glorotNormal",
        name: "conv2d_Conv2D2"
      })
    );

    this.model.add(
      tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2]
      })
    );

    this.model.add(tf.layers.flatten());

    this.model.add(
      tf.layers.dense({
        units: numDense,
        activation: "relu",
        kernelInitializer: "glorotNormal",
        name: "intermediary_dense"
      })
    );

    this.model.add(
      tf.layers.dropout({
        rate: 0.4
      })
    );

    // Our last layer is a dense layer
    this.model.add(
      tf.layers.dense({
        units: numClasses,
        kernelInitializer: "glorotNormal",
        activation: "softmax",
        name: "dense_Dense1"
      })
    );

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: tf.metrics.categoricalCrossentropy,
      metrics: ["accuracy"]
    });

    this.model.predict(tf.zeros([1, 28, 28, 1])).dataSync();
  }

  train_CNN(data, class_names) {
    const BATCH_SIZE = 16;

    openVisor();

    function buildXs(arr) {
      return tf.tidy(() => {
        let data = arr.map(data => {
          return preprocess(data["img"]).reshape([28, 28, 1]);
        });
        return tf.stack(data);
      });
    }

    function buildYs(arr, class_names) {
      return tf.tidy(() => {
        let labels = arr.map(data => {
          return tf.oneHot(
            class_names.indexOf(data["label"]),
            class_names.length
          );
        });
        return tf.stack(labels);
      });
    }

    const trainXs = buildXs(data);
    const trainYs = buildYs(data, class_names);

    return this.model
      .fit(trainXs, trainYs, {
        batchSize: BATCH_SIZE,
        validationData: [trainXs, trainYs],
        epochs: 20,
        shuffle: true,
        validationSplit: 0.2,
        callbacks: getFitCallbacks()
      })
      .then(() => {
        tf.tidy(() => {
          const preds = this.model.predict(trainXs).argMax([-1]);
          const labels = trainYs.argMax([-1]);

          tf.dispose(trainXs);
          tf.dispose(trainYs);

          showClassAccuracy(preds, labels, class_names);
          showConfusionMatrix(preds, labels, class_names);
        });
      });
  }

  loadModel(path_to_layers) {
    return tf.loadLayersModel(path_to_layers).then(model => {
      this.model = model;

      // warm up the model
      tf.tidy(() => this.model.predict(tf.zeros([1, 28, 28, 1])).dataSync());
    });
  }

  predictClass(img) {
    return tf.tidy(() => {
      let preprocessed_img = preprocess(img);
      return this.model.predict(preprocessed_img).dataSync();
    });
  }
}

function disposeTFVariables() {
  tf.disposeVariables();
}

export {
  disposeTFVariables,
  TFModel
};