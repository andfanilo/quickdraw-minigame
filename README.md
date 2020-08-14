# QuickDraw sketch game

A minigame around Quickdraw - have a basic CNN recognize your drawings, or train a CNN on your own drawings !

This prototype was an opportunity for me to play around Tensorflow.js, Vue.js., IndexedDB to store drawings.

### Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Preview deployment locally

Comment lines in `vue.config.js` beforehand.

```
npm install -g serve
# -s flag means serve it in Single-Page Application mode
serve -s dist
```

https://cli.vuejs.org/guide/deployment.html#previewing-locally

### Deploy

https://cli.vuejs.org/guide/deployment.html#pushing-updates-manually

### Run your tests

```
npm run test
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

## Reset IndexedDB database

Photos drawn in the app are hardcoded to be stored in the "quickdraw" database in table "photos".

In [Chrome](https://developers.google.com/web/tools/chrome-devtools/storage/indexeddb) / [Firefox](https://developer.mozilla.org/en-US/docs/Tools/Storage_Inspector#IndexedDB), you can browse its content from the
Developer Tools > Application > Storage > IndexedDB.

Database will be automatically dropped when quitting the application.

## References

- [Sketcher](https://github.com/zaidalyafeai/zaidalyafeai.github.io/tree/master/sketcher)
- [tfjs-vis](https://github.com/tensorflow/tfjs-vis)
- [Pretrained models](https://github.com/jtheiner/SketchRecognition/tree/master/SketchRecognition/recognition/models/)
- [18 Tips for Training your own TFJS Models in the Browser](https://itnext.io/18-tips-for-training-your-own-tensorflow-js-models-in-the-browser-3e40141c9091)
- [Deploy your projects to Github Pages with GitHub Actions](https://dev.to/pierresaid/deploy-node-projects-to-github-pages-with-github-actions-4jco)
