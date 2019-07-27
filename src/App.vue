<template>
  <div id="app">
    <div id="nav">
      <ul>
        <router-link tag="li" class="link" to="/">Discover QuickDraw</router-link>|
        <router-link tag="li" class="link" to="/train">Train your CNN</router-link>
      </ul>
    </div>
    <router-view />
  </div>
</template>

<style>
:root {
  box-sizing: border-box;
}

*,
::before,
::after {
  box-sizing: inherit;
}

body {
  margin: 0;
}

#app {
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#nav {
  overflow: hidden;
  background-color: #428bca;
}

#nav ul {
  display: flex;
  justify-content: flex-end;
  list-style-type: none;
  margin: 0;
  padding: 0;
}

#nav .link {
  display: block;
  color: white;
  text-align: center;
  padding: 1em 1.1em;
  text-decoration: none;
  cursor: pointer;
}

#nav .link:hover {
  background-color: #111;
}

.container {
  padding: 2em;
}

.header {
  margin: 0 0;
  padding-bottom: 0.5em;
  text-align: center;
}

.main {
  display: flex;
  justify-content: center;
  padding-bottom: 1em;
}

.main__canvas {
  padding-bottom: 1em;
}

.canvas {
  border: 1px solid #b9bfc9;
}

.buttons {
  display: flex;
  margin: 0 1em;
  padding-bottom: 1em;
}

.button__add {
  background-color: #428bca;
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

.button__erase {
  background-color: #e7e7e7;
  color: black;
  border: none;
  border-radius: 0.5em;
  padding: 1em 2em;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
  margin-right: 1em;
}

.button__add:hover {
  background-color: #111;
}

.button__erase:hover {
  color: #fcfcfc;
  background-color: #111;
}

.toast-css {
  background-color: #428bca !important;
}
</style>
