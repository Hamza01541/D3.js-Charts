import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { CbsAreaScore } from '@app/modules/wellness-plan/models/cbs-assesment-results';
import * as d3 from 'd3';

@Component({
  selector: 'app-step-progress-chart',
  templateUrl: './step-progress-chart.component.html',
  styleUrls: ['./step-progress-chart.component.scss']
})
export class StepProgressChartComponent implements OnInit {
  @ViewChild('stepChart') chartContainer: ElementRef;
  @Input() currentScore = 33;
  @Input() assessmentResult: CbsAreaScore;

  gradientColorCodes = {
    belowAverageColor: '#FC7C62',
    averageColor: '#F2C83A',
    aboveAverageColor: '#5BE828'
  };

  circleColorCode = {
    belowAverageColor: '#A53700',
    averageColor: '#BB9000',
    aboveAverageColor: '#2DA500'
  };

  constructor() { }

  ngOnInit() {
    this.createChart();
  }

  ngOnChanges() {
  this.currentScore = this.assessmentResult.score;
  }

  /**
   * Creates chart
   *
   * Editor Used to draw chart:
   * @see https://editor.method.ac/
   */
  createChart = () => {
    // Total width of rect (horizontal bars) is 1000 (100% * 10 = 1000)
    const totalPercentage = 1000;
    const scorePercentage = this.getscorePercentage(this.assessmentResult.percentile, totalPercentage);

    // Get calculated score from actual score to draw chart according to used formula.
    const circleColor = this.getCircleColor(this.assessmentResult.percentile);

    const chartElement = this.chartContainer.nativeElement;

    if (chartElement) {

      /**
       * Basic SVG
       * @see http://bl.ocks.org/vkuchinov/c43323186765cb14ddd292e71790f0ec
       */
      const chart = d3
        .select(chartElement)
        .append('svg')
        .attr('preserveAspectRatio', 'xMinYMin meet')
        .attr('viewBox', '0 0 1056 576')
        .append('g')
        .attr('transform', 'translate(48,48)');

      /**
       * Gradient to fill rect
       * @see https://bl.ocks.org/EfratVil/484d0555f6f818ca6eea3de549a21e86
       */
      const linearGradient = chart
        .append('defs')
        .append('linearGradient')
        .attr('id', 'grad_1')
        .attr('gradientTransform', 'rotate(0)'); // Sets gradient direction (i.e rotate value 90 for veritcal and 0 for horizontal)

      linearGradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', this.gradientColorCodes.belowAverageColor);

      linearGradient
        .append('stop')
        .attr('offset', '55%')
        .attr('stop-color', this.gradientColorCodes.averageColor);

      linearGradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', this.gradientColorCodes.aboveAverageColor);

      /** Rect */
      chart
        .append('rect')
        .attr('height', '25')
        .attr('width', totalPercentage)
        .attr('rx', '12') // Round edges
        .attr('ry', '25') // Round edges
        .attr('stroke', `#A65DF0`) // border color
        .attr('gradient', 'grad_1')
        .attr('fill', `url(${window.location.href}#grad_1)`);

      /** Circle */
      chart
        .append('circle')
        .attr('fill', '#FFFFFF')
        .attr('stroke', circleColor)
        .attr('stroke-width', 8)
        .attr('cx', scorePercentage)
        .attr('cy', 8)
        .attr('r', 45);

      /** Circle Text */
      chart
        .append('text')
        .attr('fill', '#000')
        .attr('dx', scorePercentage)
        .attr('dy', 20)
        .attr('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '30px')
        .text(this.currentScore);
    }
  }

  /**
   * Gets circle color from current score 
   * THere are three different colour regimes, based on a user's result percentile.  
   *  low (< 25%) average (25% < 75%)  high (>75%)
   * @param {number} percentile Current achieved perfentile for Cognition area.
   * @returns {string}
   */
  getCircleColor = (percentile: number): string => {
    let circleColor = '';
    if (percentile <= 0.25) {
      circleColor = this.circleColorCode.belowAverageColor;
    } else if (percentile >= 0.75) {
      circleColor = this.circleColorCode.aboveAverageColor;
    } else {
      circleColor = this.circleColorCode.averageColor;
    }

    return circleColor;
  }

  /**
   * gets percentage of score out of 1000%
   * because total width of rect (horizontal bars) is 1000 (used 1000 instead of 100 to extend width of bars)
   * @param { number} resultPercentile decimal value between 0 and 1. 
   * @returns {number} Score Percentage
   */
  getscorePercentage = (resultPercentile: number, totalPercentage): number => {
    return resultPercentile * totalPercentage;
  }

  /**
  * Clears Chart
  */
  clearChart = () => {
    d3
      .select(this.chartContainer.nativeElement)
      .selectAll('svg')
      .remove();
  }
}
