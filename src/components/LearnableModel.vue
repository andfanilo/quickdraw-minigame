<!-- Base component of Train your CNN page -->
<template>
  <div class="container">
    <!-- Loading screen -->
    <loading :active="!loadingModelOver" :can-cancel="false" :is-full-page="true" color="#428bca"></loading>

    <!-- Header for component -->
    <h1 class="header">Can we learn to recognize doodles ?</h1>

    <!-- Drawing part of the component -->
    <main class="main">
      <div class="main__content">
        <div class="main__canvas">
          <canvas id="c" class="canvas" width="400" height="400"></canvas>
        </div>
        <div class="slider">
          <div class="slider_label">Brush width</div>
          <vue-slider
            v-model="brushWidth"
            :min="0"
            :max="100"
            :interval="1"
            class="slider__controls"
          ></vue-slider>
        </div>
      </div>
      <v-chart :options="getBar" autoresize />
    </main>

    <!-- Row of buttons -->
    <div class="buttons">
      <button class="button__add" v-on:click="storeDrawing(class_names[0])">Add {{class_names[0]}}</button>
      <button class="button__add" v-on:click="storeDrawing(class_names[1])">Add {{class_names[1]}}</button>
      <button class="button__add" v-on:click="storeDrawing(class_names[2])">Add {{class_names[2]}}</button>
      <button class="button__add" v-on:click="storeDrawing(class_names[3])">Add {{class_names[3]}}</button>
      <button class="button__add" v-on:click="storeDrawing(class_names[4])">Add {{class_names[4]}}</button>
      <button class="button__erase" v-on:click="clearCanvas()">Clear</button>
    </div>
    <hr />
    <div class="trainer__controls">
      <button class="button__train" v-on:click="trainModel()">Train</button>
      <button class="button__erase" v-on:click="showVisor()">Visor</button>
      <button class="button__erase" v-on:click="removeAllPhotos()">Delete photos</button>
    </div>
  </div>
</template>

<script>
import "fabric";

import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";
import Loading from "vue-loading-overlay";
import "vue-loading-overlay/dist/vue-loading.css";

import ECharts from "vue-echarts";
import "echarts/lib/chart/bar";

import { disposeTFVariables, TFModel } from "../utils/model";
import {
  showModelInspection,
  showInputData,
  showActivations,
  openVisor
} from "../utils/visualize";
import { PhotosDAO } from "../utils/data";

export default {
  name: "LearnableModel",
  components: {
    "v-chart": ECharts,
    VueSlider,
    Loading
  },
  data() {
    return {
      class_names: ["apple", "pear", "banana", "litchi", "mango"], // name of classes to draw
      loadingModelOver: false, // responsible for loading screen visibility
      raw_predictions: [], // stores raw probabilities of prediction for all classes
      mousePressed: false, // propagate mouse press event into component
      coords: [], // stores all coordinates of points on drawing
      brushWidth: 20, // stores width of brush
      numConv1: 8, // dimension of first conv layer
      numConv2: 16, // dimension of second conv layer
      numDense: 64, // dimension of dense layer
      numEpochs: 20 // number training epochs
    };
  },
  methods: {
    recordCoor(e) {
      /**
       * Record the x,y coordinates of mouse on canvas when mouse is pressed
       */
      var pointer = this.canvas.getPointer(event.e);
      var posX = pointer.x;
      var posY = pointer.y;

      if (posX >= 0 && posY >= 0 && this.mousePressed) {
        this.coords.push(pointer);
      }
    },
    getMinBox() {
      /**
       * Get top left and bottom right coords of bounding box of the drawing
       */
      var coorX = this.coords.map(function(p) {
        return p.x;
      });
      var coorY = this.coords.map(function(p) {
        return p.y;
      });

      var min_coords = {
        x: Math.min.apply(null, coorX),
        y: Math.min.apply(null, coorY)
      };
      var max_coords = {
        x: Math.max.apply(null, coorX),
        y: Math.max.apply(null, coorY)
      };

      return {
        min: min_coords,
        max: max_coords
      };
    },
    submitCanvas() {
      /**
       * Get image on canvas and submit it to the model for prediction
       */
      this.raw_predictions = this.model.predictClass(this.getImageData());
    },
    clearCanvas() {
      /**
       * Resets the canvas
       */
      this.canvas.clear();
      this.canvas.backgroundColor = "#FFFFFF";
      this.raw_predictions = [];
      this.coords = [];
    },
    trainModel() {
      /**
       * Train the CNN model
       */
      this.$toasted.show("A new training was launched");

      this.db.get_all_photos().then(photos => {
        this.model.resetModel();
        this.model.build_CNN();
        this.model.train_CNN(photos, this.class_names).then(() => {
          this.$toasted.show("Training over");
        });
      });
    },
    showVisor() {
      /**
       * Show the visor with input data and activation tab
       */
      openVisor();

      showModelInspection(this.model.getModel());

      this.db.count_photos().then(count => {
        this.db.get_range_photos(count - 60, count).then(photos => {
          showInputData(photos);
          showActivations(photos, this.model.getModel());
        });
      });
    },
    storeDrawing(obj) {
      let img_data = this.getImageData();

      let that = this;
      this.db.add_photo(img_data, obj).then(() => {
        this.$toasted.show("Thanks for adding a '" + obj + "'");
        that.clearCanvas();
      });
    },
    removeAllPhotos() {
      this.db
        .remove_all_items()
        .then(() => this.$toasted.show("Removed all photos"));
    },
    getImageData() {
      /**
       * Get image data in canvas
       */
      const mbb = this.getMinBox();
      const dpi = window.devicePixelRatio;

      const imgData = this.canvas.contextContainer.getImageData(
        mbb.min.x * dpi,
        mbb.min.y * dpi,
        (mbb.max.x - mbb.min.x) * dpi,
        (mbb.max.y - mbb.min.y) * dpi
      );
      return imgData;
    }
  },
  computed: {
    findIndicesOfMax: function() {
      /**
       * Get indices of 5 classes with highest predicted probabilities
       */
      var outp = [];
      for (var i = 0; i < this.raw_predictions.length; i++) {
        outp.push(i); // add index to output array
        if (outp.length > 5) {
          let pred = this.raw_predictions;
          outp.sort(function(a, b) {
            return pred[b] - pred[a];
          }); // descending sort the output array
          outp.pop(); // remove the last index (index of smallest element in output array)
        }
      }
      return outp;
    },
    findTopValues: function() {
      /**
       * Find probs for highest predicted indices from findIndicesOfMax
       */
      var outp = [];
      let indices = this.findIndicesOfMax;
      // show 5 greatest scores
      for (var i = 0; i < indices.length; i++)
        outp[i] = this.raw_predictions[indices[i]];
      return outp;
    },
    getTopClassNames: function() {
      /**
       * Find classes for highest predicted indices from findIndicesOfMax
       */
      var outp = [];
      let indices = this.findIndicesOfMax;
      for (var i = 0; i < indices.length; i++)
        outp[i] = this.class_names[indices[i]];
      return outp;
    },
    getBar: function() {
      /**
       * Get specification of eCharts bar chart
       */
      return {
        xAxis: {
          type: "category",
          data: this.getTopClassNames,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: "value"
        },
        series: [
          {
            data: this.findTopValues,
            type: "bar"
          }
        ]
      };
    }
  },
  watch: {
    brushWidth: function(val) {
      this.canvas.freeDrawingBrush.width = val;
    }
  },
  mounted() {
    this.loadingModelOver = false;

    this.canvas = new fabric.Canvas("c", {
      isDrawingMode: false
    });
    this.canvas.backgroundColor = "#FFFFFF";
    this.canvas.freeDrawingBrush.width = this.brushWidth;
    this.canvas.renderAll();

    let that = this;
    this.canvas.on("mouse:up", function(e) {
      that.submitCanvas();
      that.mousePressed = false;
    });
    this.canvas.on("mouse:down", function(e) {
      that.mousePressed = true;
    });
    this.canvas.on("mouse:move", function(e) {
      that.recordCoor(e);
    });

    this.model = new TFModel();
    this.model.build_CNN();

    this.loadingModelOver = true;
    this.canvas.isDrawingMode = true;

    this.db = new PhotosDAO("quickdraw", "photos");
  },
  beforeDestroy: function() {
    disposeTFVariables();
    this.db.drop_database();
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.buttons {
  justify-content: center;
}

.button__train {
  background-color: #5cb85c;
  color: #fcfcfc;
  border: none;
  border-radius: 0.5em;
  padding: 1em 2em;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 1em;
  cursor: pointer;
  margin-right: 1em;
}

.button__train:hover {
  background-color: #111;
}

.trainer {
  display: grid;
  grid-template-columns: [labels] auto [controls] 1fr;
  grid-auto-flow: row;
  grid-gap: 0.8em;
  padding: 1.2em;
}
.trainer > label {
  grid-column: labels;
  grid-row: auto;
}
.trainer > input {
  grid-column: controls;
  grid-row: auto;
  border: none;
  padding: 1em;
}

.trainer__controls {
  padding: 1.2em;
}
</style>
