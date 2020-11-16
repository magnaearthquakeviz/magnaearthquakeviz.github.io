
class PlotData{

    constructor(time, lat, lon, depth, mag){
        this.time = time
        this.lat = lat
        this.lon = lon 
        this.depth = depth 
        this.mag = mag
    }
}


class Scatter{
    constructor(quakeData, row, column){
        this.width = this.height = 500;
        this.panel = '#panel' + row + '-' + column;

        this.quakeData = quakeData
        this.plotData = this.setPlotData(quakeData)
        this.margin = 40 
    }

    setPlotData(data){
        data = data.features.map(d => {
            let coords = d.geometry.coordinates
            let mag = d.properties.mag
            let time = new Date(d.properties.time)
            return new PlotData(time, coords[0], coords[1], coords[2], mag)
        })

        return data
    }

    drawPlot(xIndicator, yIndicator) {
        let svg = d3.select(this.panel + ' > div.visArea')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
    
        let svgGroup = svg.append('g').classed('scatter-plot', true).append('g').classed('wrapper', true)
        
        let height = this.height - 2*this.margin 
        let width = this.width - 2*this.margin

        let xData = this.plotData.map(d => d[xIndicator]);
        let xmin = d3.min(xData);
        let xmax = d3.max(xData);
        let xScale
        if (xIndicator === 'time'){
            xScale =  d3.scaleTime().domain([xmin, xmax]).range([0, width]).nice();
        } else{
            xScale =  d3.scaleLinear().domain([xmin, xmax]).range([0, width]).nice();
        }

        let yData = this.plotData.map(d => d[yIndicator])
        let ymin = d3.min(yData)
        let ymax = d3.max(yData)
        let yScale =  d3.scaleLinear().domain([ymin, ymax]).range([height, 0]).nice();         

        svgGroup.append('g').classed('x-axis', true)
                .attr('transform', 'translate(' + 0 + ',' + height + ')')
                .call(d3.axisBottom(xScale))
        
        svgGroup.append('text').classed('x-label', true)
            .text(xIndicator)
            .style('text-anchor', 'middle')
            .attr('transform', 'translate(' + (width/2) + ',' + (height + this.margin) + ')');
        
        svgGroup.append('g').classed('y-axis', true).call(d3.axisLeft(yScale))
        
        svgGroup.append('text').classed('y-label', true)
            .text(yIndicator)
            .style('text-anchor', 'middle')
            .attr('transform', 'translate(' + -30 + ',' + (height/2) + '), rotate(270)')

        svgGroup.attr("transform", "translate(" + this.margin + "," + this.margin + ")")

        svgGroup.selectAll("circle")
            .data(this.plotData)
            .join("circle")
            .attr('cx', d => xScale(d[xIndicator]))
            .attr('cy', d=> yScale(d[yIndicator]))
            .attr('r', 3)
    }
}