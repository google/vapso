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
 * point to every other point of similar color.
 */

class scorer {
  constructor(field, width, height, sets) {
    this.field = field;
    this.width = width;
    this.height = height;
    this.sets = sets;
    const colorDict = this.buildColorDict();
    this.colorToListOfPoints = colorDict[0];
    this.xyToIndexInColorDict = colorDict[1];
    this.similarityIndex = this.buildSimilarityIndex();
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
    return [this.getRandomLocation(), this.getRandomLocation()];
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

  // Create a dictionary that maps colors to all points of that color and also a
  // reverse-map which maps pixels to their position in the first dictionary.
  buildColorDict() {
    let colorToListOfPoints = {};
    let xyToIndexInColorDict = {};

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        let point = this.getLocation(x, y);
        let color = point['value'];
        // Do not keep track of white pixels
        if (color == 0) {
          continue;
        }
        if (!(color in colorToListOfPoints)) {
          colorToListOfPoints[color] = [];
        }
        let index = colorToListOfPoints[color].length;
        colorToListOfPoints[color].push(point);
        // We want to be able to index in uniquely for each pixel, so combine
        // the point's x and y into a string.
        let xy = this.pointToStr(point);
        // xy represents a pixel in the chart, which may be of any color.
        // That pixel will always exist, though it may index to a different
        // point, because the point could possibly change color (even if it does
        // not change positions).
        xyToIndexInColorDict[xy] = [color, index];
      }
    }

    return [colorToListOfPoints, xyToIndexInColorDict];
  }

  getIndexOfPoint(point) {
    return this.xyToIndexInColorDict[this.xyToStr(point.x, point.y)];
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

  // TODO: Experiment with Manhattan and Euclidian distance.
  distanceSqr(p1, p2) {
    const xDist = (p2.x - p1.x);
    const yDist = (p2.y - p1.y);
    return xDist * xDist + yDist * yDist;
  }

  // TODO: Using this distance function breaks MANY tests.
  distance(p1, p2) {
    return Math.pow(this.distanceSqr(p1, p2), 0.5);
  }

  // Helper function for scoreColorSinglePoint that calculates the score for a
  // point with respect to all points of a certain color.
  scoreColorSinglePoint(points, similarity, color, indexOfPoint, point) {
    if (similarity == 0) {
      // We know ahead of time we will reach a score of 0, so return early.
      return 0;
    }
    let totalScore = 0;
    for (let other = 0; other < points.length; other++) {
      if (color == indexOfPoint[0] && other == indexOfPoint[1]) {
        // The point we are currently looking at is the same point as the one
        // passed in, so do not calculate a score.
        continue;
      }
      let score = this.distanceSqr(point, points[other]);
      totalScore += score * similarity;
    }
    return totalScore;
  }

  // Calculates the total score due to a single point across all colors.
  scoreSinglePoint(indexOfPoint, point) {
    let totalScore = 0;
    for (let otherColor in this.colorToListOfPoints) {
      // We make sure to use the indexOfPoint's color, and not point's color,
      // because indexOfPoint contains more up to date information. If we are
      // calculating for a swap, then point contains the old color, while
      // indexOfPoint contains the new color.
      let similarity =
          this.similarityIndex[this.xyToStr(indexOfPoint[0], otherColor)];
      const points = this.colorToListOfPoints[otherColor];
      totalScore += this.scoreColorSinglePoint(
          points, similarity, otherColor, indexOfPoint, point);
    }
    // We actually double count the impact of every point, but we correct for
    // this outside the scope of this function. If we just halved the totalScore
    // here, we would get an accurate total score, but could not use this
    // function for counting the true global contribution of this point.
    return totalScore;
  }

  // Calculates total score from the cached results of all colors.
  getTotalScore() {
    let score = 0;

    for (let color in this.colorToListOfPoints) {
      const points = this.colorToListOfPoints[color];
      for (let i = 0; i < points.length; i++) {
        // Make sure not to double count each point.
        score += this.scoreSinglePoint([color, i], points[i]) / 2;
      }
    }

    return score;
  }

  scoreDeltaForPoint(point, otherPoint) {
    if (point.value == 0) {
      // Nothing changes for the score due to a white square as they are not
      // counted.
      return {before: 0, after: 0};
    }

    const indexOfPoint = this.getIndexOfPoint(point);
    const scoreBefore = this.scoreSinglePoint(indexOfPoint, point);
    const scoreAfter = this.scoreSinglePoint(indexOfPoint, otherPoint);
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
    delete this.xyToIndexInColorDict[this.pointToStr(p)];
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

    this.colorToListOfPoints[indexOfPoint[0]][indexOfPoint[1]] = newPoint;
    this.xyToIndexInColorDict[this.pointToStr(updatePoint)] = indexOfPoint;
    this.setLocation(newPoint.x, newPoint.y, newPoint.value);
    // We do not worry about double counting here, because we change the score
    // for this point with respect to others points AND the score for other
    // points with respect to this point.
    this.totalScore += pointDelta.after - pointDelta.before;
  }

  swapPoints(p1, p2, p1Delta, p2Delta) {
    const indexOfP1 = this.xyToIndexInColorDict[this.pointToStr(p1)];
    const indexOfP2 = this.xyToIndexInColorDict[this.pointToStr(p2)];

    this.deletePoint(p1);
    this.deletePoint(p2);

    this.setNewPosition(indexOfP1, p1, p2, p1Delta);
    this.setNewPosition(indexOfP2, p2, p1, p2Delta);
  }
}

exports = scorer;
