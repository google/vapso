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
(function ($) {$(function() {
evil = {};
var width = 300;
var height = 300;
var canvasWidth = 100;
var canvasHeight = 100;
var numberOfTypes = 6; // max is 8
var outerIterations = 10;
var innerIterations = 10000;
var retriesWhenPlacing = 100;
var closeMagnitude = 3;
var backgroundColor = '#FFF';
var names = [
  'Musa acuminate',
  'Brachypodium distachyon',
  'Sorghum bicolor',
  'Oryza sativa',
  'Arabidopsis thaliana',
  'Phoenix dactylifera',
]
var typecolors = [
  $.Color('#FF0'),
  $.Color('#F00'),
  $.Color('#44F'),
  $.Color('#0FF'),
  $.Color('#F0F'),
  $.Color('#0F0'),
  $.Color('#8F8'),
  $.Color('#27D'),
];
var setz = [];
setz[3] = {
  '100' : 1500,
  '010' : 1500,
  '001' : 1500,
  '011' : 1000,
  '101' : 1000,
  '110' : 1000,
  '111' : 800,
};
setz[4] = {
  '1000' : 400,
  '0100' : 400,
  '0010' : 400,
  '0110' : 400,
  '1010' : 400,
  '1100' : 400,
  '1110' : 400,
  '0001' : 400,
  '1001' : 400,
  '0101' : 400,
  '0011' : 400,
  '0111' : 400,
  '1011' : 400,
  '1101' : 400,
  '1111' : 400,
};
setz[5] = {
  '10000' : 200,
  '01000' : 200,
  '00100' : 200,
  '11000' : 200,
  '10100' : 200,
  '01100' : 200,
  '11100' : 200,
  '00010' : 200,
  '10010' : 200,
  '01010' : 200,
  '00110' : 200,
  '11010' : 200,
  '10110' : 200,
  '01110' : 200,
  '11110' : 200,
  '00001' : 200,
  '10001' : 200,
  '01001' : 200,
  '00101' : 200,
  '11001' : 200,
  '10101' : 200,
  '01101' : 200,
  '11101' : 200,
  '00011' : 200,
  '10011' : 200,
  '01011' : 200,
  '00111' : 200,
  '11011' : 200,
  '10111' : 200,
  '01111' : 200,
  '11111' : 200,
};
setz[6] = {
  '100000' : 759,  // MBSOAP
  '010000' : 387,
  '001000' : 827,
  '110000' : 9,
  '101000' : 49,
  '011000' : 402,
  '111000' : 13,
  '000100' : 1246,
  '100100' : 29,
  '010100' : 547,
  '001100' : 1151,
  '110100' : 28,
  '101100' : 64,
  '011100' : 2809,
  '111100' : 368,
  '000010' : 1187, // MBSOAP
  '100010' : 155,
  '010010' : 10,
  '001010' : 9,
  '110010' : 7,
  '101010' : 21,
  '011010' : 14,
  '111010' : 54,
  '000110' : 6,
  '100110' : 13,
  '010110' : 18,
  '001110' : 40,
  '110110' : 29,
  '101110' : 71,
  '011110' : 206,
  '111110' : 1458,
  '000001' : 769, // MBSOAP
  '100001' : 467,
  '010001' : 25,
  '001001' : 49,
  '110001' : 12,
  '101001' : 19,
  '011001' : 23,
  '111001' : 24,
  '000101' : 32,
  '100101' : 35,
  '010101' : 12,
  '001101' : 42,
  '110101' : 18,
  '101101' : 62,
  '011101' : 190,
  '111101' : 685,
  '000011' : 105, // MBSOAP
  '100011' : 206,
  '010011' : 3,
  '001011' : 4,
  '110011' : 7,
  '101011' : 23,
  '011011' : 11,
  '111011' : 113,
  '000111' : 6,
  '100111' : 28,
  '010111' : 5,
  '001111' : 21,
  '110111' : 149,
  '101111' : 149,
  '011111' : 258,
  '111111' : 7674,
};
setz[8] = {
  '00000001': 10,
  '00000010': 10,
  '00000011': 10,
  '00000100': 10,
  '00000101': 10,
  '00000110': 10,
  '00000111': 10,
  '00001000': 10,
  '00001001': 10,
  '00001010': 10,
  '00001011': 10,
  '00001100': 10,
  '00001101': 10,
  '00001110': 10,
  '00001111': 10,
  '00010000': 10,
  '00010001': 10,
  '00010010': 10,
  '00010011': 10,
  '00010100': 10,
  '00010101': 10,
  '00010110': 10,
  '00010111': 10,
  '00011000': 10,
  '00011001': 10,
  '00011010': 10,
  '00011011': 10,
  '00011100': 10,
  '00011101': 10,
  '00011110': 10,
  '00011111': 10,
  '00100000': 10,
  '00100001': 10,
  '00100010': 10,
  '00100011': 10,
  '00100100': 10,
  '00100101': 10,
  '00100110': 10,
  '00100111': 10,
  '00101000': 10,
  '00101001': 10,
  '00101010': 10,
  '00101011': 10,
  '00101100': 10,
  '00101101': 10,
  '00101110': 10,
  '00101111': 10,
  '00110000': 10,
  '00110001': 10,
  '00110010': 10,
  '00110011': 10,
  '00110100': 10,
  '00110101': 10,
  '00110110': 10,
  '00110111': 10,
  '00111000': 10,
  '00111001': 10,
  '00111010': 10,
  '00111011': 10,
  '00111100': 10,
  '00111101': 10,
  '00111110': 10,
  '00111111': 10,
  '01000000': 10,
  '01000001': 10,
  '01000010': 10,
  '01000011': 10,
  '01000100': 10,
  '01000101': 10,
  '01000110': 10,
  '01000111': 10,
  '01001000': 10,
  '01001001': 10,
  '01001010': 10,
  '01001011': 10,
  '01001100': 10,
  '01001101': 10,
  '01001110': 10,
  '01001111': 10,
  '01010000': 10,
  '01010001': 10,
  '01010010': 10,
  '01010011': 10,
  '01010100': 10,
  '01010101': 10,
  '01010110': 10,
  '01010111': 10,
  '01011000': 10,
  '01011001': 10,
  '01011010': 10,
  '01011011': 10,
  '01011100': 10,
  '01011101': 10,
  '01011110': 10,
  '01011111': 10,
  '01100000': 10,
  '01100001': 10,
  '01100010': 10,
  '01100011': 10,
  '01100100': 10,
  '01100101': 10,
  '01100110': 10,
  '01100111': 10,
  '01101000': 10,
  '01101001': 10,
  '01101010': 10,
  '01101011': 10,
  '01101100': 10,
  '01101101': 10,
  '01101110': 10,
  '01101111': 10,
  '01110000': 10,
  '01110001': 10,
  '01110010': 10,
  '01110011': 10,
  '01110100': 10,
  '01110101': 10,
  '01110110': 10,
  '01110111': 10,
  '01111000': 10,
  '01111001': 10,
  '01111010': 10,
  '01111011': 10,
  '01111100': 10,
  '01111101': 10,
  '01111110': 10,
  '01111111': 10,
  '10000000': 10,
  '10000001': 10,
  '10000010': 10,
  '10000011': 10,
  '10000100': 10,
  '10000101': 10,
  '10000110': 10,
  '10000111': 10,
  '10001000': 10,
  '10001001': 10,
  '10001010': 10,
  '10001011': 10,
  '10001100': 10,
  '10001101': 10,
  '10001110': 10,
  '10001111': 10,
  '10010000': 10,
  '10010001': 10,
  '10010010': 10,
  '10010011': 10,
  '10010100': 10,
  '10010101': 10,
  '10010110': 10,
  '10010111': 10,
  '10011000': 10,
  '10011001': 10,
  '10011010': 10,
  '10011011': 10,
  '10011100': 10,
  '10011101': 10,
  '10011110': 10,
  '10011111': 10,
  '10100000': 10,
  '10100001': 10,
  '10100010': 10,
  '10100011': 10,
  '10100100': 10,
  '10100101': 10,
  '10100110': 10,
  '10100111': 10,
  '10101000': 10,
  '10101001': 10,
  '10101010': 10,
  '10101011': 10,
  '10101100': 10,
  '10101101': 10,
  '10101110': 10,
  '10101111': 10,
  '10110000': 10,
  '10110001': 10,
  '10110010': 10,
  '10110011': 10,
  '10110100': 10,
  '10110101': 10,
  '10110110': 10,
  '10110111': 10,
  '10111000': 10,
  '10111001': 10,
  '10111010': 10,
  '10111011': 10,
  '10111100': 10,
  '10111101': 10,
  '10111110': 10,
  '10111111': 10,
  '11000000': 10,
  '11000001': 10,
  '11000010': 10,
  '11000011': 10,
  '11000100': 10,
  '11000101': 10,
  '11000110': 10,
  '11000111': 10,
  '11001000': 10,
  '11001001': 10,
  '11001010': 10,
  '11001011': 10,
  '11001100': 10,
  '11001101': 10,
  '11001110': 10,
  '11001111': 10,
  '11010000': 10,
  '11010001': 10,
  '11010010': 10,
  '11010011': 10,
  '11010100': 10,
  '11010101': 10,
  '11010110': 10,
  '11010111': 10,
  '11011000': 10,
  '11011001': 10,
  '11011010': 10,
  '11011011': 10,
  '11011100': 10,
  '11011101': 10,
  '11011110': 10,
  '11011111': 10,
  '11100000': 10,
  '11100001': 10,
  '11100010': 10,
  '11100011': 10,
  '11100100': 10,
  '11100101': 10,
  '11100110': 10,
  '11100111': 10,
  '11101000': 10,
  '11101001': 10,
  '11101010': 10,
  '11101011': 10,
  '11101100': 10,
  '11101101': 10,
  '11101110': 10,
  '11101111': 10,
  '11110000': 10,
  '11110001': 10,
  '11110010': 10,
  '11110011': 10,
  '11110100': 10,
  '11110101': 10,
  '11110110': 10,
  '11110111': 10,
  '11111000': 10,
  '11111001': 10,
  '11111010': 10,
  '11111011': 10,
  '11111100': 10,
  '11111101': 10,
  '11111110': 10,
  '11111111': 10,
};
var sets = setz[numberOfTypes];
var paintPixel = function(x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x,y,1,1);
};
var randomInt = function(top) {
  return Math.floor((Math.random() * top));
};
var placeElementRandomly = function(field, typestamp) {
  for (var i=0; i<retriesWhenPlacing; i++) {
    var x = randomInt(width);
    var y = randomInt(height);
    var pos = x + y*width;
    var v = field[pos];
    if (v!=0) continue;
    field[pos] = typestamp;
    return;
  }
  console.log('failed to place element', typestamp);
}
var getTypestamp = function(name) {
  return parseInt(name, 2);
}
var initField = function(sets) {
  field = new Uint8ClampedArray(width*height);
  $.each(sets, function(name, count) {
    var typestamp = getTypestamp(name);
    for (var i=0; i < count; i++) {
      placeElementRandomly(field, typestamp);
    }
  });
  return field;
};
var initCanvas = function() {
  for (var i=0; i<numberOfTypes; i++) {
    var name = 'Type ' + i;
    if (names !== undefined) {
      if (names[i] !== undefined) {
        name = names[i];
      }
    }
    var color = typecolors[i];
    $('#reset').before('<div id="type' + i + '" class="typename">' +
      '<span style="background-color:' + color + '">&nbsp;&nbsp;</span> ' +
      name + '</div>')
  }
  $('.typename').mouseenter(function(ev) {
    var s = parseInt(ev.target.id.slice(-1));
    var b = '';
    for (var i=0; i<numberOfTypes; i++) {
      if (i==s) {
        b += '1';
      } else {
        b += '0';
      }
    }
    highlight(b);
    $('.typename').addClass('inactive');
    $('#type' + s).removeClass('inactive');
  });
  $('#left').append('<canvas id="main" height="' + height + '" width="' + width + '" />');
  ctx = document.getElementById("main").getContext("2d");
  return ctx;
};
var calculateCenters = function() {
  var result = [];
  for (var c=0; c < numberOfTypes; c++) {
    var sumX = 0;
    var sumY = 0;
    var count = 0;
    for (var y=0; y < height; y++) {
      for (var x=0; x < width; x++) {
        var b = getBinaryString(field[x+y*width]);
        if (b[c] == '1') {
          sumX += x;
          sumY += y;
          count += 1;
        }
      }
    }
    var x = Math.floor(sumX/count);
    var y = Math.floor(sumY/count);
    result.push({'x': x, 'y': y});
  }
  return result;
};
var getLocation = function(x, y) {
  return {'x': x, 'y': y, 'value': field[x+y*width]};
}
var getRandomLocation = function() {
  var x = randomInt(width);
  var y = randomInt(height);
  return getLocation(x, y);
};
var clamp = function(x, min, max) {
  return Math.max(min, Math.min(max, x));
};
var getCloseLocation = function(other) {
  var x = other.x + randomInt(2*closeMagnitude+1) - closeMagnitude;
  x = clamp(x, 0, width-1);
  var y = other.y + randomInt(2*closeMagnitude+1) - closeMagnitude;
  y = clamp(y, 0, height-1);
  return getLocation(x, y);
};
var cost = function(p, centers) {
  var cost = 0;
  for (var i=0; i<numberOfTypes; i++) {
    var b = getBinaryString(p.value);
    if (b[i] == '1') {
      cost += Math.pow(centers[i].x-p.x,2) + Math.pow(centers[i].y-p.y,2);
    }
  }
  return cost;
};
var getBinaryString = function(number) {
  var b = number.toString(2);
  b = ("00000000" + b).substr(-1*numberOfTypes,numberOfTypes);
  return b;
};
var getColor = function(typestamp, colors, high) {
  var b = getBinaryString(typestamp);
  if (!(b in sets)) return -1;
  var allcolors = [];
  for (var i=0; i<numberOfTypes; i++) {
    if (b[i]=='1') {
      allcolors.push(colors[i]);
    }
  }
  var mix = Color_mixer.mix(allcolors);
  if (high === undefined) return mix;
  var hi = true;
  for (var i=0; i<numberOfTypes; i++) {
    if ((b[i] == '0') && (high[i] == '1')) hi = false;
  }
  if (!hi) {
    mix = Color_mixer.mix(mix, $.Color('#000'));
  }
  return mix;
};
var anyOne = function(mask, is) {
  for (var i=0; i<numberOfTypes; i++) {
    if ((mask[i]=='1') && (is[i]=='0'))
      return false;
  }
  return true;
}
var displayCount = function(b) {
  if (b===undefined)  {
    b = '';
    for (var i=0; i<numberOfTypes; i++) {
      b += '0';
    }
  }
  var sum = 0;
  $.each(sets, function(i, s) {
    if (anyOne(b, i)) {
      sum += s;
    }
  });
  $('#count').html(sum + ' elements');
};
var paint = function(ctx, field, colors, high) {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  for (var i = 0; i<width*height; i++) {
    var typestamp = field[i];
    var x = i % width;
    var y = Math.floor(i / height);
    var c = getColor(typestamp, colors, high);
    if (c==-1) continue;
    paintPixel(x, y, c);
  }
  displayCount(high);
};
var switchIfBetter = function(p1, p2, centers) {
  if (p1.value == p2.value) { return false; }
  var costIs = cost(p1, centers) + cost(p2, centers);
  var costNew = cost({'x': p1.x, 'y': p1.y, 'value': p2.value}, centers) + cost({'x': p2.x, 'y': p2.y, 'value': p1.value}, centers);
  if (costIs <= costNew) { return false; }
  field[p1.x+p1.y*width] = p2.value;
  field[p2.x+p2.y*width] = p1.value;
  return true;
};
var randomIterationClose = function(centers) {
  var p1 = getRandomLocation();
  var p2 = getCloseLocation(p1);
  switchIfBetter(p1, p2, centers);
};
var randomIterationFar = function(centers) {
  var p1 = getRandomLocation();
  var p2 = getRandomLocation();
  switchIfBetter(p1, p2, centers);
};
var randomIteration = function(centers) {
  randomIterationClose(centers);
  randomIterationFar(centers);
};
var iterate = function(f) {
  for (var j=0; j<outerIterations; j++) {
     var centers = calculateCenters();
    for (var i=0; i<innerIterations; i++) {
      f(centers);
    }
  }
  updateScreen();
};
var iterateClose = function() {
  iterate(randomIterationClose);
};
var iterateFar = function() {
  iterate(randomIterationFar);
};
var highlight = function(bintype) {
  paint(ctx, field, typecolors, bintype);
};
var allZeros = function(b) {
  for (var i=0; i<numberOfTypes; i++) {
    if (b[i]=='1') return false;
  }
  return true;
}
var updateScreen = function() {
  $('.typename').removeClass('inactive');
  paint(ctx, field, typecolors);
}
var simulateAnneal = function() {
  // This argument is deprecated
  const scoreToTemperature = 5000;
  // How many times each individual point will, on average, be the first point
  // in a swap.
  const stepsPerPoint = 1500;
  // The total number of steps to be done
  const totalSteps = width*height*stepsPerPoint;
  const swp = new swapper(scoreToTemperature, field, width, height, sets);
  swp.runSimulatedAnnealing(totalSteps);
  updateScreen();
}
var field = initField(sets);
var ctx = initCanvas();
paint(ctx, field, typecolors);
$('#clickClose').click(iterateClose);
$('#clickFar').click(iterateFar);
$('#clickAnneal').click(simulateAnneal);
  var getPosition = function(event) {
    var rect = event.target.getBoundingClientRect();
  return { 'x': Math.min(width-1, event.clientX-rect.left+1),
       'y': Math.min(height-1, event.clientY-rect.top+1) }
}
$('#main').mousemove(function (ev) {
   var pos = getPosition(ev);
  var v = field[pos.x + pos.y*width];
  var b = getBinaryString(v);
  for (var i=0; i<numberOfTypes; i++) {
    if (b[i]=='1') {
      $('#type' + i).removeClass('inactive');
    } else {
      $('#type' + i).addClass('inactive');
    }
  }
  if (allZeros(b)) return;
  highlight(b);
});
$('#reset').mouseenter(function (ev) {
  var b='';
  for (var i=0; i<numberOfTypes; i++) {
    b += '0';
  }
  highlight(b);
  $('.typename').removeClass('inactive');
})
evil.field = field;
evil.iterateClose = iterateClose;
evil.iterateFar = iterateFar;
evil.calculateCenters = calculateCenters;
evil.randomIteration = randomIteration;
});}(jQuery));
