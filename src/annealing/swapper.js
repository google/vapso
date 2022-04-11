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
 * @fileoverview Simulated annealing for placement of dots on Venn diagrams.
 */

class swapper {
  constructor(
      scoreToTemperature, field, width, height, sets, numRuns, stepsPerRun) {
    this.sim = new scorer(field, width, height, sets);
    this.stepsPerRun = stepsPerRun;
    this.totalSteps = numRuns * stepsPerRun;
    this.currentRun = 0;
    this.maxTemperature = this.sim.getTotalScore() / scoreToTemperature;
  }

  getTemperature(fractionLeft) {
    // Using fractionLeft^2 so that the curse of temperature is non-linear.
    return Math.round(this.maxTemperature * fractionLeft) + 1;
  }

  probabilityOfSwap(fractionLeft, scoreBefore, scoreAfter) {
    if (scoreAfter < scoreBefore) {
      // This is a good swap, so accept it straight away.
      return 1;
    }
    const currentTemperature = this.getTemperature(fractionLeft);
    // Because scoreAfter is greater than scoreBefore, than exp_fraction will
    // always be greater than 1. However, if it is between 1 and 2, we actually
    // want to have a chance to swap, we subtract it from 2 in order to have a
    // change to swap if it is in the range (1,2].
    const exp_fraction =
        Math.exp((scoreAfter - scoreBefore) / currentTemperature);
    return Math.max(0, 2 - exp_fraction);
  }

  swapPoints(p1, p2, p1Delta, p2Delta) {
    this.sim.swapPoints(p1, p2, p1Delta, p2Delta);
  }

  getFractionLeft(currentStep) {
    const totalCurrentStep = currentStep + (this.currentRun * this.stepsPerRun);
    const percentDone = totalCurrentStep / this.totalSteps;
    return 1 - percentDone;
  }

  scoreAfterSwap(p1Delta, p2Delta) {
    const scoreBeforeSwap = this.sim.totalScore;
    const scoreDeltaP1 = p1Delta.after - p1Delta.before;
    const scoreDeltaP2 = p2Delta.after - p2Delta.before;
    return scoreBeforeSwap + scoreDeltaP1 + scoreDeltaP2;
  }


  runStep(currentStep) {
    const pointPair = this.sim.getPointPair();

    const p1 = pointPair[0];
    const p2 = pointPair[1];

    if (p1.value == p2.value) {
      return;
    }

    const p1Delta = this.sim.scoreDeltaForPoint(p1, p2);
    const p2Delta = this.sim.scoreDeltaForPoint(p2, p1);

    // TODO: sim.totalScore should not be accessed raw! This would be better with a wrapper.
    const scoreBefore = this.sim.totalScore;
    const scoreAfter = this.scoreAfterSwap(p1Delta, p2Delta);

    const probSwap = this.probabilityOfSwap(
        this.getFractionLeft(currentStep), scoreBefore, scoreAfter);

    if (Math.random() > probSwap) {
      // Swap was too bad to do, so return.
      return;
    }

    this.hits++;

    // swapPoints is currently the bottleneck of this entire process.
    this.swapPoints(p1, p2, p1Delta, p2Delta);
  }

  runSimulatedAnnealing() {
    const start = new Date().getTime();

    let currentStep = 0;
    this.hits = 0;
    for (; currentStep < this.stepsPerRun; currentStep++) {
      this.runStep(currentStep);
    }
    this.currentRun++;
  }
}

exports = swapper;