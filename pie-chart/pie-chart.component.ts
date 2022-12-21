import {
  Component,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
  Output,
  EventEmitter,
  ElementRef
} from '@angular/core';

import * as d3 from 'd3';

import { ChartMargins } from '@app/shared/models/chart-config.model';
import { TranslatePipe } from '@app/shared/pipes';
import { LocalStorageService } from '@app/shared/services/local-storage.service';
import { LanguageIsoCodes } from '@app/shared/models';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent implements OnInit, OnChanges {
  @Output() showInfo = new EventEmitter();
  @ViewChild('pieChartContainer') container: ElementRef;

  @Input()
  data: number;

  @Input()
  chartWidth: number;

  @Input()
  chartHeight: number;

  @Input()
  label: string;

  @Input()
  thickness: number;

  @Input()
  margins: ChartMargins;

  @Input()
  backgroundColor: string;

  @Input()
  total: number;

  @Input()
  centerText: string;

  @Input()
  showCenterText: boolean;

  @Input()
  showLabel: boolean;

  @Input()
  showImage: boolean;

  convertedHours: string;

  constructor(private translate: TranslatePipe, private storageService: LocalStorageService) { }

  ngOnInit() {
    this.createChart();
  }

  ngOnChanges() { }

  createChart(newData?: any) {
    if (newData) {
      this.data = newData;
    }
    if (this.label === 'timeAsleep') {
      this.convertedHours = this.formatMinutes(this.data);
    }
    this.buildChart();
  }

  setDimensions(): any {
    const element = this.container.nativeElement;
    const width = element.offsetWidth - this.margins.left - this.margins.right;
    const height = this.chartHeight - this.margins.top - this.margins.bottom;
    const radius = Math.min(width, height) / 2 - 15;
    return { width, height, radius };
  }

  buildChart() {
    const currentLanguage = this.storageService.get('languageCode');

    const svg = d3
      .select(this.container.nativeElement)
      .append('svg')
      .attr('width', this.chartWidth)
      .attr('height', this.chartHeight);

    const data: any = (() => {
      const percentage = (this.data / this.total) * 100;
      return [
        {
          value: percentage,
          color: this.backgroundColor
        },
        {
          value: 100 - percentage,
          color: 'rgb(218, 211, 211)',
        },
      ];
    })();

    const dimensions = this.setDimensions();

    // create the arc function
    const arc = d3
      .arc()
      .innerRadius(dimensions.radius - this.thickness + 5)
      .outerRadius(dimensions.radius + 5);

    // creat the pie function
    const pie = d3
      .pie()
      .value(function (d: any): number {
        return d.value;
      })
      .sort(null);

    // initialize the donut holder
    const container = svg
      .append('g')
      .attr('class', 'donut')
      .attr(
        'transform',
        'translate(' +
        (dimensions.width / 2 + this.margins.left) +
        ',' +
        (dimensions.width / 2 + this.margins.top) +
        ')'
      );

    if (this.label !== 'formsReport') {
      svg.append('g')
        .append('text')
        .style('strok', 'black')
        .style('font-weight', 700)
        .style('fill', this.backgroundColor)
        .text(() => {
          if (this.label === 'timeAsleep') {
            return this.convertedHours;
          } else {
            const key = 'chart.labels.' + this.centerText;
            const centerText = this.translate.transform(key);
            return this.data + '%';
          }
        })
        .attr('x', 70)
        .attr('y', 270);
    }
    if (this.showLabel) {
      const g = svg.append('g');
      g
        .append('text')
        .attr('id', this.label)
        .style('strok', 'black')
        .style('font-weight', 700)
        .attr('x', 55)
        .attr('y', 230)
        .text(() => {
          const labelKey = 'chart.labels.' + this.label;
          return this.translate.transform(labelKey);
        });

      /**
       * Display info icon.
       */
      g
        .append('image')
        .attr('xlink:href', 'assets/icons/info.png')
        .attr('width', '16px')
        .attr('height', '16px')
        .attr('x', 155)
        .attr('y', 218)
        .style('cursor', 'pointer')
        .attr('id', this.label)
        .on('click', ($event: any) => {
          const currentLabel = event.target['id'];
          this.showInfo.emit(currentLabel);
        });
    }
    if (this.showImage) {
      container
        .append('image')
        .attr('xlink:href', () => {
          if (this.data < 100) {
            return this.getIcon('timeAsleep', true);
          } else {
            return this.getIcon('timeAsleep_purple', true);
          }
        })
        .attr('x', -dimensions.radius)
        .attr('y', -dimensions.radius)
        .attr('width', 2 * dimensions.radius)
        .attr('height', 2 * dimensions.radius);
    }
    if (this.showCenterText) {
      container
        .append('text')
        .attr('id', this.label)
        .style('strok', 'black')
        .style('font-weight', 900)
        .style('font-size', '30px')
        .attr('x', -dimensions.radius / 3)
        .attr('y', -dimensions.radius / 15)
        .text(() => {
          return this.data + '/' + this.total;
        });
      container
        .append('text')
        .attr('id', this.label)
        .style('strok', 'black')
        .style('font-weight', 700)
        .style('font-size', 15)
        .attr('x', () => {
          return currentLanguage === LanguageIsoCodes.english ? -dimensions.radius / 2.5 : -dimensions.radius / 5;
        })
        .attr('y', dimensions.radius / 4)
        .text(() => {
          const key = 'chart.labels.' + this.centerText;
          return this.translate.transform(key);
        });
    }

    let slices: any = container.selectAll('slice').data(pie(data));

    slices.exit().remove();
    slices = slices
      .enter()
      .append('path')
      .attr('class', 'slice')
      .merge(slices);

    slices
      .attr('d', function (d: any): string {
        const tmp = arc(d);
        return tmp;
      })
      .attr('fill', function (d: any): string {
        return d.data.color;
      });
  }

  clearChart() {
    d3.select(this.container.nativeElement)
      .select('svg')
      .remove();
  }

  formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    let str = '';
    if (h > 0) {
      str += `${h} h `;
    }
    if (m > 0) {
      str += `${m} m`;
    } else {
      str += `0 m`;
    }
    return str;
  }

  getIcon(name: string, isSVG: boolean) {
    const extension = isSVG ? 'svg' : 'png';
    return `assets/icons/sleep/${name}.${extension}`;
  }
}
