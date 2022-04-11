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
 * @fileoverview Testing for the simulated annealing class.
 */
const field = [0, 0, 0, 1, 1, 1, 2, 2, 3];
const width = 3;
const height = 3;
const sets = {
  '100': 1500,
  '010': 1500,
  '001': 1500,
  '011': 1000,
  '101': 1000,
  '110': 1000,
  '111': 800,
};
const swp = new swapper(10, field, width, height, sets);

testSuite({
  testGetTemperature() {
    const correctFirst = 3;
    assertEquals(correctFirst, swp.getTemperature(1));

    const correctSecond = 1;
    assertEquals(correctSecond, swp.getTemperature(.5));
  },

  testProbabilityOfSwap() {
    const goodSwap = 1;
    assertEquals(goodSwap, swp.probabilityOfSwap(.5, 10, 1));

    const badSwap = 0.89482908;
    testUtil.compareFloats(badSwap, swp.probabilityOfSwap(.5, 1, 1.1));

    const veryBadSwap = 0;
    assertEquals(veryBadSwap, swp.probabilityOfSwap(.5, 1, 20));
  },

  testScoreAfterSwap() {
    const p1Delta = {before: 1, after: 2};
    const p2Delta = {before: 9, after: 3};
    const correctScore = 10.66666666;
    const actualScore = swp.scoreAfterSwap(p1Delta, p2Delta);
    testUtil.compareFloats(correctScore, actualScore);
  }

});
