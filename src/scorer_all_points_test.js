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
  testGetLocation() {
    testUtil.compareObjects(sim.getLocation(2, 2), {x: 2, y: 2, value: 3});
  },

  testSetLocation() {
    const mutableField = [0, 0, 0, 1, 1, 1, 2, 2, 3];
    const mutableSim = new scorer(mutableField, width, height, sets);

    const correctField = [0, 0, 0, 1, 1, 1, 2, 2, 4];

    mutableSim.setLocation(2, 2, 4);

    testUtil.compareField(correctField, mutableSim.field);
  },

  testXYToStr() {
    assertEquals(sim.xyToStr(0, 5), '0,5');
  },

  testPointToStr() {
    assertEquals(sim.pointToStr({x: 0, y: 5, value: 0}), '0,5');
  },

  testBuildColorDict() {
    const colorDict = sim.buildColorDict();
    const colorToListOfPoints = colorDict[0];
    const xyToIndexInColorDict = colorDict[1];

    const correctCLP = [
      [],
      [{x: 0, y: 1, value: 1}, {x: 1, y: 1, value: 1}, {x: 2, y: 1, value: 1}],
      [{x: 0, y: 2, value: 2}, {x: 1, y: 2, value: 2}], [{x: 2, y: 2, value: 3}]
    ];

    const correctICD = {
      '0,1': [1, 0],
      '1,1': [1, 1],
      '2,1': [1, 2],
      '0,2': [2, 0],
      '1,2': [2, 1],
      '2,2': [3, 0]
    };

    testUtil.compareCLP(correctCLP, colorToListOfPoints);
    testUtil.compareICD(correctICD, xyToIndexInColorDict);
  },

  testBuildSimilarityIndex() {
    const correctSI = {
      '1,1': 1,
      '1,2': 0,
      '1,3': 0.6666666666666666,
      '1,4': 0,
      '1,5': 0.6666666666666666,
      '1,6': 0,
      '1,7': 0.3333333333333333,
      '2,1': 0,
      '2,2': 1,
      '2,3': 0.6666666666666666,
      '2,4': 0,
      '2,5': 0,
      '2,6': 0.6666666666666666,
      '2,7': 0.3333333333333333,
      '3,1': 0.6666666666666666,
      '3,2': 0.6666666666666666,
      '3,3': 1,
      '3,4': 0,
      '3,5': 0.3333333333333333,
      '3,6': 0.3333333333333333,
      '3,7': 0.6666666666666666,
      '4,1': 0,
      '4,2': 0,
      '4,3': 0,
      '4,4': 1,
      '4,5': 0.6666666666666666,
      '4,6': 0.6666666666666666,
      '4,7': 0.3333333333333333,
      '5,1': 0.6666666666666666,
      '5,2': 0,
      '5,3': 0.3333333333333333,
      '5,4': 0.6666666666666666,
      '5,5': 1,
      '5,6': 0.3333333333333333,
      '5,7': 0.6666666666666666,
      '6,1': 0,
      '6,2': 0.6666666666666666,
      '6,3': 0.3333333333333333,
      '6,4': 0.6666666666666666,
      '6,5': 0.3333333333333333,
      '6,6': 1,
      '6,7': 0.6666666666666666,
      '7,1': 0.3333333333333333,
      '7,2': 0.3333333333333333,
      '7,3': 0.6666666666666666,
      '7,4': 0.3333333333333333,
      '7,5': 0.6666666666666666,
      '7,6': 0.6666666666666666,
      '7,7': 1
    };
    testUtil.compareObjects(correctSI, sim.buildSimilarityIndex());
  },

  testDistanceSqr() {
    const dist = sim.distanceSqr({x: 0, y: 0}, {x: 3, y: 4});
    const correct = 25;
    assertEquals(correct, dist);
  },

  testScoreColorSinglePoint() {
    const color = 1;
    const points = [
      {x: 0, y: 1, value: 1}, {x: 1, y: 1, value: 1}, {x: 2, y: 1, value: 1}
    ];
    const similarity = 0.75;
    const indexOfPoint = [1, 0];
    const point = {x: 1, y: 1, value: 1};
    const score = sim.scoreColorSinglePoint(
        points, similarity, color, indexOfPoint, point);
    // Distance calculated is distance squared. Calculate ignores first point,
    // distance to second point is 0, distance to second is 1. Final score is
    // total score * similarity, so we end up with 0.75.
    const correctScore = 0.75;
    assertEquals(correctScore, score);
  },

  testScoreSinglePointRegular() {
    const indexOfPoint = [1, 0];
    const point = {x: 1, y: 1, value: 1};
    // As above for color 1 but using actual similarity of 1. We do not count
    // anything for color 2. Score for three is calculated using similarity of
    // 1/3.
    const correctScore = 1 * 1 + 0 + (2) * 2 / 3;
    const diff = correctScore - sim.scoreSinglePoint(indexOfPoint, point);
    assertEquals(true, Math.abs(diff) < 1E-6);
  },

  testScoreSinglePointSwapped() {
    const indexOfPoint = [1, 0];
    const point = {x: 1, y: 1, value: 2};
    // Though the point has a different color than above, it should have the
    // same score, because the scorer should look at the index, not the point
    // itself.
    const correctScore = 1 * 1 + 0 + (2) * 2 / 3;
    const diff = correctScore - sim.scoreSinglePoint(indexOfPoint, point);
    assertEquals(true, Math.abs(diff) < 1E-6);
  },

  testGetTotalScore() {
    const correctScore = 15.66666666;
    const diff = correctScore - sim.getTotalScore();
    assertEquals(true, Math.abs(diff) < 1E-6);
  },

  testGetIndexOfPoint() {
    const correctIndex = [3, 0];
    const indexOfPoint = sim.getIndexOfPoint({x: 2, y: 2, value: 3});
    for (let i = 0; i < correctIndex.length; i++) {
      assertEquals(correctIndex[i], indexOfPoint[i]);
    }
  },

  testScoreDeltaForPoint() {
    const p1 = {x: 1, y: 2, value: 2};
    const p2 = {x: 2, y: 2, value: 3};
    const correctDelta = {before: 1.66666666, after: 4};
    const actualDelta = sim.scoreDeltaForPoint(p1, p2);
    testUtil.compareDelta(correctDelta,actualDelta);
  },

  testScoreDeltaForPointP1White() {
    const p1 = {x: 0, y: 0, value: 0};
    const p2 = {x: 2, y: 2, value: 3};
    const correctDelta = {before: 0, after: 0};
    const actualDelta = sim.scoreDeltaForPoint(p1, p2);
    testUtil.compareDelta(correctDelta,actualDelta);
  },

  testScoreDeltaForPointP2White() {
    const p1 = {x: 2, y: 2, value: 3};
    const p2 = {x: 0, y: 0, value: 0};
    const correctDelta = {before: 8.66666666, after: 11.33333333};
    const actualDelta = sim.scoreDeltaForPoint(p1, p2);
    testUtil.compareDelta(correctDelta,actualDelta);
  },

  testDeletePoint() {
    const mutableField = [0, 0, 0, 1, 1, 1, 2, 2, 3];
    const mutableSim = new scorer(mutableField, width, height, sets);

    const correctICD = {
      '0,1': [1, 0],
      '1,1': [1, 1],
      '2,1': [1, 2],
      '0,2': [2, 0],
      '1,2': [2, 1],
    };
    const correctField = [0, 0, 0, 1, 1, 1, 2, 2, 0];

    const p = {x: 2, y: 2, value: 3};
    mutableSim.deletePoint(p);

    testUtil.compareICD(correctICD, mutableSim.xyToIndexInColorDict);
    testUtil.compareField(correctField, mutableSim.field);
  },

  // testSetNewPosition is a very narrow test with a lot of caveats as it is the
  // barebone test for this function. Testing this function alone does not make
  // sense, because it should only be called in pairs. For a more complete test
  // of setNewPosition's functionality, look at testSwapPoints.
  testSetNewPosition() {
    const mutableField = [0, 0, 0, 1, 1, 1, 2, 2, 3];
    const mutableSim = new scorer(mutableField, width, height, sets);

    const indexOfPoint = [3, 0];
    const oldPoint = {x: 2, y: 2, value: 3};
    // It is out of scope for setNewPosition to manage the change in score and
    // field of a second point, so we use a white point as a our second point in
    // order to get an accurate reading.
    const newPoint = {x: 0, y: 0, value: 0};
    const pointDelta = {before: 8.66666666, after: 11.33333333};

    // We call this because it is out of setNewPosition's contract to call it
    // and because setNewPosition requires it to be called first. Still, we do
    // test that it is called.
    mutableSim.deletePoint(oldPoint);
    mutableSim.setNewPosition(indexOfPoint, oldPoint, newPoint, pointDelta);

    const correctCLP = [
      [],
      [{x: 0, y: 1, value: 1}, {x: 1, y: 1, value: 1}, {x: 2, y: 1, value: 1}],
      [{x: 0, y: 2, value: 2}, {x: 1, y: 2, value: 2}], [{x: 0, y: 0, value: 3}]
    ];
    const correctICD = {
      '0,0': [3, 0],
      '0,1': [1, 0],
      '0,2': [2, 0],
      '1,1': [1, 1],
      '1,2': [2, 1],
      '2,1': [1, 2]
    };
    const correctScore = 18.33333333;
    const correctField = [3, 0, 0, 1, 1, 1, 2, 2, 0];

    testUtil.compareCLP(correctCLP, mutableSim.colorToListOfPoints);
    testUtil.compareICD(correctICD, mutableSim.xyToIndexInColorDict);
    testUtil.compareField(correctField, mutableSim.field);
    testUtil.compareFloats(correctScore, mutableSim.totalScore);
  },

  testSetNewPositionError() {
    const mutableField = [0, 0, 0, 1, 1, 1, 2, 2, 3];
    const mutableSim = new scorer(mutableField, width, height, sets);

    const indexOfPoint = [3, 0];
    const oldPoint = {x: 2, y: 2, value: 3};
    const newPoint = {x: 0, y: 0, value: 0};
    const pointDelta = {before: 8.66666666, after: 11.33333333};

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
    mutableSim.swapPoints(p1,p2,p1Delta,p2Delta);

    const correctCLP = [
      [],
      [{x: 0, y: 1, value: 1}, {x: 1, y: 1, value: 1}, {x: 2, y: 1, value: 1}],
      [{x: 0, y: 2, value: 2}, {x: 2, y: 2, value: 2}], [{x: 1, y: 2, value: 3}]
    ];
    const correctICD = {
      '0,1': [1, 0],
      '1,1': [1, 1],
      '2,1': [1, 2],
      '0,2': [2, 0],
      '1,2': [3, 0],
      '2,2': [2, 1]
    };
    const correctScore = 13.33333334;
    const correctField = [0, 0, 0, 1, 1, 1, 2, 3, 2];

    testUtil.compareCLP(correctCLP, mutableSim.colorToListOfPoints);
    testUtil.compareICD(correctICD, mutableSim.xyToIndexInColorDict);
    testUtil.compareField(correctField, mutableSim.field);
    testUtil.compareFloats(correctScore, mutableSim.totalScore);
  }
});
