import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import * as d3 from 'd3';
import { TranslatePipe } from '@app/shared/pipes';

@Component({
  selector: 'app-marker-chart',
  templateUrl: './marker-chart.component.html',
  styleUrls: ['./marker-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MarkerChartComponent implements OnInit {
  @ViewChild('chart') chartContainer: ElementRef;
  @Output() showInfo = new EventEmitter();
  private width: number;
  private height: number;
  private margin: any = {
    top: 30,
    bottom: 30,
    left: 50,
    right: 0,
  };

  @Input() textInRect: boolean;
  @Input() showMarker: boolean;
  @Input() showTargetHeading: boolean;
  @Input() timeFormating: boolean;
  @Input() showHeadingIcon: boolean;
  @Input() xAxisHeading: string;
  @Input() centralHeading: string;
  @Input() targetHeadingText: string;
  @Input() actualValue: string;
  @Input() widthOptimizer: number;
  @Input() maxWidth: number;
  @Input() source: string;

  chart: any;
  @Input() data: any[];
  xAxis: any;
  yAxis: any;
  xScale: any;
  yScale: any;
  xScaleAux: any;
  /**
   * This variable is used to check whether any sleep daily report data exceeds 7 hours
   * If yes than adjust the bars width to fit in screen
   */
  isGreaterThanSevenHour: boolean;
  constructor(private translate: TranslatePipe) { }

  ngOnInit() {
    this.isGreaterThanSevenHour = false;
    this.createChart();
  }

  createChart(newData: any = null) {
    let data = JSON.parse(JSON.stringify(this.data));
    if (newData) {
      data = JSON.parse(JSON.stringify(newData));
    }
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    this.isSevenHour(data);

    // because for sleep-dashboard, on screen size 320px, value of this.width is negative.
    if (window.innerWidth <= 320 && this.source === 'sleep') {
      this.width = 210;
    }

    // append svg
    const svg = d3
      .select(element)
      .append('svg')
      .attr('preserveAspectRatio', 'none')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg
      .append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // define X & Y domains
    const xDomain = [];
    const xDomainAux = [0, 10];
    const yDomain = data.map(d => {
      d.label = this.translate.transform('chart.labels.' + d.label);
      return d.label;
    });

    // x & y scale creation
    this.xScale = d3
      .scaleBand()
      .domain(xDomain)
      .range([0, this.width]);

    this.xScaleAux = d3
      .scaleLinear()
      .domain(xDomainAux)
      .range([0, this.width - this.xScale.step()]);

    this.yScale = d3
      .scaleBand()
      .domain(yDomain)
      .range([this.height, 0])
      .padding(0);

    // y-axis creation
    this.yAxis = svg
      .append('g')
      .attr('class', 'axis axis-y')
      .style('text-transform', 'capitalize')
      .style('font-weight', '600')
      .attr('transform',
        `translate(${this.margin.left + 35}, ${this.xAxisHeading && this.xAxisHeading.length ? this.margin.top + 30 : this.margin.top})`)
      .call(d3.axisLeft(this.yScale));

    // remove y-axis tick
    svg.select('.axis.axis-y')
      .selectAll('g').selectAll('line').remove();

    if (window.innerWidth >= 1750) {
      svg.selectAll('.axis-y text').attr('x', 200);
      this.yAxis.attr('x', 220);
    }
    if (window.innerWidth < 360) {
      svg.selectAll('.axis-y text').attr('x', -23);
      this.yAxis.attr('x', 213);
    }
    if (window.innerWidth <= 768) {
      this.yAxis = svg.selectAll('.axis axis-y').style('transform', 'translate:7px');
    }
    if (window.innerWidth <= 375) {
      this.yAxis = svg.selectAll('.axis axis-y').style('transform', 'translate:-10px');
    }

    svg.selectAll('.axis-y text')
      .style('font-size', (d) => {
        return d === 'motor' ? '16px' : '15px';
      })
      .style('font-stretch', (d) => {
        return d === 'motor' ? 'condensed' : '';
      });

    // append the rectangles for the bar chart
    const bar = svg
      .selectAll('.window-bar')
      .data(data)
      .enter();

    // Show x-Axis heading if any
    if (this.xAxisHeading && this.xAxisHeading.length) {
      svg.append('g')
        .attr('id', 'xAxisHeading')
        .append('text')
        .style('font-weight', '600')
        .style('font-size', '15px')
        .text(this.xAxisHeading)
        .attr('x', () => {
          let x;
          if (window.innerWidth >= 1750) {
            x = 218;
          } else {
            x = 3;
          }
          return x;
        })
        .attr('y', () => {
          if (window.innerWidth > 1001) {
            return 37;
          } else {
            this.widthOptimizer = this.widthOptimizer * 0.5;
            return 30;
          }
        });

      svg.select('#xAxisHeading')
        .append('image')
        .attr('id', 'xAxisHeadingInfo')
        .attr('xlink:href', 'assets/icons/info.png')
        .attr('width', 17)
        .attr('height', 17)
        .style('cursor', 'pointer')
        .on('click', ($event: any) => {
          this.showInfo.emit('xAxis');
        })
        .attr('x', () => {
          let x;
          if (window.innerWidth >= 1750) {
            x = 315 + this.xAxisHeading.length;
          } else {
            x = 95 + this.xAxisHeading.length;
          }
          return x;
        })
        .attr('y', () => {
          if (window.innerWidth > 1001) {
            return 24;
          } else {
            return 17;
          }
        });

    }

    // Show the central heading
    if (this.centralHeading) {
      svg.append('g')
        .attr('id', 'CentralHeading')
        .append('text')
        .style('font-weight', '600')
        .style('font-size', '15px')
        .text(this.centralHeading)
        .attr('x', () => {
          let x;
          if (window.innerWidth >= 1750) {
            x = 440;
          } else if (window.innerWidth < 1750 && window.innerWidth > 1170) {
            x = 240;
          } else if (window.innerWidth <= 1170 && window.innerWidth >= 768) {
            x = 140;
          } else if (window.innerWidth < 768 && window.innerWidth >= 360) {
            x = 35;
          } else {
            x = 0;
          }
          return x;
        })
        .attr('y', () => {
          if (window.innerWidth > 1000) {
            return this.xAxisHeading && this.xAxisHeading.length ? 60 : 30;
          } else {
            return 0;
          }
        });
    }

    // Show Target Values
    if (this.showTargetHeading) {
      svg.append('g')
        .attr('id', 'targetHeading')
        .append('text')
        .style('font-weight', '600')
        .style('font-size', '15px')
        .text(this.targetHeadingText)
        .attr('x', () => {
          if (window.innerWidth >= 2000) {
            if (this.source === 'cognition') {
              return this.width - 330;
            } else {
              return this.width - 300;
            }
          } else if (window.innerWidth > 480) {
            if (this.source === 'cognition') {
              return this.width - 70;
            } else {
              return this.width - 40;
            }
          } else {
            if (this.source === 'cognition') {
              return this.width - 52;
            } else {
              return this.width - 30;
            }
          }
        })
        .attr('y', () => {
          if (window.innerWidth > 1001) {
            return this.xAxisHeading && this.xAxisHeading.length ? 37 : 7;
          } else {
            return this.xAxisHeading && this.xAxisHeading.length ? 60 : 30;
          }
        });

      // Show info icon for Target heading
      svg.select('#targetHeading')
        .append('image')
        .attr('id', 'hoursInfo')
        .attr('xlink:href', 'assets/icons/info.png')
        .attr('width', 17)
        .attr('height', 17)
        .attr('x', () => {
          if (window.innerWidth >= 2000) {
            return this.width - this.targetHeadingText.length - 230;
          } else if (window.innerWidth >= 480) {
            return this.width + this.targetHeadingText.length + 10;
          } else {
            return this.width + this.targetHeadingText.length + 20;
          }
        })
        .style('cursor', 'pointer')
        .on('click', ($event: any) => {
          this.showInfo.emit('target');
        })
        .attr('y', () => {
          if (window.innerWidth > 1001) {
            return this.xAxisHeading && this.xAxisHeading.length ? 24 : -6;
          } else {
            return this.xAxisHeading && this.xAxisHeading.length ? 47 : 17;
          }
        });
    }

    // Adding the horizontal rectangles
    this.createProgressBar(svg, bar);

    if (this.showMarker) {
      // adding markers
      this.addPointerLines(bar);
    }

    // Display info icon on Y-axis
    this.addInfoIcon(svg, bar, data);
  }

  /**
   *
   * @param svg
   * @param bar
   */
  addInfoIcon(svg: any, bar: any, data: any) {
    bar
      .select('g')
      .append('image')
      .attr('class', 'info_image')
      .attr('xlink:href', 'assets/icons/info.png')
      .attr('y', (d: any, i) => {
        const delta = this.yScale.step() / 2;
        const y = this.yScale(data[i].label) + this.margin.top + delta - 37;
        return this.xAxisHeading && this.xAxisHeading.length ? y + 30 : y;
      })
      .attr('x', () => {
        return (this.margin.left / 2) + 16;
      })
      .attr('id', (d: any, i) => {
        return this.data[i].label;
      })
      .attr('width', 20)
      .attr('height', 16)
      .style('cursor', 'pointer')
      .on('click', ($event: any) => {
        let currentLabel;
        currentLabel = event.srcElement['id'];
        this.showInfo.emit(currentLabel);
      });

    if (window.innerWidth >= 1750) {
      svg.selectAll('.info_image').attr('x', 235);
    }
    if (window.innerWidth < 360) {
      svg.selectAll('.info_image').attr('x', 20);
    }
  }

  /**
   * Creates progress bars.
   * @param svg
   * @param bar
   */
  createProgressBar(svg: any, bar: any) {
    const defs = svg.append('defs');

    /** Fill bars */
    bar.append('rect')
      .attr('class', 'test')
      .style('stroke', () => {
        if (this.maxWidth) {
          return 'grey';
        } else {
          return '';
        }
      })
      .style('fill', (d: any, i) => {
        this.createGredient(defs, d, this.data[i].color, i);
        return `url(${window.location.href}#grad_${i})`;
      })
      .attr('y', (d: any, i) => {
        const delta = this.yScale.step() / 2;
        const y = this.yScale(d.label) + this.margin.top + delta - 15;
        if ((window.innerWidth < 1001) || (window.innerWidth <= 1080 && this.isGreaterThanSevenHour)) {
          return this.xAxisHeading && this.xAxisHeading.length ? y + 60 : y + 30;
        } else {
          return this.xAxisHeading && this.xAxisHeading.length ? y + 30 : y;
        }
      })
      .attr('height', () => {
        if ((window.innerWidth < 1001) || (window.innerWidth <= 1080 && this.isGreaterThanSevenHour)) {
          return 15;
        } else {
          return 30;
        }
      })
      .attr('x', () => {
        if (window.innerWidth >= 1750) {
          return 450;
        } else if (window.innerWidth < 1750 && window.innerWidth > 1170) {
          return 250;
        } else if (window.innerWidth <= 1170 && window.innerWidth >= 1001) {
          return 150;
        } else if (window.innerWidth >= 360) {
          return 70;
        } else {
          return 0;
        }
      })
      .attr('width', (d: any, i) => {
        if (this.maxWidth) {
          if (window.innerWidth > 1560) {
            return this.maxWidth;
          } else if (window.innerWidth > 480) {
            return this.maxWidth / 2;
          } else {
            return this.maxWidth / 4;
          }
        } else {
          if (d.Avg && d.minutes) {
            if (window.innerWidth > 1366) {
              return (d.Avg > d.minutes ? d.Avg : d.minutes) * this.widthOptimizer;
            } else if (window.innerWidth > 640) {
              return (d.Avg > d.minutes ? d.Avg : d.minutes) * this.widthOptimizer;
            } else if (window.innerWidth >= 360) {
              return (d.Avg > d.minutes ? d.Avg : d.minutes) / 4;
            } else {
              return (d.Avg > d.minutes ? d.Avg : d.minutes) / 4;
            }
          } else {
            return 0;
          }
        }
      })
      .attr('rx', () => {
        if ((window.innerWidth < 1001) || (window.innerWidth <= 1080 && this.isGreaterThanSevenHour)) {
          return 8;
        } else {
          return 15;
        }
      })
      .attr('ry', () => {
        if ((window.innerWidth < 1001) || (window.innerWidth <= 1080 && this.isGreaterThanSevenHour)) {
          return 8;
        } else {
          return 15;
        }
      });

    /**
     * Creates heading of actual values
     */
    if (this.actualValue) {
      svg.append('g')
        .attr('id', 'actualValueHeading')
        .attr('fill', '#e83e8c')
        .append('text')
        .style('font-weight', '600')
        .style('font-size', '15px')
        .text(this.actualValue)
        .attr('x', (d: any, i) => {
          let x;
          if (this.maxWidth) {
            if (window.innerWidth >= 1750) {
              x = 500 + this.maxWidth;
            } else if (window.innerWidth < 1750 && window.innerWidth > 1560) {
              x = 300 + this.maxWidth;
            } else if (window.innerWidth <= 1560 && window.innerWidth > 1177) {
              x = 300 + this.maxWidth / 2;
            } else if (window.innerWidth <= 1177 && window.innerWidth >= 1001) {
              x = 170 + this.maxWidth / 2;
            } else {
              x = this.width / 2;
            }
          } else {
            if (d.Avg > d.minutes) {
              if (window.innerWidth >= 1750) {
                x = 500 + (d.Avg * this.widthOptimizer);
              } else if (window.innerWidth < 1750 && window.innerWidth > 1366) {
                x = 300 + (d.Avg * this.widthOptimizer);
              } else if (window.innerWidth <= 1366 && window.innerWidth > 1177) {
                x = 300 + d.Avg;
              } else if (window.innerWidth <= 1170 && window.innerWidth >= 1001) {
                x = 200 + d.Avg;
              } else {
                x = this.width / 2;
              }
            } else {
              if (window.innerWidth >= 1750) {
                x = this.widthOptimizer * d.minutes + 480;
              } else if (window.innerWidth < 1750 && window.innerWidth > 1366) {
                x = this.widthOptimizer * d.minutes + 280;
              } else if (window.innerWidth <= 1366 && window.innerWidth > 1177) {
                x = this.widthOptimizer * d.minutes + 280;
              } else if (window.innerWidth <= 1170 && window.innerWidth >= 1001) {
                x = this.widthOptimizer * d.minutes + 180;
              } else {
                x = this.width / 2;
              }
            }
          }
          return x - 5;
        })
        .attr('y', () => {
          if (window.innerWidth > 1001) {
            return this.xAxisHeading && this.xAxisHeading.length ? 37 : 7;
          } else {
            return this.xAxisHeading && this.xAxisHeading.length ? 60 : 30;
          }
        });
    }

    /**
     * Create achieved/actual values
     */
    bar
      .append('text')
      .style('font-weight', '600')
      .style('font-size', '15px')
      .text((d: any, i) => {
        let actualValue;
        if (this.timeFormating) {
          actualValue = this.formatMinutes(d.minutes);
        } else {
          actualValue = d.minutes;
        }
        return actualValue;
      })
      .attr('class', '_minutes')
      .style('fill', (d: any, i) => {
        return this.data[i].color;
      })
      .attr('x', (d: any, i) => {
        let x;
        if (this.maxWidth) {
          if (window.innerWidth >= 1750) {
            return 500 + this.maxWidth;
          } else if (window.innerWidth < 1750 && window.innerWidth > 1560) {
            return 300 + this.maxWidth;
          } else if (window.innerWidth <= 1560 && window.innerWidth > 1177) {
            return 300 + this.maxWidth / 2;
          } else if (window.innerWidth <= 1177 && window.innerWidth >= 1001) {
            return 170 + this.maxWidth / 2;
          } else {
            return this.width / 2;
          }
        } else {
          if (d.Avg > d.minutes) {
            if (window.innerWidth >= 1750) {
              return 500 + (d.Avg * this.widthOptimizer);
            } else if (window.innerWidth < 1750 && window.innerWidth > 1366) {
              return 300 + (d.Avg * this.widthOptimizer);
            } else if (window.innerWidth <= 1366 && window.innerWidth > 1170) {
              return 300 + (d.Avg * this.widthOptimizer);
            } else if (window.innerWidth <= 1170 && window.innerWidth >= 1001) {
              if (window.innerWidth <= 1080 && this.isGreaterThanSevenHour) {
                return this.width / 2;
              } else {
                return 200 + (d.Avg * this.widthOptimizer);
              }
            } else {
              return this.width / 2;
            }
          } else {
            if (window.innerWidth >= 1750) {
              x = this.widthOptimizer * d.minutes + 480;
            } else if (window.innerWidth < 1750 && window.innerWidth > 1366) {
              x = this.widthOptimizer * d.minutes + 280;
            } else if (window.innerWidth <= 1366 && window.innerWidth > 1170) {
              x = this.widthOptimizer * d.minutes + 280;
            } else if (window.innerWidth <= 1170 && window.innerWidth >= 1001) {
              if (window.innerWidth <= 1080 && this.isGreaterThanSevenHour) {
                x = this.width / 2;
              } else {
                x = this.widthOptimizer * d.minutes + 180;
              }
            } else {
              x = this.width / 2;
            }
          }
        }
        return x;
      })
      .attr('y', (d: any, i) => {
        const delta = this.yScale.step() / 2;
        const y = this.yScale(d.label) + this.margin.top + delta + 5;
        return this.xAxisHeading && this.xAxisHeading.length ? y + 30 : y;
      });

    /**
     * Create target/average/base values
     */
    if (this.showTargetHeading) {
      bar.append('text')
        .style('font-weight', '600')
        .style('font-size', '15px')
        .text((d: any, i) => {
          let average;
          if (this.timeFormating) {
            average = this.formatMinutes(d.Avg);
          } else {
            average = d.Avg;
          }
          return average;
        })
        .style('fill', 'black')
        .attr('x', () => {
          if (window.innerWidth >= 2000) {
            return this.width - 300;
          } else if (window.innerWidth > 480) {
            return this.width - 40;
          } else {
            return this.width - 15;
          }
        })
        .attr('y', (d: any, i) => {
          const delta = this.yScale.step() / 2;
          const y = this.yScale(d.label) + this.margin.top + delta + 5;
          return this.xAxisHeading && this.xAxisHeading.length ? y + 30 : y;
        });
    }
  }

  /**
   * Create pointer lines
   * @param bar
   */
  addPointerLines(bar: any) {
    bar.append('line')
      .attr('class', 'pointerLine')
      .attr('x1', (d: any) => {
        if (this.maxWidth) {
          if (window.innerWidth > 1750) {
            return 450 + d.Avg * this.widthOptimizer;
          } else if (window.innerWidth <= 1750 && window.innerWidth > 1560) {
            return 250 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth <= 1560 && window.innerWidth > 1170) {
            return 250 + (d.Avg / 2 * this.widthOptimizer);
          } else if (window.innerWidth <= 1170 && window.innerWidth >= 1001) {
            return 150 + (d.Avg / 2 * this.widthOptimizer);
          } else if (window.innerWidth > 480) {
            return 70 + d.Avg / 2;
          } else if (window.innerWidth >= 360) {
            return 70 + (d.Avg / 4);
          } else {
            return (d.Avg / 4);
          }
        } else {
          if (window.innerWidth >= 1750) {
            return 450 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth < 1750 && window.innerWidth > 1366) {
            return 250 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth <= 1366 && window.innerWidth > 1170) {
            return 250 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth <= 1170 && window.innerWidth > 1001) {
            return 150 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth > 640) {
            return 70 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth >= 360) {
            return 70 + (d.Avg / 4);
          } else {
            return (d.Avg / 4);
          }
        }
      })
      .attr('y1', (d: any) => {
        const delta = this.yScale.step() / 2;
        const y = this.yScale(d.label) + this.margin.top + delta - 21;

        if ((window.innerWidth < 1001) || (window.innerWidth <= 1080 && this.isGreaterThanSevenHour)) {
          return this.xAxisHeading && this.xAxisHeading.length ? y + 60 : y + 30;
        } else {
          return this.xAxisHeading && this.xAxisHeading.length ? y + 30 : y;
        }
      })
      .attr('x2', (d: any) => {
        if (this.maxWidth) {
          if (window.innerWidth > 1750) {
            return 450 + d.Avg * this.widthOptimizer;
          } else if (window.innerWidth <= 1750 && window.innerWidth > 1560) {
            return 250 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth <= 1560 && window.innerWidth > 1170) {
            return 250 + (d.Avg / 2 * this.widthOptimizer);
          } else if (window.innerWidth <= 1170 && window.innerWidth >= 1001) {
            return 150 + (d.Avg / 2 * this.widthOptimizer);
          } else if (window.innerWidth > 480) {
            return 70 + d.Avg / 2;
          } else if (window.innerWidth >= 360) {
            return 70 + (d.Avg / 4);
          } else {
            return (d.Avg / 4);
          }
        } else {
          if (window.innerWidth >= 1750) {
            return 450 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth < 1750 && window.innerWidth > 1366) {
            return 250 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth <= 1366 && window.innerWidth > 1170) {
            return 250 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth <= 1170 && window.innerWidth > 1001) {
            return 150 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth > 640) {
            return 70 + (d.Avg * this.widthOptimizer);
          } else if (window.innerWidth >= 360) {
            return 70 + (d.Avg / 4);
          } else {
            return (d.Avg / 4);
          }
        }
      })
      .attr('y2', (d: any) => {
        const delta = this.yScale.step() / 2;
        const y = this.yScale(d.label) + this.margin.top + delta + 21;

        if ((window.innerWidth < 1001) || (window.innerWidth <= 1080 && this.isGreaterThanSevenHour)) {
          return this.xAxisHeading && this.xAxisHeading.length ? y + 45 : y + 15;
        } else {
          return this.xAxisHeading && this.xAxisHeading.length ? y + 30 : y;
        }
      });
  }

  createGredient(defs: any, level: any, color: string, index: number) {

    /**
     * link I follow to create the gradient fill
     * @see https://stackoverflow.com/questions/39782015/d3js-adding-multiple-colors-to-each-bars-based-on-variables-using-if-condition
     */

    const grad = defs.append('linearGradient')
      .attr('id', 'grad_' + index);
    if (level.Avg > level.minutes) {
      this.gradientWhenAverageIsGreater(grad, level, color);
    } else {
      this.gradientWhenMinutesAreGreater(grad, level, color);
    }
  }

  gradientWhenAverageIsGreater(grad: any, level: any, color: string) {
    // when parent component assigns a maximum width
    if (this.maxWidth) {
      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color);

      grad.append('stop')
        .attr('offset', level.minutes / this.maxWidth * 100 + '%')
        .attr('stop-color', color);

      // Marker is visible than add the gray color
      if (this.showMarker) {
        grad.append('stop')
          .attr('offset', (level.minutes / this.maxWidth * 100) - 0.5 + '%')
          .attr('stop-color', 'rgb(218, 211, 211)')
          .attr('spreadMethod', 'repeat');

        grad.append('stop')
          .attr('offset', (level.Avg / this.maxWidth * 100) + '%')
          .attr('stop-color', 'rgb(218, 211, 211)')
          .attr('spreadMethod', 'repeat');

        grad.append('stop')
          .attr('offset', (level.Avg / this.maxWidth * 100) - 0.5 + '%')
          .attr('stop-color', 'transparent')
          .attr('spreadMethod', 'repeat');
      } else {
        // Otherwise just go with transparent
        grad.append('stop')
          .attr('offset', (level.minutes / this.maxWidth * 100) - 0.5 + '%')
          .attr('stop-color', 'transparent')
          .attr('spreadMethod', 'repeat');
      }

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'transparent')
        .attr('spreadMethod', 'repeat');

    } else {
      // when only dependent on the data values without any maximum width
      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color);

      grad.append('stop')
        .attr('offset', level.minutes / level.Avg * 100 + '%')
        .attr('stop-color', color);

      grad.append('stop')
        .attr('offset', (level.minutes / level.Avg * 100) + 0.5 + '%')
        .attr('stop-color', 'rgb(218, 211, 211)')
        .attr('spreadMethod', 'repeat');

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'rgb(218, 211, 211)')
        .attr('spreadMethod', 'repeat');
    }
  }

  gradientWhenMinutesAreGreater(grad: any, level: any, color: string) {
    if (this.maxWidth && this.maxWidth > level.minutes) {
      // when parent component provides a maximum width and
      // the values are greater than the average but smaller than the maximum width
      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color);

      grad.append('stop')
        .attr('offset', level.minutes / this.maxWidth * 100 + '%')
        .attr('stop-color', color);

      grad.append('stop')
        .attr('offset', (level.minutes / this.maxWidth * 100) - 0.5 + '%')
        .attr('stop-color', 'transparent');

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'transparent');
    } else {
      // when attain value reaches the maximum value irrespective of maximum width
      grad.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color);

      grad.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color);
    }
  }

  isSevenHour(data: any[]) {
    data.forEach(d => {
      if (d.minutes > 420) { this.isGreaterThanSevenHour = true; }
    });
  }

  clearChart() {
    d3.select(this.chartContainer.nativeElement)
      .selectAll('svg').remove();
  }

  formatMinutes(minutes: number): string {
    if (minutes > 0) {
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      let str = '';
      if (h > 0) {
        str += `${h} h `;
      }
      if (m > 0) {
        str += `${m} m`;
      }
      return str;
    } else {
      return '0 m';
    }
  }
}
