<!-- Base component of Discover Quickdraw page -->
<template>
  <div class="container">
    <!-- Loading screen -->
    <loading :active="!loadingModelOver" :can-cancel="false" :is-full-page="true" color="#428bca"></loading>

    <!-- Header for component -->
    <h1 class="header">Draw all {{getLengthNames}} classes !</h1>
    <div class="main">
      <label>Select your difficulty</label>
      <toggle-button
        class="toggle"
        v-model="toggleBigModel"
        :labels="{checked: 'Big', unchecked: 'Small'}"
        :width="70"
        color="#428bca"
      />
    </div>

    <!-- Drawing part of the component -->
    <main class="main">
      <div class="main__content">
        <div class="main__canvas">
          <canvas id="c" class="canvas" width="400" height="400"></canvas>
        </div>
        <div class="slider">
          <div class="slider__label">Brush width</div>
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
      <button class="button__add" v-on:click="submitDrawing()">Submit</button>
      <button class="button__erase" v-on:click="clearCanvas()">Clear</button>
    </div>

    <!-- Table of all results -->
    <div class="ranking">
      <vue-good-table
        :columns="tableColumns"
        :rows="tableRows()"
        max-height="400px"
        :fixed-header="true"
      />
    </div>
  </div>
</template>

<script>
import "fabric";
import { SMALL_CLASS_NAMES, BIG_CLASS_NAMES } from "../utils/class_names";

import ECharts from "vue-echarts";
import "echarts/lib/chart/bar";
import "vue-good-table/dist/vue-good-table.css";
import { VueGoodTable } from "vue-good-table";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";
import Loading from "vue-loading-overlay";
import "vue-loading-overlay/dist/vue-loading.css";

const SMALL_MODEL_URL = "./small_model/model.json";
const BIG_MODEL_URL = "./big_model/model.json";

import { TFModel, disposeTFVariables } from "../utils/model";

export default {
  name: "BaseModel",
  components: {
    "v-chart": ECharts,
    VueGoodTable,
    VueSlider,
    Loading
  },
  data() {
    return {
      loadingModelOver: false, // responsible for loading screen visibility
      raw_predictions: [], // stores raw probabilities of prediction for all classes
      mousePressed: false, // propagate mouse press event into component
      coords: [], // stores all coordinates of points on drawing
      small_ranking: {}, // stores results of submit for small model
      big_ranking: {}, // stores results of submit for big model
      brushWidth: 20, // stores width of brush
      toggleBigModel: false, // switch variable between small and big model
      tableColumns: [
        { label: "Class", field: "class" },
        { label: "Submitted", field: "submitted", type: "number" }
      ]
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
      let input_img = this.getImageData();
      if (!this.toggleBigModel) {
        this.raw_predictions = this.small_model.predictClass(input_img);
      } else {
        this.raw_predictions = this.big_model.predictClass(input_img);
      }
    },
    submitDrawing() {
      /**
       * Add a point to the top class in predictions in result table for model
       */
      const winClass = this.getTopClassNames[0];
      this.$toasted.show(
        "Your submission for '" + winClass + "' has been taken"
      );
      if (!this.toggleBigModel) {
        this.small_ranking[winClass] = this.small_ranking[winClass] + 1;
      } else {
        this.big_ranking[winClass] = this.big_ranking[winClass] + 1;
      }
      this.clearCanvas();
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
    },
    tableRows() {
      /**
       * Convert results object in component to list for vue-good-table
       */
      if (!this.toggleBigModel) {
        return Object.keys(this.small_ranking).map(key => {
          return { class: key, submitted: this.small_ranking[key] };
        });
      } else {
        return Object.keys(this.big_ranking).map(key => {
          return { class: key, submitted: this.big_ranking[key] };
        });
      }
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
        outp[i] = this.getClassNames[indices[i]];
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
    },
    getClassNames: function() {
      /**
       * Get all classes from models
       */
      if (!this.toggleBigModel) {
        return SMALL_CLASS_NAMES;
      } else {
        return BIG_CLASS_NAMES;
      }
    },
    getLengthNames: function() {
      /**
       * Get number of classes from the model
       */
      return this.getClassNames.length;
    }
  },
  watch: {
    brushWidth: function(val) {
      this.canvas.freeDrawingBrush.width = val;
    }
  },
  mounted() {
    this.loadingModelOver = false;

    if (Object.entries(this.small_ranking).length === 0) {
      SMALL_CLASS_NAMES.forEach(c => (this.small_ranking[c] = 0));
    }
    if (Object.entries(this.big_ranking).length === 0) {
      BIG_CLASS_NAMES.forEach(c => (this.big_ranking[c] = 0));
    }

    this.canvas = new fabric.Canvas("c", {
      isDrawingMode: true
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

    this.small_model = new TFModel();
    this.big_model = new TFModel();

    Promise.all([
      this.small_model.loadModel(SMALL_MODEL_URL),
      this.big_model.loadModel(BIG_MODEL_URL)
    ]).then(() => {
      this.loadingModelOver = true;
    });
  },

  beforeDestroy: function() {
    disposeTFVariables();
  }
};
</script>

<style scoped>
.buttons {
  justify-content: flex-end;
}

.toggle {
  margin-left: 1.5em;
}
</style>
