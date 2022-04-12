/* Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/**
 * @fileoverview main.js contains the logic necessary to run simulated annealing
 * in order to display the overlaps from the input sets.
 */
(function($) {
$(function() {
  var outerIterations = 10;
  var innerIterations = 10000;
  var closeMagnitude = 3;
  var backgroundColor = '#FFF';
  var width = JSON.parse(sessionStorage.getItem('width'));
  var height = JSON.parse(sessionStorage.getItem('height'));
  var numberOfTypes = JSON.parse(sessionStorage.getItem('count'));
  var names = JSON.parse(sessionStorage.getItem('names'));
  var typeColors = JSON.parse(sessionStorage.getItem('typeColors'));

  function parseBinaryString(number, numberOfTypes) {
    var b = number.toString(2);
    b = ('00000000' + b).substr(-1 * numberOfTypes, numberOfTypes);
    return b.split('').reverse().join('');
  }

  var sets = {};
  var ctx;
  var field = [];

  var data = JSON.parse(sessionStorage.getItem('data'));

  for (var i = 0; i < data.length; i++) {
    sets[parseBinaryString(i + 1, numberOfTypes)] = parseInt(data[i]);
  }

  var isLoad = JSON.parse(sessionStorage.getItem('isLoad'));
 
  if (!isLoad) {
    var fillPercent = JSON.parse(sessionStorage.getItem('fillPercent'));
    field = initField(sets, fillPercent / 100);
    $("#loading-display").addClass("d-none");
    $("#main-display").removeClass("d-none");
    ctx = initCanvas();
    paint(ctx, field, typeColors);
    generateDiagram();
  } else {
    field = JSON.parse(sessionStorage.getItem('field'));
    $("#loading-display").addClass("d-none");
    $("#main-display").removeClass("d-none");
    ctx = initCanvas();
    paint(ctx, field, typeColors);
    $('#progress').hide();
  }

  function paintPixel(x, y, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  }
  function randomInt(top) {
    return Math.floor((Math.random() * top));
  }
  function getTypestamp(name) {
    return parseInt(name, 2);
  }
  function calculateCumSum(sets, fillPercent) {
    var sum = 0;
    $.each(sets, function(name, count) {
      sum += count;
    });
    // How many pixels the whole visualization has.
    const totalArea = width * height;
    // How many pixels will actually be colored in.
    const fillArea = totalArea * fillPercent;
    // How many pixels one member in a set represents. If the input data has
    // very low counts for each set, this number will be very high, as each set
    // member is represented by multiple pixels.
    const fillMult = fillArea / sum;
    // How many pixels will actually left blank.
    const blankArea = totalArea - fillArea;
    const setCounts = [
      blankArea,
    ];
    $.each(sets, function(name, count) {
      setCounts[getTypestamp(name)] = count * fillMult;
    });
    const cumSum = [
      blankArea,
    ];
    for (var i = 1; i < setCounts.length; i++) {
      cumSum[i] = parseInt(cumSum[i - 1] + setCounts[i]);
    }
    return cumSum;
  }
  function getRandomTypestamp(cumSum) {
    const chosenProb = randomInt(cumSum[cumSum.length - 1]);
    var typestamp = 0;
    while (chosenProb > cumSum[typestamp]) {
      typestamp++;
    }
    return typestamp;
  }
  function initField(sets, fillPercent) {
    field = new Uint8ClampedArray(width * height);
    var cs = calculateCumSum(sets, fillPercent);
    for (var i = 0; i < field.length; i++) {
      field[i] = getRandomTypestamp(cs);
    }
    return field;
  }
  function initCanvas() {
    for (var i = 0; i < numberOfTypes; i++) {
      var name = ""
      if (names !== undefined) {
        // If we were passed a names list, use that
        name = names[i];
      } else {
        // Otherwise just use default
        name = 'Type ' + i;
      }
      var color = typeColors[i];
      $('#set-labels').before(
          '<div class="border m-1 border-dark d-inline-block">' +
          '<button id="type' + i + '" class="typename" style="background-color:' + color + '">&nbsp;&nbsp;</button> ' +
          name + '&nbsp; </div><br/>');
    }
    $('.typename').click(function(ev) {
      var s = parseInt(ev.target.id.slice(-1));
      var b = '';
      for (var i = 0; i < numberOfTypes; i++) {
        if (i == s) {
          b += '1';
        } else {
          b += '0';
        }
      }
      highlight(b);
      $('.typename').addClass('inactive');
      $('#type' + s).removeClass('inactive');
    });

    var canvas = document.getElementById('diagram');
    canvas.width = width;
    canvas.height = height;
    ctx = document.getElementById('diagram').getContext('2d');

    return ctx;
  }
  function calculateCenters() {
    var result = [];
    for (var c = 0; c < numberOfTypes; c++) {
      var sumX = 0;
      var sumY = 0;
      var count = 0;
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var b = getBinaryString(field[x + y * width]);
          if (b[c] == '1') {
            sumX += x;
            sumY += y;
            count += 1;
          }
        }
      }
      var x = Math.floor(sumX / count);
      var y = Math.floor(sumY / count);
      result.push({'x': x, 'y': y});
    }
    return result;
  }
  function getLocation(x, y) {
    return {'x': x, 'y': y, 'value': field[x + y * width]};
  }
  function getRandomLocation() {
    var x = randomInt(width);
    var y = randomInt(height);
    return getLocation(x, y);
  }
  function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
  }
  function getCloseLocation(other) {
    var x = other.x + randomInt(2 * closeMagnitude + 1) - closeMagnitude;
    x = clamp(x, 0, width - 1);
    var y = other.y + randomInt(2 * closeMagnitude + 1) - closeMagnitude;
    y = clamp(y, 0, height - 1);
    return getLocation(x, y);
  }
  function cost(p, centers) {
    var cost = 0;
    for (var i = 0; i < numberOfTypes; i++) {
      var b = getBinaryString(p.value);
      if (b[i] == '1') {
        cost +=
            Math.pow(centers[i].x - p.x, 2) + Math.pow(centers[i].y - p.y, 2);
      }
    }
    return cost;
  }
  function getBinaryString(number) {
    var b = number.toString(2);
    b = ('00000000' + b).substr(-1 * numberOfTypes, numberOfTypes);
    return b;
  }
  function getColor(typestamp, colors, high) {
    var b = getBinaryString(typestamp);
    if (!(b in sets)) {
      return -1;
    }
    var allcolors = [];
    for (var i = 0; i < numberOfTypes; i++) {
      if (b[i] == '1') {
        allcolors.push(colors[i]);
      }
    }
    var mix = Color_mixer.mix(allcolors);
    if (high === undefined) {
      return mix;
    }
    var hi = true;
    for (var i = 0; i < numberOfTypes; i++) {
      if ((b[i] == '0') && (high[i] == '1')) {
        hi = false;
      }
    }
    if (!hi) {
      mix = Color_mixer.mix(mix, $.Color('#000'));
    }
    return mix;
  }
  function anyOne(mask, is) {
    for (var i = 0; i < numberOfTypes; i++) {
      if ((mask[i] == '1') && (is[i] == '0')) return false;
    }
    return true;
  }
  function displayCount(b) {
    if (b === undefined) {
      b = '';
      for (var i = 0; i < numberOfTypes; i++) {
        b += '0';
      }
    }
    var sum = 0;
    $.each(sets, function(i, s) {
      if (anyOne(b, i)) {
        sum += s;
      }
    });
    $('#count').html(sum + ' pixels selected');
  }
  function paint(ctx, field, colors, high) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    for (var i = 0; i < width * height; i++) {
      var typestamp = field[i];
      var x = i % width;
      var y = Math.floor(i / height);
      var c = getColor(typestamp, colors, high);
      if (c != -1) {
        paintPixel(x, y, c);
      }
    }
    displayCount(high);
  }
  function switchIfBetter(p1, p2, centers) {
    if (p1.value == p2.value) {
      return false;
    }
    var costIs = cost(p1, centers) + cost(p2, centers);
    var costNew = cost({'x': p1.x, 'y': p1.y, 'value': p2.value}, centers) +
        cost({'x': p2.x, 'y': p2.y, 'value': p1.value}, centers);
    if (costIs <= costNew) {
      return false;
    }
    field[p1.x + p1.y * width] = p2.value;
    field[p2.x + p2.y * width] = p1.value;
    return true;
  }
  function randomIterationClose(centers) {
    var p1 = getRandomLocation();
    var p2 = getCloseLocation(p1);
    switchIfBetter(p1, p2, centers);
  }
  function randomIterationFar(centers) {
    var p1 = getRandomLocation();
    var p2 = getRandomLocation();
    switchIfBetter(p1, p2, centers);
  }
  function randomIteration(centers) {
    randomIterationClose(centers);
    randomIterationFar(centers);
  }
  function iterate(f) {
    for (var j = 0; j < outerIterations; j++) {
      var centers = calculateCenters();
      for (var i = 0; i < innerIterations; i++) {
        f(centers);
      }
    }
    updateScreen();
  }
  function iterateClose() {
    iterate(randomIterationClose);
  }
  function highlight(bintype) {
    paint(ctx, field, typeColors, bintype);
  }
  function allZeros(b) {
    for (var i = 0; i < numberOfTypes; i++) {
      if (b[i] == '1') return false;
    }
    return true;
  }
  function updateScreen() {
    $('.typename').removeClass('inactive');
    paint(ctx, field, typeColors);
  }
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  async function updateText(progress, startTime) {
    const percentDone = 100 * progress;
    const durationSeconds = (performance.now() - startTime) / 1000;
    const percentPerSecond = percentDone / durationSeconds;
    const secondsLeft = (100 / percentPerSecond) - durationSeconds;
    if (durationSeconds == 0 || isNaN(secondsLeft) || !isFinite(secondsLeft)) {
      $('#duration').text(`Preparing time left estimate.`);
    } else if (secondsLeft < 60) {
      $('#duration').text(`${parseInt(secondsLeft)} seconds left.`);
    } else if (secondsLeft < 60 * 60) {
      $('#duration').text(`${parseInt(secondsLeft / 60)} minutes left.`);
    } else {
      $('#duration').text(`${parseInt(secondsLeft / (60 * 60))} hours left.`);
    }
  }
  async function updateBarAndScreen(progress, startTime) {
    updateScreen();
    const percentDone = 100 * progress;
    $('#bar').css('width', `${percentDone}%`);
    updateText(progress, startTime);
    await sleep(0);
  }
  function getSwapper(annealSteps) {
    // How many score points to a temperature point. Very arbitrary measure,
    // but in general, a low scoreToTemperature will result in a higher initial
    // temperature.
    const scoreToTemperature = 1e11;
    return new swapper(
        scoreToTemperature, field, width, height, sets, annealSteps,
        width * height);
  }
  async function generateDiagram() {
    $('#save').addClass("d-none");
    $('#options').addClass("d-none");
    $('#info').addClass("d-none");
    const annealSteps = 150;
    const closeSteps = 50;
    // How many iterateClose in a closeStep
    // The goal is to get (1 closeStep = 1 annealStep) in terms of run time.
    const closeMultiplier = 2;
    const startTime = performance.now();
    const totalSteps = annealSteps + closeSteps;
    swp = getSwapper(annealSteps);
    for (var i = 0; i < totalSteps; i++) {
      if (i < annealSteps) {
        // Run anneal steps
        swp.runSimulatedAnnealing();
      } else {
        // Run close steps
        for (var x = 0; x < closeMultiplier; x++) {
          iterateClose();
        }
      }
      await updateBarAndScreen(i / totalSteps, startTime);
    }
    $('#progress').addClass("d-none");
    $('#save').removeClass("d-none");
    $('#options').removeClass("d-none");
    $('#info').removeClass("d-none");
  }
  function outline() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    for (var i = 0; i < numberOfTypes; i++) {
      var mask = new IJS.Image(
          width, height,
          {bitDepth: 8, components: 1, alpha: 0, colorModel: 'GREY'});
      for (var j = 0; j < width * height; j++) {
        if (getBinaryString(field[j])[i] === '1') {
          mask.setValue(j, 0, 255);
        }
      }
      var iter = i == 0 ? i : numberOfTypes - i;
      mask = mask.open().close().morphologicalGradient({iterations: iter});
      var c = typeColors[i];
      for (var j = 0; j < width * height; j++) {
        if (mask.getValue(j, 0)) {
          var x = j % width;
          var y = Math.floor(j / height);
          paintPixel(x, y, c);
        }
      }
    }
  }
  function simpleOutline() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    for (var i = 0; i < numberOfTypes; i++) {
      var mask = new IJS.Image(
          width, height,
          {bitDepth: 8, components: 1, alpha: 0, colorModel: 'GREY'});
      for (var j = 0; j < width * height; j++) {
        if (getBinaryString(field[j])[i] === '1') {
          mask.setValue(j, 0, 255);
        }
      }
      mask = mask.open().close().morphologicalGradient();
      var c = typeColors[i];
      for (var j = 0; j < width * height; j++) {
        if (mask.getValue(j, 0)) {
          var x = j % width;
          var y = Math.floor(j / height);
          paintPixel(x, y, c);
        }
      }
    }
  }
  function saveData() {
    var state = {
      field: field,
      width: width,
      height: height,
      names: names,
      typeColors: typeColors,
      count: numberOfTypes,
      data: data,
    };
    $('<a />', {
      'download': 'data.json',
      'href':
          'data:application/json,' + encodeURIComponent(JSON.stringify(state))
    })
        .appendTo('body')
        .click(function() {
          $(this).remove();
        })[0]
        .click();
  }
  function resetSets() {
    var b = '';
    for (var i = 0; i < numberOfTypes; i++) {
      b += '0';
    }
    highlight(b);
    $('.typename').removeClass('inactive');
  }
  $('#clickOutline').click(outline);
  $('#clickSimpleOutline').click(simpleOutline);
  $('#clickSaveData').click(saveData);
  $('#clickResetSets').click(resetSets);

  function getPosition(event) {
    var rect = event.target.getBoundingClientRect();
    return {
      'x': Math.min(width - 1, event.clientX - rect.left + 1),
      'y': Math.min(height - 1, event.clientY - rect.top + 1)
    };
  }
  $('#diagram').mousemove(function(ev) {
    var pos = getPosition(ev);
    var v = field[parseInt(pos.x + pos.y * width)];
    var b = getBinaryString(v);
    for (var i = 0; i < numberOfTypes; i++) {
      if (b[i] == '1') {
        $('#type' + i).removeClass('inactive');
      } else {
        $('#type' + i).addClass('inactive');
      }
    }
    if (allZeros(b)) return;
    highlight(b);
  });
});
}(jQuery));