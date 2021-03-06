import { Component, ElementRef, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as d3 from 'd3';
import {EthereumAnalysisService} from "../../services/ethereum-analysis.service";

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css']
})
export class AccountInfoComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;
  @ViewChild('totalAmount') private amountElement: ElementRef;
  // TODO: get the graph data from the service instead
  private graphData: any = {
    "nodes": [],
    "links": []
  };
  private accountsTransactions = [];
  private chart: any;
  private width: number;
  private height: number;
  private margin: any = {top: 20, bottom: 20, left: 20, right: 20};
  private accountAddress: string;

  constructor(private ethereumAnalysisService: EthereumAnalysisService) {
  }

  ngOnInit() {

  }

  getInfoForAccount(accountAddress:string) {
    d3.select("svg").remove();
    this.ethereumAnalysisService.getAccountGraph(accountAddress).subscribe((res: Response) => {
      this.graphData = res.json();

      this.graphData.links.forEach((link, index) => {
        if (link.type === "Transaction") this.accountsTransactions.push(link);
      });

      this.createChart();
    });
    this.ethereumAnalysisService.getTotalValue(accountAddress).subscribe((res: Response) => {
      this.setTotalValue(res.json());
    })
  }

  setTotalValue(json:any){
    let container = this.amountElement.nativeElement;
    let message
    if(json.value){
      let valueNum = parseInt(json.value, 10) 
      if(!isNaN(valueNum) && valueNum >= 0){
        message = "Total revenue: " + json.value + " ether";
      } else {
        message = "No revenue found for this address";
      }
    }
    d3.select(container).html(message);
  }

  ngOnChanges() {
    /*   if (this.chart) {
     // TODO: check out this example for re-scaling the graph: https://github.com/keathmilligan/angular2-d3-v4/blob/master/src/app/shared/barchart/barchart.component.ts
     this.updateChart();
     } */
  }


  createChart() {
    let element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    // force layout setup
    let force = (<any> d3).layout.force()
      .charge(-1000).linkDistance(100).size([this.width, this.height]);

    // setup svg div
    let svg = d3.select(element).append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("pointer-events", "all");

    force.nodes(this.graphData.nodes).links(this.graphData.links).start();

    // render relationships as lines
    let link = svg.selectAll(".link")
      .data(this.graphData.links).enter()
      .append("line").attr("class", "link");

    // render nodes as circles, css-class from label
    let node = svg.selectAll(".node")
      .data(this.graphData.nodes).enter()
      .append("circle")
      .attr("class", function (d) {
        return "node " + (<any> d).label
      })
      .attr("r", 20)
      .call(force.drag);

    // html title attribute for title node-attribute
    node.append("title")
      .text(function (d) {
        let title = (<any> d).properties.address || (<any> d).properties.blockNumber;
        return title;
      });

    // force feed algo ticks for coordinate computation
    force.on("tick", function () {
      link.attr("x1", function (d) {
        return (<any> d).source.x;
      })
        .attr("y1", function (d) {
          return (<any> d).source.y;
        })
        .attr("x2", function (d) {
          return (<any> d).target.x;
        })
        .attr("y2", function (d) {
          return (<any> d).target.y;
        });

      node.attr("cx", function (d) {
        return (<any> d).x;
      })
        .attr("cy", function (d) {
          return (<any> d).y;
        });
    });
  }

}

