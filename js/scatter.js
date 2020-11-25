class PlotData {

    constructor(time, lat, lon, depth, mag) {
        this.time = time
        this.lat = lat
        this.lon = lon
        this.depth = depth
        this.mag = mag
    }
}

class Scatter {
    constructor(quakeData, row, column) {
        this.width = 750;
        this.height = 500;
        this.panel = `#panel${row}-${column}`; //'#panel' + row + '-' + column;
        this.panelID = `panel${row}-${column}`;

        this.quakeData = quakeData;
        this.plotData = this.setPlotData(quakeData);

        this.margin = 40;

        this.svg = d3.select(this.panel + ' > div.visArea')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        this.svgGroup = this.svg.append('g').classed('scatter-plot', true).append('g').classed('wrapper', true)

        this.vizHeight = this.height - 2 * this.margin;
        this.vizWidth = this.width - 2 * this.margin;

        this.xAxis = this.svgGroup.append('g')
            .classed('x-axis', true)
            .attr('transform', `translate(0, ${this.vizHeight})`);
        this.xAxisLabel = this.svgGroup.append('text').classed('x-label', true)
            .style('text-anchor', 'middle')
            .attr('transform', 'translate(' + (this.vizWidth / 2) + ',' + (this.vizHeight + this.margin - 10) + ')');

        this.yAxis = this.svgGroup.append('g')
            .classed('y-axis', true);
        this.yAxisLabel = this.svgGroup.append('text').classed('y-label', true)
            .style('text-anchor', 'middle')
            .attr('transform', `translate(-30, ${this.vizHeight / 2}), rotate(270)`);

        this.transition = d3.transition()
            .duration(750)
            .ease(d3.easeCubicOut);

        //this.addDropdowns();

        this.addSliders(['time', 'mag']);
    }

    setPlotData(data) {
        data = data.features.map(d => {
            let coords = d.geometry.coordinates;
            let mag = d.properties.mag;
            let time = new Date(d.properties.time);
            return new PlotData(time, coords[0], coords[1], coords[2], mag);
        })

        return data;
    }

    // Only gets maximum magnitude event for the day.
    getMaxEvents(data) {
        let maxArr = [];

        let grouped = d3.group(data, d => {
            let date = new Date(d.properties.time);
            return `${date.getUTCDay()}_${date.getUTCMonth()}_${date.getUTCFullYear()}`;
        });

        for (let key of grouped.keys()) {
            let max = null;

            for (let point of grouped.get(key)) {
                if (max && max.properties.mag < point.properties.mag) {
                    max = point;
                } else {
                    max = point;
                }
            }

            let time = new Date(max.properties.time);
            let coords = max.geometry.coordinates;
            let mag = max.properties.mag;

            maxArr.push(new PlotData(time, coords[0], coords[1], coords[2], mag));
        }
        return maxArr;
    }

    // Averages data by day
    groupDataByTime(data) {
        let averaged = [];

        let grouped = d3.group(data, d => {
            let date = new Date(d.properties.time);
            return `${date.getUTCDay()}_${date.getUTCMonth()}_${date.getUTCFullYear()}`;
        });

        for (let key of grouped.keys()) {
            let counter = 0;
            let avgTime = 0;
            let avgMag = 0;
            let avgLon = 0;
            let avgLat = 0;
            let avgDep = 0;
            for (let point of grouped.get(key)) {
                counter++;
                avgTime += point.properties.time;
                avgMag += point.properties.mag;
                avgLon += point.geometry.coordinates[0];
                avgLat += point.geometry.coordinates[1];
                avgDep += point.geometry.coordinates[2];
            }

            avgTime = Math.ceil(avgTime / counter);
            avgMag /= counter;
            avgLon /= counter;
            avgLat /= counter;
            avgDep /= counter;

            averaged.push(new PlotData(new Date(avgTime), avgLon, avgLat, avgDep, avgMag));
        }

        return averaged;
    }

    // Add slider in conjunction with dropdown.
    // Doesn't work right now.
    addSlider(div, sliderValue) {
        let sliderDiv = div.append('div')
            .style('margin-left', '10px')
            .classed('col-sm-6 my-auto', true)
            .node();

        let data = this.plotData.map(d => d[sliderValue]);

        if (sliderValue === 'time') {
            data = data.map(d => new Date(d).getTime());//Date.parse(d.toString()));
        }

        let min = d3.min(data);
        let max = d3.max(data);

        let slider = noUiSlider.create(sliderDiv,
            {
                start: [min, max],
                connect: true,
                //tooltips: [true, true],
                range: {
                    'min': min,
                    'max': max
                }
            });
    }

    // Add sliders separate from dropdowns.
    // Hardcoded to have time and magnitude sliders, but
    // hopefully this will change in the near future.
    addSliders(sliderValues) {
        let that = this;

        let mainDiv = d3.select(this.panel).append('div')
            .classed('container', true);

        for (let sliderValue of sliderValues) {
            let sliderRow = mainDiv.append('div')
                .classed('row', true);

            sliderRow.append('div')
                .classed('col-md-2 my-auto', true)
                .append('label')
                .text(sliderValue);

            let sliderDiv = sliderRow.append('div')
                .classed('col-md-6 my-auto sliderDiv', true)
                .node();

            let data = this.plotData.map(d => d[sliderValue]);

            if (sliderValue === 'time') {
                data = data.map(d => new Date(d).getTime());//Date.parse(d.toString()));
            }

            let min = d3.min(data);
            let max = d3.max(data);

            noUiSlider.create(sliderDiv,
                {
                    start: [min, max],
                    connect: true,
                    behaviour: 'drag',
                    range: {
                        'min': min,
                        'max': max
                    },
                    step: 0.01,
                    margin: 0.1
                });

            let dateFormatter = {
                to: function (value) {
                    let date = new Date(value);
                    return d3.timeFormat('%-m/%-d %-H:%M')(date);
                },
                from: function (value) {
                    return Date.parse(value);
                }
            };

            if (sliderValue === 'time') {
                sliderDiv.noUiSlider.updateOptions({
                    // Limit step to a minute if the scale is time
                    step: 1000 * 60,
                    // Limit min width to a day
                    margin: 1000 * 60 * 60 * 24
                });
            }

            sliderDiv.noUiSlider.on('start', function (values, handle) {
                if (sliderValue === 'time') {
                    sliderDiv.noUiSlider.updateOptions({
                        tooltips: [dateFormatter, dateFormatter]
                    })
                } else {
                    sliderDiv.noUiSlider.updateOptions({
                        tooltips: true
                    });
                }
            });

            sliderDiv.noUiSlider.on('set', function (values, handle) {
                let sliders = d3.select(that.panel).selectAll('div.sliderDiv');

                let ranges = [];

                for (let node of sliders.nodes()) {
                    ranges.push(node.noUiSlider.get());
                }

                that.drawPlot('time', 'mag', 'depth', ranges);
            });

            sliderDiv.noUiSlider.on('end', function (values, handle) {
                sliderDiv.noUiSlider.updateOptions({
                    tooltips: false
                });
            });
        }

    }

    // Used to add dropdowns to set circle size and axis
    addDropdowns() {
        let that = this;

        let axisOptions = ['time', 'lat', 'lon', 'depth', 'mag'];

        let form = d3.select(this.panel)
            .append('div')
            .append('form');

        let xRow = form.append('div')
            .classed('form-group form-row', true);
        // Append the label.
        xRow.append('label')
            .attr('for', `${this.panelID}-x-axis-control`)
            .classed('col-sm-1 col-form-label', true)
            .text('x-axis');
        let xSelect = xRow.append('select')
            .attr('id', `${this.panelID}-x-axis-select`)
            .attr('name', `${this.panelID}-x-axis-control`)
            .classed('form-control col-sm-3', true)
            .selectAll('option')
            .data(axisOptions)
            .join('option')
            .text(d => d)
            .attr('value', d => d);

        // Add slider in the dropdown?
        // let xSlider = this.addSlider(xRow, xSelect.node().value);

        let yRow = form.append('div')
            .classed('form-group form-row', true);
        // Append the label
        yRow.append('label')
            .attr('for', `${this.panelID}-y-axis-control`)
            .classed('col-sm-1 col-form-label', true)
            .text('y-axis');
        let ySelect = yRow.append('select')
            .attr('id', `${this.panelID}-y-axis-select`)
            .attr('name', `${this.panelID}-y-axis-control`)
            .classed('form-control col-sm-3', true)
            //.style('text-anchor', 'middle')
            .selectAll('option')
            .data(axisOptions)
            .join('option')
            .text(d => d)
            .attr('value', d => d);

        let cRow = form.append('div')
            .classed('form-group form-row', true);
        cRow.append('label')
            .attr('for', `${this.panelID}-c-size-control`)
            .classed('col-sm-1 col-from-label', true)
            .text('circle size');
        let cSelect = cRow.append('select')
            .attr('id', `${this.panelID}-c-size-select`)
            .attr('name', `${this.panelID}-c-size-control`)
            .classed('form-control col-sm-3', true)
            .selectAll('option')
            .data(axisOptions)
            .join('option')
            .text(d => d)
            .attr('value', d => d);

        xSelect.filter(d => d === 'time').attr('selected', true);
        ySelect.filter(d => d === 'mag').attr('selected', true);
        cSelect.filter(d => d === 'mag').attr('selected', true);

        // $(`${this.panel}-x-axis-select`).on('change', OnChange(this));
        // $(`${this.panel}-y-axis-select`).on('change', OnChange(this));

        xSelect = d3.select(`#${this.panelID}-x-axis-select`);
        ySelect = d3.select(`#${this.panelID}-y-axis-select`);
        cSelect = d3.select(`#${this.panelID}-c-size-select`);


        xSelect.on('change', function (d, i) {
            let xIndicator = this.options[this.selectedIndex].value;
            let yIndicator = ySelect.node().value;
            let cIndicator = cSelect.node().value;
            that.drawPlot(xIndicator, yIndicator, cIndicator);
        });

        ySelect.on('change', function (d, i) {
            let xIndicator = xSelect.node().value;
            let yIndicator = this.options[this.selectedIndex].value;
            let cIndicator = cSelect.node().value;
            that.drawPlot(xIndicator, yIndicator, cIndicator);
        });

        cSelect.on('change', function (d, i) {
            let xIndicator = xSelect.node().value;
            let yIndicator = ySelect.node().value;
            let cIndicator = this.options[this.selectedIndex].value;
            that.drawPlot(xIndicator, yIndicator, cIndicator);
        })
    }

    drawPlot(xIndicator, yIndicator, cIndicator, ranges = null) {
        let xData = this.plotData.map(d => d[xIndicator]);
        let yData = this.plotData.map(d => d[yIndicator]);

        let xMin, yMin, xMax, yMax, xScale, yScale;

        if (ranges) {
            let xRanges = ranges[0];
            xMin = xRanges[0];
            xMax = xRanges[1];
            let yRanges = ranges[1];
            yMin = yRanges[0];
            yMax = yRanges[1];
        } else {
            xMin = d3.min(xData);
            xMax = d3.max(xData);
            yMin = d3.min(yData);
            yMax = d3.max(yData);
        }

        if (xIndicator === 'time') {
            xScale = d3.scaleTime().domain([xMin, xMax]).range([0, this.vizWidth]); //.nice();
        } else {
            xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, this.vizWidth]); //.nice();
        }

        if (yIndicator === 'time') {
            yScale = d3.scaleTime().domain([yMin, yMax]).range([this.vizHeight, 0]); //.nice();
        } else {
            yScale = d3.scaleLinear().domain([yMin, yMax]).range([this.vizHeight, 0]); // .nice();
        }

        let cData = this.plotData.map(d => d[cIndicator]);
        let cMin = d3.min(cData);
        let cMax = d3.max(cData);
        let cScale = d3.scaleSqrt().domain([cMin, cMax]).range([1, 4]);

        this.xAxisLabel.text(xIndicator);
        this.yAxisLabel.text(yIndicator);

        let timeFormat = d3.timeFormat('%-m/%-d');
        let xAxisCall = d3.axisBottom(xScale);
        let yAxisCall = d3.axisLeft(yScale);

        if (xIndicator === 'time') {
            xAxisCall.tickFormat(timeFormat);
            //this.xAxis.call(d3.axisBottom(xScale).tickFormat(timeFormat));
        }
        if (yIndicator === 'time') {
            yAxisCall.tickFormat(timeFormat);
        }

        this.xAxis.call(xAxisCall).transition(this.transition);
        this.yAxis.call(yAxisCall).transition(this.transition);

        this.svgGroup.attr("transform", `translate(${this.margin}, ${this.margin})`);

        this.svgGroup.selectAll('circle')
            .data(this.plotData.filter(d => {
                let xVal = d[xIndicator];
                let yVal = d[yIndicator];
                return ((xVal >= xMin)
                    && (xVal <= xMax)
                    && (yVal >= yMin)
                    && (yVal <= yMax));
            }))
            .join('circle')
            .transition(this.transition)
            .attr('cx', d => xScale(d[xIndicator]))
            .attr('cy', d => yScale(d[yIndicator]))
            .attr('r', d => cScale(d[cIndicator]));
    }
}