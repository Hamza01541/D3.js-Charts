import {
  Component,
  OnInit,
  Input, ViewChild,
  ViewEncapsulation,
  Output,
  EventEmitter,
  ElementRef
} from '@angular/core';
import * as d3 from 'd3';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-half-donut-chart',
  templateUrl: './half-donut-chart.component.html',
  styleUrls: ['./half-donut-chart.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HalfDonutChartComponent implements OnInit {
  @ViewChild('chart') chartContainer: ElementRef;
  @Output() showInfo = new EventEmitter();
  @Input() value: number;
  remaining: number;

  private margin: any = {
    top: 30,
    bottom: 30,
    left: 50,
    right: 0,
  };
  width: number = 0;
  height: number = 0;

  _current: any;
  label: string = 'efficiency';

  constructor(private translate: TranslatePipe) { }

  ngOnInit() {
    this.createChart();
  }

  createChart() {
    this.remaining = 100 - this.value;
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    var data = [this.value, this.remaining];
    var text = "";
    var width = 210;
    var height = 210;
    var thickness = 20;
    var radius = Math.min(width, height) / 2;
    var color = ['rgb(18, 18, 151)', 'rgb(218, 211, 211)'];
    var anglesRange = 0.5 * Math.PI;
    let current = this._current;
    var svg = d3.select(this.chartContainer.nativeElement)
      .append('svg')
      .attr('class', 'pie')
      .attr('width', width)
      .attr('height', height);

    var g = svg.append('g')
      .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

    var arc = d3.arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius);

    var pie = d3.pie()
      .value((d: any) => { return d; })
      .sort(null)
      .startAngle(anglesRange * -1)
      .endAngle(anglesRange);

    var path = g.selectAll('path')
      .data(pie(data))
      .enter()
      .append("g")
      .append('path')
      .attr('d', (d: any) => {
        const tmp = arc(d);
        return tmp;
      })
      .attr('fill', (d: any, i) => { return color[i] })
      .each(function (d, i) { current = i; });

    svg
      .append('image')
      .attr('xlink:href', () => {
        if (this.remaining === 0) {
          return this.getIcon('efficiency_purple', true);
        } else {
          return this.getIcon(this.label, true);
        }
      })
      .attr('x', radius / 2)
      .attr('y', radius / 4)
      .attr('width', radius)
      .attr('height', radius);

    g.append('text')
      .attr('stroke', 'black')
      .attr('text-anchor', 'middle')
      .attr('dy', '2.45em')
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
      .attr("width", '16px')
      .attr("height", '16px')
      .attr('id', this.label)
      .style('cursor', 'pointer')
      .attr('x', radius / 2)
      .attr('y', radius / 4)
      .on("click", ($event: any) => {
        let currentLabel = event.target['id'];
        this.showInfo.emit(currentLabel);
      });

    g.append('text')
      .attr('stroke', color[0])
      .attr('text-anchor', 'middle')
      .attr('dy', '4.45em')
      .text(() => {
        let text = 0 + ' %';
        if (this.value) {
          text = this.value + ' %';
        }
        return text;
      });
  }

  clearChart() {
    d3.select(this.chartContainer.nativeElement)
      .select('svg')
      .remove();
  }

  getIcon(name: string, isSVG: boolean) {
    let extension = isSVG ? 'svg' : 'png';
    return `assets/icons/sleep/${name}.${extension}`;
  }
}
