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
 * @fileoverview Manages the state of the world and scoring of current state.
 * Calculate the total score of the world by calculating the distance from each
 * point to the center of mass of similar colors.
 */
class scorer {
  constructor(field, width, height, sets) {
    this.field = field;
    this.width = width;
    this.height = height;
    this.sets = sets;
    this.nullCenter = {x: 0, y: 0, count: 0, value: -1};

    this.similarityIndex = this.buildSimilarityIndex();

    const centerOfMassDict = this.buildCenterOfMassDict();
    this.colorToCenterOfMass = centerOfMassDict[0];
    this.allPointsList = centerOfMassDict[1];
    this.xyToIndexInAllPoints = centerOfMassDict[2];

    this.totalScore = this.getTotalScore();
  }

  getLocation(x, y) {
    return {x: x, y: y, value: this.field[x + y * this.width]};
  }

  getRandomLocation() {
    const x = Math.floor((Math.random() * this.width));
    const y = Math.floor((Math.random() * this.height));
    return this.getLocation(x, y);
  }

  getPointPair() {
    const index = Math.floor((Math.random() * this.allPointsList.length));
    return [this.allPointsList[index], this.getRandomLocation()];
  }

  setLocation(x, y, value) {
    this.field[x + y * this.width] = value;
  }

  xyToStr(x, y) {
    const strX = x.toString();
    const strY = y.toString();
    return strX.concat(',').concat(strY);
  }

  pointToStr(p) {
    return this.xyToStr(p.x, p.y);
  }

  similarityBetweenSets(s1, s2) {
    let shareOne = false;
    let sharedDigits = 0;
    for (let i = 0; i < s1.length; i++) {
      if (s1.charAt(i) != s2.charAt(i)) {
        continue;
      }
      shareOne = shareOne || s1.charAt(i) == '1';
      sharedDigits++;
    }
    if (!shareOne) {
      return 0;
    }
    return sharedDigits / s1.length;
  }


  buildSimilarityIndex() {
    let valueToSet = {};
    let length =
        1;  // Sets is 1 indexed instead of 0, so our length is 1 longer.
    for (let setInBinary in this.sets) {
      valueToSet[parseInt(setInBinary, 2)] = setInBinary;
      length++;
    }

    let similarityIndex = {};
    for (let myColor = 1; myColor < length; myColor++) {
      for (let otherColor = myColor; otherColor < length; otherColor++) {
        let similarity = this.similarityBetweenSets(
            valueToSet[myColor], valueToSet[otherColor]);
        similarityIndex[this.xyToStr(myColor, otherColor)] = similarity;
        similarityIndex[this.xyToStr(otherColor, myColor)] = similarity;
      }
    }
    return similarityIndex;
  }

  distanceSqr(p1, p2) {
    const xDist = (p2.x - p1.x);
    const yDist = (p2.y - p1.y);
    return xDist * xDist + yDist * yDist;
  }

  distance(p1, p2) {
    return Math.pow(this.distanceSqr(p1, p2), 0.5);
  }

  // BELOW BEGINS NEW FUNCTIONS

  buildCenterOfMassDict() {
    let colorToSumX = {};
    let colorToSumY = {};
    let colorToCount = {};
    // allPointsList will contain every pixel that is not white and
    // xyToIndexInAllPoints will be the dictionary to index into that list.
    // These are analogous to colorToListOfPoints and xyToIndexInColorDict
    // respectively, but this scorer can store the points in a more general
    // manner, because the central piece of information is actually the
    // center of mass for scoring.
    let allPointsList = [];
    let xyToIndexInAllPoints = new Map();
    // The center of mass for a color is the sum of all positions for that color
    // divided by the total number of points for that color.
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        let point = this.getLocation(x, y);
        let color = point['value'];
        if (color == 0) {
          continue;
        }

        // Just append this point to allPointsList and update
        // xyToIndexInAllPoints.
        const newLen = allPointsList.push(point);
        xyToIndexInAllPoints.set(this.pointToStr(point), newLen - 1);

        if (!(color in colorToCount)) {
          colorToCount[color] = 0;
          colorToSumX[color] = 0;
          colorToSumY[color] = 0;
        }

        colorToSumX[color] += x;
        colorToSumY[color] += y;
        colorToCount[color] += 1;
      }
    }

    // Now that the sum has been calculated, the center of mass for each color
    // can be calculated as well.
    let colorToCenterOfMass = {};
    for (let color in colorToCount) {
      const count = colorToCount[color];
      colorToCenterOfMass[color] = {
        x: colorToSumX[color] / count,
        y: colorToSumY[color] / count,
        count: count,
        // Even though the center of mass is indexed by color, it needs to also
        // include color, as that will be used later in scoreSinglePoint.
        value: parseInt(color, 10)
      };
    }
    return [colorToCenterOfMass, allPointsList, xyToIndexInAllPoints];
  }

  // centerAfterSwap calculates the new center of mass if a pixel were to be
  // moved from one point to another.
  centerAfterSwap(center, oldPoint, newPoint) {
    const count = center.count;
    const newX = center.x - (oldPoint.x / count) + (newPoint.x / count);
    const newY = center.y - (oldPoint.y / count) + (newPoint.y / count);
    return {x: newX, y: newY, value: oldPoint.value, count: count};
  }

  // scoreSinglePoint calculates the score due to a single point: the weighted
  // sum of the distances from that point to every similar center of mass. Note
  // that two of the center of masses may be replaced by a proposed pair of
  // center of masses. Also, the color passed in may not match the color of the
  // point, and in that case, the argument color will be used instead of the
  // point's color. This is all so the function may be reused during a swap's
  // scoring.
  scoreSinglePoint(point, color, newCenterOne, newCenterTwo) {
    let score = 0;
    for (let otherColor in this.colorToCenterOfMass) {
      const similarity = this.similarityIndex[this.xyToStr(color, otherColor)];
      if (similarity == 0) {
        continue;
      }
      let centerOfMass = {};
      // If either of the newCenters match this color, use them instead. Note
      // that newCenterOne.value will never equal newCenterTwo.value because we
      // would never swap two points of the same color.
      if (otherColor == newCenterOne.value) {
        centerOfMass = newCenterOne;
      } else if (otherColor == newCenterTwo.value) {
        centerOfMass = newCenterTwo;
      } else {
        centerOfMass = this.colorToCenterOfMass[otherColor];
      }
      score += similarity * this.distanceSqr(point, centerOfMass) *
          centerOfMass.count;
    }
    return score;
  }

  getTotalScore() {
    let score = 0;
    // We want to use the color's current center, so just create one that will
    // always be ignored.
    for (let i = 0; i < this.allPointsList.length; i++) {
      const point = this.allPointsList[i];
      const color = point.value;
      score +=
          this.scoreSinglePoint(point, color, this.nullCenter, this.nullCenter);
    }
    return score;
  }

  scoreDeltaForPoint(point, otherPoint) {
    if (point.value == 0) {
      // Nothing changes for the score due to a white square as they are not
      // counted.
      return {before: 0, after: 0};
    }

    const newCenterPoint = this.centerAfterSwap(
        this.colorToCenterOfMass[point.value], point, otherPoint);

    // If the other point is not white, use the actual center for its color.
    // Otherwise, just use the ignored center.
    let newCenterOther = this.nullCenter;
    if (otherPoint.value != 0) {
      newCenterOther = this.centerAfterSwap(
          this.colorToCenterOfMass[otherPoint.value], otherPoint, point);
    }

    const scoreBefore = this.scoreSinglePoint(
        point, point.value, newCenterPoint, newCenterOther);
    const scoreAfter = this.scoreSinglePoint(
        otherPoint, point.value, newCenterPoint, newCenterOther);
    return {before: scoreBefore, after: scoreAfter};
  }

  // This function turns a point in the grid to white and erases the
  // corresponding entry in xyToIndexInColorDict, but does not update the score
  // as a result of the deletion of the point.
  deletePoint(p) {
    if (p.value == 0) {
      // Point will not be in the index
      return;
    }
    this.xyToIndexInAllPoints.delete(this.pointToStr(p));
    this.setLocation(p.x, p.y, 0);
  }

  setNewPosition(indexOfPoint, oldPoint, updatePoint, pointDelta) {
    if (oldPoint.value == 0) {
      // No one is keeping track of this point, so just return.
      return;
    }

    if (this.getLocation(oldPoint.x, oldPoint.y).value == oldPoint.value) {
      throw new Error(
          'Expected position at (' + this.pointToStr(oldPoint) +
          ') to have been deleted or changed before this call!');
    }

    const newPoint = {
      x: updatePoint.x,
      y: updatePoint.y,
      value: oldPoint.value
    };

    this.allPointsList[indexOfPoint] = newPoint;
    this.xyToIndexInAllPoints.set(this.pointToStr(updatePoint), indexOfPoint);

    const newCenter = this.centerAfterSwap(
        this.colorToCenterOfMass[oldPoint.value], oldPoint, updatePoint);
    this.colorToCenterOfMass[oldPoint.value] = newCenter;

    this.setLocation(newPoint.x, newPoint.y, newPoint.value);

    // This is only an approximation of the true score of the whole board,
    // because getting the true total score would require recalculating the
    // distance from every point to the new center of mass.
    this.totalScore += pointDelta.after - pointDelta.before;
  }

  swapPoints(p1, p2, p1Delta, p2Delta) {
    const indexOfP1 = this.xyToIndexInAllPoints.get(this.pointToStr(p1));
    const indexOfP2 = this.xyToIndexInAllPoints.get(this.pointToStr(p2));

    this.deletePoint(p1);
    this.deletePoint(p2);

    this.setNewPosition(indexOfP1, p1, p2, p1Delta);
    this.setNewPosition(indexOfP2, p2, p1, p2Delta);
  }
}

exports = scorer;
