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
 * @fileoverview Testing for the state management class.
 */
// Many of these tests will fail because scorer is using the
// distanceSqr function instead of the distance function currently, but the
// correct scores here were calculated using the distance function.

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
const sim = new scorer(field, width, height, sets);

testSuite({
  testBuildCenterOfMassDict() {
    const centerOfMassDict = sim.buildCenterOfMassDict();
    const colorToCenterOfMass = centerOfMassDict[0];
    const allPointsList = centerOfMassDict[1];
    const xyToIndexInAllPoints = centerOfMassDict[2];

    const correctCCM = {
      1: {x: 1, y: 1, count: 3, value: 1},
      2: {x: .5, y: 2, count: 2, value: 2},
      3: {x: 2, y: 2, count: 1, value: 3}
    };

    const correctAPL = [
      {x: 0, y: 1, value: 1}, {x: 0, y: 2, value: 2}, {x: 1, y: 1, value: 1},
      {x: 1, y: 2, value: 2}, {x: 2, y: 1, value: 1}, {x: 2, y: 2, value: 3}
    ];

    const correctIAL =
        {'0,1': 0, '0,2': 1, '1,1': 2, '1,2': 3, '2,1': 4, '2,2': 5};

    assertEquals(0, sim.getLocation(0, 0).value);
    testUtil.compareCCM(correctCCM, colorToCenterOfMass);
    testUtil.compareAPL(correctAPL, allPointsList);
    testUtil.compareObjects(correctIAL, xyToIndexInAllPoints);
  },

  testCenterAfterSwap() {
    const center = {x: .5, y: 2, count: 2, value: 2};
    const oldPoint = {x: 0, y: 2, value: 2};
    const newPoint = {x: 1, y: 0, value: 2};
    const centerAfter = sim.centerAfterSwap(center, oldPoint, newPoint);

    const correctCA = {x: 1, y: 1, count: 2, value: 2};

    testUtil.compareObjects(correctCA, centerAfter);
  },

  testScoreSinglePoint() {
    const point = {x: 1, y: 1, count: 3, value: 1};
    const color = 1;
    const ignoredCenter = {x: 0, y: 0, count: 0, value: -1};

    const score =
        sim.scoreSinglePoint(point, color, ignoredCenter, ignoredCenter);

    const correctScore = 1.33333333;

    testUtil.compareFloats(correctScore, score);
  },

  testScoreSinglePointChangedColor() {
    const point = {x: 1, y: 1, count: 3, value: 2};
    const color = 1;
    const ignoredCenter = {x: 0, y: 0, count: 2, value: -1};

    const score =
        sim.scoreSinglePoint(point, color, ignoredCenter, ignoredCenter);

    const correctScore = 1.33333333;

    testUtil.compareFloats(correctScore, score);
  },

  testScoreSinglePointNewPoints() {
    const point = {x: 1, y: 1, count: 3, value: 2};
    const color = 1;
    const newCenterOne = {x: 1.5, y: .5, count: 3, value: 1};
    const newCenterTwo = {x: 2, y: 2, count: 2, value: 2};

    const score =
        sim.scoreSinglePoint(point, color, newCenterOne, newCenterTwo);

    const correctScore = 2.83333333;

    testUtil.compareFloats(correctScore, score);
  },

  testGetTotalScore() {
    const score = sim.getTotalScore();

    const correctScore = 22.66666666;

    testUtil.compareFloats(correctScore, score);
  },

  testScoreDeltaForPoint() {
    const p1 = {x: 1, y: 2, value: 2};
    const p2 = {x: 2, y: 2, value: 3};
    const correctDelta = {before: 0, after: 2.66666666};
    const actualDelta = sim.scoreDeltaForPoint(p1, p2);
    testUtil.compareDelta(correctDelta, actualDelta);
  },

  testScoreDeltaForPointP1White() {
    const p1 = {x: 0, y: 0, value: 0};
    const p2 = {x: 2, y: 2, value: 3};
    const correctDelta = {before: 0, after: 0};
    const actualDelta = sim.scoreDeltaForPoint(p1, p2);
    testUtil.compareDelta(correctDelta, actualDelta);
  },

  testScoreDeltaForPointP2White() {
    const p1 = {x: 2, y: 2, value: 3};
    const p2 = {x: 0, y: 0, value: 0};
    const correctDelta = {before: 15, after: 9.66666666};
    const actualDelta = sim.scoreDeltaForPoint(p1, p2);
    testUtil.compareDelta(correctDelta, actualDelta);
  },

  testDeletePoint() {
    const mutableField = [0, 0, 0, 1, 1, 1, 2, 2, 3];
    const mutableSim = new scorer(mutableField, width, height, sets);

    const correctIAL = {'0,1': 0, '0,2': 1, '1,1': 2, '1,2': 3, '2,1': 4};
    const correctField = [0, 0, 0, 1, 1, 1, 2, 2, 0];

    const p = {x: 2, y: 2, value: 3};
    mutableSim.deletePoint(p);

    testUtil.compareObjects(correctIAL, mutableSim.xyToIndexInAllPoints);
    testUtil.compareField(correctField, mutableSim.field);
  },

  // testSetNewPosition is a very narrow test with a lot of caveats as it is the
  // barebone test for this function. Testing this function alone does not make
  // sense, because it should only be called in pairs. For a more complete test
  // of setNewPosition's functionality, look at testSwapPoints.
  testSetNewPosition() {
    const mutableField = [0, 0, 0, 1, 1, 1, 2, 2, 3];
    const mutableSim = new scorer(mutableField, width, height, sets);

    const indexOfPoint = 5;
    const oldPoint = {x: 2, y: 2, value: 3};
    // It is out of scope for setNewPosition to manage the change in score and
    // field of a second point, so we use a white point as a our second point in
    // order to get an accurate reading.
    const newPoint = {x: 0, y: 0, value: 0};
    const pointDelta = {before: 4.82842712, after: 8.40559133};

    // We call this because it is out of setNewPosition's contract to call it
    // and because setNewPosition requires it to be called first. Still, we do
    // test that it is called.
    mutableSim.deletePoint(oldPoint);
    mutableSim.setNewPosition(indexOfPoint, oldPoint, newPoint, pointDelta);

    const correctCCM = {
      1: {x: 1, y: 1, count: 3, value: 1},
      2: {x: .5, y: 2, count: 2, value: 2},
      3: {x: 0, y: 0, count: 1, value: 3}
    };

    const correctAPL = [
      {x: 0, y: 1, value: 1}, {x: 0, y: 2, value: 2}, {x: 1, y: 1, value: 1},
      {x: 1, y: 2, value: 2}, {x: 2, y: 1, value: 1}, {x: 0, y: 0, value: 3}
    ];

    const correctIAL =
        {'0,1': 0, '0,2': 1, '1,1': 2, '1,2': 3, '2,1': 4, '0,0': 5};

    const correctScore = 26.24383087;
    const correctField = [3, 0, 0, 1, 1, 1, 2, 2, 0];

    testUtil.compareCCM(correctCCM, mutableSim.colorToCenterOfMass);
    testUtil.compareAPL(correctAPL, mutableSim.allPointsList);
    testUtil.compareObjects(correctIAL, mutableSim.xyToIndexInAllPoints);
    testUtil.compareField(correctField, mutableSim.field);
    testUtil.compareFloats(correctScore, mutableSim.totalScore);
  },

  testSetNewPositionError() {
    const mutableField = [0, 0, 0, 1, 1, 1, 2, 2, 3];
    const mutableSim = new scorer(mutableField, width, height, sets);

    const indexOfPoint = [3, 0];
    const oldPoint = {x: 2, y: 2, value: 3};
    const newPoint = {x: 0, y: 0, value: 0};
    const pointDelta = {before: 4.82842712, after: 8.40559133};

    assertThrows(
        () => mutableSim.setNewPosition(
            indexOfPoint, oldPoint, newPoint, pointDelta));
  },

  testSwapPoints() {
    const mutableField = [0, 0, 0, 1, 1, 1, 2, 2, 3];
    const mutableSim = new scorer(mutableField, width, height, sets);

    const p1 = {x: 1, y: 2, value: 2};
    const p2 = {x: 2, y: 2, value: 3};
    const p1Delta = {before: 1.66666666, after: 4};
    const p2Delta = {before: 8.66666666, after: 4};
    mutableSim.swapPoints(p1, p2, p1Delta, p2Delta);

    const correctCCM = {
      1: {x: 1, y: 1, count: 3, value: 1},
      2: {x: 1, y: 2, count: 2, value: 2},
      3: {x: 1, y: 2, count: 1, value: 3}
    };

    const correctAPL = [
      {x: 0, y: 1, value: 1}, {x: 0, y: 2, value: 2}, {x: 1, y: 1, value: 1},
      {x: 2, y: 2, value: 2}, {x: 2, y: 1, value: 1}, {x: 1, y: 2, value: 3}
    ];

    const correctIAL =
        {'0,1': 0, '0,2': 1, '1,1': 2, '2,2': 3, '2,1': 4, '1,2': 5};

    const correctScore = 20.33333334;
    const correctField = [0, 0, 0, 1, 1, 1, 2, 3, 2];

    testUtil.compareCCM(correctCCM, mutableSim.colorToCenterOfMass);
    testUtil.compareAPL(correctAPL, mutableSim.allPointsList);
    testUtil.compareObjects(correctIAL, mutableSim.xyToIndexInAllPoints);
    testUtil.compareField(correctField, mutableSim.field);
    testUtil.compareFloats(correctScore, mutableSim.totalScore);
  },
});
