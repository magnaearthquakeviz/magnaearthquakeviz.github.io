/**Data structure for the data associated with an indiviudal earthquake */
class PlotData {
    /**
     *
     * @param time - Origin time of the earthquake
     * @param lat - Latitude of the earthquake hypocenter
     * @param lon - Longitude of the earthquake hypocenter
     * @param depth - Depth of the earthquake hypocenter
     * @param mag - Magnitude of the earthquake
     */
    constructor(time, lat, lon, depth, mag, x) {
        this.time = time
        this.lat = +lat
        this.lon = +lon
        this.depth = +depth
        this.mag = +mag
        this.x = +x
    }
}

class CountPlotData {
    constructor(xVal, yVal, cVal) {
        this.xVal = xVal;
        this.yVal = yVal;
        this.cVal = cVal;
    }
}

/**Class represents the scatter plot view. */
class Scatter {
    /**
     * Creates a new Scatter Object for plotting a 2D scatter plot of earthquake information
     *
     * @param quakeData - geoJson file of earthquake information
     * @param row - The row on the website to draw the plot
     * @param column- The column on the website to draw the plot
     * @param xsec - Specifies if drawing a cross-section plot, which has the x-axis on the
     *              top and the data includes position along the cross-section line
     */
    constructor(quakeData, row, column, xsec = false) {
        this.width = 750;
        this.height = 500;
        this.panel = `#panel${row}-${column}`; //'#panel' + row + '-' + column;
        this.panelID = `panel${row}-${column}`;

        this.xsec = xsec
        this.quakeData = quakeData;

        // Set the plot data depending on the input data format
        if (this.xsec) {
            this.plotData = this.setXSecData(quakeData);
        } else {
            this.plotData = this.setScatterPlotData(quakeData);
        }

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
        this.xAxisLabel = this.svgGroup.append('text').classed('x-label', true)
            .style('text-anchor', 'middle')

        this.yAxis = this.svgGroup.append('g')
            .classed('y-axis', true);
        this.yAxisLabel = this.svgGroup.append('text').classed('y-label', true)
            .style('text-anchor', 'middle')
            .attr('transform', `translate(-30, ${this.vizHeight / 2}), rotate(270)`);

        let legendGroup = d3.select(`${this.panel} > div.visArea`)
            .append('div')
            .append('svg')
            .attr('width', this.width)
            .attr('height', 80)
            .append('g')
            .attr('transform', `translate(${this.vizWidth / 2 - 75 + this.margin}, 0)`);


        legendGroup.append('rect')
            .attr('width', 150)
            .attr('height', 70)
            .attr('fill', 'lightgrey')
            .attr('rx', 5)
            .attr('opacity', 0.75);
        legendGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('x', 75)
            .attr('y', 17)
            .text('Legend');

        let legendLowGroup = legendGroup.append('g')
            .attr('transform', 'translate(40, 30)');
        let legendHighGroup = legendGroup.append('g')
            .attr('transform', 'translate(110, 30)');


        this.legendLow = legendLowGroup.append('circle')
            .classed('legend', true)
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 3);
        this.legendHigh = legendHighGroup.append('circle')
            .classed('legend', true)
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 3);
        this.legendLowLabel = legendLowGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(0, 25)');
        this.legendHighLabel = legendHighGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(0, 25)');

        if (this.xsec) {
            this.xAxis.attr('transform', `translate(0, ${this.margin})`);
            this.xAxisLabel.attr('transform', 'translate(' + (this.vizWidth / 2) + ',' + 0 + ')');
            this.yAxis.attr('transform', `translate(0, ${this.margin})`)
        } else {
            this.xAxis.attr('transform', `translate(0, ${this.vizHeight})`);
            this.xAxisLabel.attr('transform', 'translate(' + (this.vizWidth / 2) + ',' + (this.vizHeight + this.margin - 10) + ')');
        }

        this.transition = function () {
            return d3.transition()
                .duration(750)
                .ease(d3.easeCubicOut);
        };

        this.xIndicator = '';
        this.yIndicator = '';
        this.cIndicator = '';

        this.dateSliderFormatter = {
            to: function (value) {
                let date = new Date(value);
                return d3.timeFormat('%-m/%-d %-H:%M')(date);
            },
            from: function (value) {
                return Date.parse(value);
            }
        }
    }

    /**
     * Store the individual earthquake data as PlotData objects for easier access
     * @param data - Data passed in. Should follow the data format specified by quakeData
     * for general scatter plots.
     */
    setScatterPlotData(data) {
        data = data.features.map(d => {
            let coords = d.geometry.coordinates;
            let mag = d.properties.mag;
            let time = new Date(d.properties.time);
            return new PlotData(time, coords[0], coords[1], coords[2], mag, 0);
        });

        return data;
    }

    setCountData(xAxisData, yAxisData, cAxisData) {
        let data = [];
        for (let i = 0; i < xAxisData.length; i++) {
            data.push(new CountPlotData(xAxisData[i], yAxisData[i], cAxisData[i]));
        }

        return data;
    }

    /**
     * Store the individual earthquake data as PlotData objects for easier access.
     * @param data - Data passed in. Should follow the data format specified by quakeData
     * for cross-sections.
     */
    setXSecData(data) {
        data = data.map(d => {
            let time = new Date(d.time);
            return new PlotData(time, d.latitude, d.longitude, d.depth, d.mag, d.x);
        });
        return data;
    }

    /**
     * Returns the maximum magnitude event for each day.
     * @param data - Data passed in. Should follow the data format specified by quakeData.
     * @returns - An array of plotData objects, where each value is the
     * maximum (by magnitude) for the specific day.
     */
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

    /**
     * Averages the data for each day and returns an array of the averaged data.
     * @param data - Data passed in. Should follow the data format specified by quakeData.
     * @returns - An array of plotData objects, where each value is the daily average.
     */
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

    /**
     * Helper method. Adds a slider to a div with the given options.
     * @param div - div HTMLElement. This can be obtained by using
     * document.getElementById(...) or d3.select(...).node()
     * @param indicator - Indicator for which the slider is being created.
     * This should correspond to a key in the data.
     * There is no enforcement of this parameter.
     */
    addSlider(div, indicator) {
        let data = this.plotData.map(d => d[indicator]);

        if (indicator === 'time') {
            data = data.map(d => new Date(d).getTime());//Date.parse(d.toString()));
        }

        let min = d3.min(data);
        let max = d3.max(data);

        noUiSlider.create(div,
            {
                start: [min, max],
                connect: true,
                behaviour: 'drag',
                //tooltips: [true, true],
                range: {
                    'min': min,
                    'max': max
                },
                step: 0.01,
                margin: 0.1
            });

        if (indicator === 'time') {
            div.noUiSlider.updateOptions({
                step: 1000 * 60,
                margin: 1000 * 60 * 60 * 24
            });
        }

        let that = this;

        div.noUiSlider.on('start', function (values, handle) {
            if (indicator === 'time') {
                div.noUiSlider.updateOptions({
                    tooltips: [that.dateSliderFormatter, that.dateSliderFormatter]
                });
            } else {
                div.noUiSlider.updateOptions({
                    tooltips: true
                });
            }
        });

        div.noUiSlider.on('set', function (values, handle) {
            let sliders = d3.select(that.panel).selectAll('div.sliderDiv');

            let ranges = [];

            for (let node of sliders.nodes()) {
                ranges.push(node.noUiSlider.get());
            }

            for (let i = ranges.length; i < 4; i++) {
                ranges.push(null);
            }

            that.drawPlot(that.xIndicator, that.yIndicator, that.cIndicator, ranges);
        });

        div.noUiSlider.on('end', function (values, handle) {
            div.noUiSlider.updateOptions({
                tooltips: false
            });
        });
    }

    /**
     * Generates sliders using noUiSlider.
     * @param indicators - String array of indicators.
     * This should correspond to keys in the data (i.e. 'time', 'mag', 'depth', etc.)
     * There is no enforcement of this parameter (i.e. bad keys are accepted).
     */
    addSliders(indicators) {
        let that = this;

        let mainDiv = d3.select(this.panel).append('div')
            .classed('container', true);

        for (let sliderValue of indicators) {
            let sliderRow = mainDiv.append('div')
                .classed('row', true);

            sliderRow.append('div')
                .classed('col-md-2 my-auto', true)
                .append('label')
                .text(sliderValue);

            let sliderDiv = sliderRow.append('div')
                .classed('col-md-6 my-auto sliderDiv', true)
                .node();

            this.addSlider(sliderDiv, sliderValue);
        }

    }

    /**
     * Helper method. Adds a dropdown to a div with the given options.
     * @param div - d3 selection; should be a selection corresponding to a singular div.
     * There is no enforcement of this parameter.
     * @param axisOptions - String array used to control what elements are shown in the dropdown.
     * This should correspond to keys in the data (i.e. 'time', 'mag', 'depth', etc.)
     * @param label - Label for the dropdown, i.e. 'x-axis: '
     * @returns - d3 selection corresponding to the select element.
     */
    addDropdown(div, axisOptions, label, dropdownName) {


        div.append('label')
            .classed('mr-3 my-auto col-form-label', true)
            .text(label);

        let ret = div.append('select')
            .classed('form-control my-auto col-sm-3', true)
            .attr('id', `${this.panelID}-${dropdownName}`);

        ret.selectAll('option')
            .data(axisOptions)
            .join('option')
            .text(d => d)
            .attr('value', d => d);

        return ret;
    }

    /**
     * Generates axis dropdowns.
     * @param axisOptions - String array used to control what elements are shown in the dropdown.
     * This should correspond to keys in the data (i.e. 'time', 'mag', 'depth', etc.)
     */
    addDropdowns(axisOptions) {
        let that = this;

        let form = d3.select(this.panel)
            .append('div')
            .append('form');

        let rowCommonClasses = 'form-group form-row';

        let xRow = form.append('div')
            .classed(rowCommonClasses, true);
        let xSelect = this.addDropdown(xRow, axisOptions, 'x-axis: ', 'x-dropdown');

        let yRow = form.append('div')
            .classed(rowCommonClasses, true);
        let ySelect = this.addDropdown(yRow, axisOptions, 'y-axis: ', 'y-dropdown');

        let cRow = form.append('div')
            .classed(rowCommonClasses, true);
        let cSelect = this.addDropdown(cRow, axisOptions, 'c-size ', 'c-dropdown');

        // Update dropdown values.
        xSelect.node().value = this.xIndicator;
        ySelect.node().value = this.yIndicator;
        cSelect.node().value = this.cIndicator;

        // Add onchange event handler to all selectLists.
        d3.select(this.panel).selectAll('select')
            .on('change', function (d, i) {
                let xIndicator = xSelect.node().value;
                let yIndicator = ySelect.node().value;
                let cIndicator = cSelect.node().value;
                that.drawPlot(xIndicator, yIndicator, cIndicator);
            });
    }

    /**
     * Generates axis dropdowns with sliders to control what data is shown.
     * @param axisOptions - String array used to control what elements are shown in the dropdown.
     * This should correspond to keys in the data (i.e. 'time', 'mag', 'depth', etc.)
     */
    addDropdownAndSlider(axisOptions) {
        let that = this;

        let form = d3.select(this.panel)
            .append('div')
            .classed('container-fluid', true)
            .append('form');

        let rowCommonClasses = 'form-group row d-flex justify-content-center flex-row';
        let sliderCommonClasses = 'col-md-5 my-auto ml-md-2 sliderDiv';

        let xRow = form.append('div')
            .classed(rowCommonClasses, true);
        let xSelect = this.addDropdown(xRow, axisOptions, 'x-axis: ', 'x-dropdown');
        let xSlider = xRow.append('div')
            .classed(`${sliderCommonClasses} x-axis-slider`, true)
            .attr('id', `${this.panelID}-x-axis-slider`)
        this.addSlider(xSlider.node(), this.xIndicator);

        let yRow = form.append('div')
            .classed(rowCommonClasses, true);
        // Add special 'count' option
        let yAxisOptions = axisOptions;
        if(!this.xsec) {
            yAxisOptions = [...axisOptions, 'count']
        }
        let ySelect = this.addDropdown(yRow, yAxisOptions, 'y-axis: ', 'y-dropdown');
        let ySlider = yRow.append('div')
            .classed(`${sliderCommonClasses} y-axis-slider`, true)
            .attr('id', `${this.panelID}-y-axis-slider`);
        this.addSlider(ySlider.node(), this.yIndicator);


        let cRow = form.append('div')
            .classed(rowCommonClasses, true);
        let cSelect = this.addDropdown(cRow, axisOptions, 'c-size: ', 'c-dropdown');
        let cSlider = cRow.append('div')
            .classed(`${sliderCommonClasses} c-size-slider`, true)
            .attr('id', `${this.panelID}-c-size-slider`);
        this.addSlider(cSlider.node(), this.cIndicator);

        xSelect.node().value = this.xIndicator;
        ySelect.node().value = this.yIndicator;
        cSelect.node().value = this.cIndicator;

        // Add onchange event handler to all selectLists.
        d3.select(this.panel).selectAll('select')
            .on('change', function (d, i) {
                let xIndicator = xSelect.node().value;
                let yIndicator = ySelect.node().value;
                let cIndicator = cSelect.node().value;
                that.drawPlot(xIndicator, yIndicator, cIndicator);
            });
    }

    /**
     * Function used to both draw and update the plot
     * @param xIndicator - Indicator used to filter data on x axis
     * @param yIndicator - Indicator used to filter data on y axis
     * @param cIndicator - Indicator used to filter circle size
     * @param ranges - Array of 3 pairs (i.e. [[a, b], [c, d], [e, f]])
     * The pairs correspond to the x range, y range, and circle size range respectively.
     * The ranges are generated by the sliders and should not be manually set.
     * If no range is specified, it uses the entirety of plotData.
     * If a range is specified, it uses the ranges to filter the elements displayed.
     */
    drawPlot(xIndicator, yIndicator, cIndicator, ranges = null) {
        //Grey out (or restore) y indicator slider
        let slider = d3.select(`${this.panel}-y-axis-slider`);
        if (slider) {
            slider.classed('disabled', () => yIndicator === 'count');
        }

        //Grey out (or restore) circle size dropdown and slider
        let cDropdown = d3.select(`${this.panel}-c-dropdown`);
        if (cDropdown) {
            cDropdown.classed('disabled', () => yIndicator === 'count')
        }
        slider = d3.select(`${this.panel}-c-size-slider`);
        if (slider) {
            slider.classed('disabled', () => yIndicator === 'count');
        }

        // Update indicators and sliders (if present)
        if (xIndicator !== this.xIndicator) {
            this.xIndicator = xIndicator;
            let slider = d3.select(`${this.panel}-x-axis-slider`).node();
            if (slider) {
                slider.noUiSlider.destroy();
                this.addSlider(slider, this.xIndicator);
            }
        }
        if (yIndicator !== this.yIndicator) {
            this.yIndicator = yIndicator;
            // don't update the slider if 'count' was chosen
            if (yIndicator !== 'count') {
                let slider = d3.select(`${this.panel}-y-axis-slider`).node();
                if (slider) {
                    slider.noUiSlider.destroy();
                    this.addSlider(slider, this.yIndicator);
                }
            }
        }
        if (cIndicator !== this.cIndicator) {
            this.cIndicator = cIndicator;
            let slider = d3.select(`${this.panel}-c-size-slider`).node();
            if (slider) {
                slider.noUiSlider.destroy();
                this.addSlider(slider, this.cIndicator);
            }
        }

        // Get data arrays
        let xData = this.plotData.map(d => d[this.xIndicator]);
        let yData = this.plotData.map(d => d[this.yIndicator]);
        let cData = this.plotData.map(d => d[this.cIndicator]);

        // Set up default range values
        let xMin = d3.min(xData);
        let xMax = d3.max(xData);
        let yMin = d3.min(yData);
        let yMax = d3.max(yData);
        let cMin = d3.min(cData);
        let cMax = d3.max(cData);

        let xScale, yScale, cScale;

        // Adjust ranges to slider values if applicable
        if (ranges) {
            if (ranges[0]) {
                let xRanges = ranges[0];
                xMin = xRanges[0];
                xMax = xRanges[1];
            }
            if (ranges[1]) {
                let yRanges = ranges[1];
                yMin = yRanges[0];
                yMax = yRanges[1];
            }
            if (ranges[2]) {
                let cRanges = ranges[2];
                cMin = cRanges[0];
                cMax = cRanges[1];
            }
        }

        // Bin the data if the y-axis parameter is 'count'
        if (yIndicator === 'count') {
            let binGenerator = d3.bin().thresholds(50);
            let binnedData = binGenerator(xData.filter(d => {
                return ((d.valueOf() >= xMin)
                    && (d.valueOf() <= xMax));
            }));

            let newXData = [];
            let newYData = [];
            let newCData = [];

            for (let bin of binnedData) {
                let midpoint = (bin.x1 + bin.x0) / 2;
                newXData.push(new Date(midpoint));
                newYData.push(bin.length);
                newCData.push(5); //max-sized circles
            }
            //recalculate mins and maxes
            yMin = d3.min(newYData);
            yMax = d3.max(newYData);
            cMin = 1;
            cMax = 5;

            //set new data
            xData = newXData;
            yData = newYData;
            cData = newCData;
        }

        // Set up scales
        if (this.xIndicator === 'time') {
            xScale = d3.scaleTime().domain([xMin, xMax]).range([0, this.vizWidth]); //.nice();
        } else {
            xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, this.vizWidth]); //.nice();
        }
        if (this.yIndicator === 'time') {
            yScale = d3.scaleTime().domain([yMin, yMax]).range([this.vizHeight, 0]); //.nice();
        } else {
            // flip the y-axis if drawing a cross-section
            if (this.xsec) {
                yScale = d3.scaleLinear().domain([yMin, yMax]).range([0, this.vizHeight - this.margin]);
            } else {
                yScale = d3.scaleLinear().domain([yMin, yMax]).range([this.vizHeight, 0]);
            }
        }

        cScale = d3.scaleSqrt().domain([cMin, cMax]).range([2, 5]);

        // Label axis
        this.xAxisLabel.text(this.xIndicator);
        this.yAxisLabel.text(this.yIndicator);

        let timeFormat = d3.timeFormat('%-m/%-d');

        // Set up axis ticks
        let xAxisCall, yAxisCall;
        // draw the x-axis on top if drawing a cross-section
        if (this.xsec) {
            xAxisCall = d3.axisTop(xScale);
            yAxisCall = d3.axisLeft(yScale);
        } else {
            xAxisCall = d3.axisBottom(xScale);
            yAxisCall = d3.axisLeft(yScale);
        }

        if (this.xIndicator === 'time') {
            xAxisCall.tickFormat(timeFormat);
        }
        if (this.yIndicator === 'time') {
            yAxisCall.tickFormat(timeFormat);
        }

        // Call axis
        this.xAxis.call(xAxisCall).transition(this.transition);
        this.yAxis.call(yAxisCall).transition(this.transition);

        // Transform to margin
        this.svgGroup.attr("transform", `translate(${this.margin}, ${this.margin})`);

        // TODO: Implement opacity scaling better or remove entirely.
        let opacityScale = d3.scaleLinear().domain([cMin, cMax]).range([0.3, 1]);

        let that = this;

        // Draw points; filter to slider values if applicable
        let circles;
        if (yIndicator === 'count') {
            // link the new data set
            let countData = this.setCountData(xData, yData, cData);
            circles = this.svgGroup.selectAll('circle')
                .data(countData.filter(d => {
                    return ((d.xVal >= xMin)
                        && (d.xVal <= xMax)
                        && (d.yVal >= yMin)
                        && (d.yVal <= yMax)
                        && (d.cVal >= cMin)
                        && (d.cVal <= cMax))
                }))
                .join('circle')
                .transition(this.transition)
                .attr('cx', d => xScale(d.xVal))
                .attr('cy', d => yScale(d.yVal))
                .attr('r', d => cScale(d.cVal));

        } else {
            circles = this.svgGroup.selectAll('circle')
                .data(this.plotData.filter(d => {
                    let xVal = d[this.xIndicator];
                    let yVal = d[this.yIndicator];
                    let cVal = d[this.cIndicator];
                    return ((xVal >= xMin)
                        && (xVal <= xMax)
                        && (yVal >= yMin)
                        && (yVal <= yMax)
                        && (cVal >= cMin)
                        && (cVal <= cMax));
                }))
                .join('circle')
                .transition(this.transition)
                .attr('cx', d => xScale(d[this.xIndicator]))
                .attr('cy', d => yScale(d[this.yIndicator]))
                .attr('r', d => cScale(d[this.cIndicator]));
        }

        //set or unset css changes for count mode
        this.svgGroup.selectAll('circle')
            .classed('count-mode', () => yIndicator === 'count');

        // Shift circles to work with the x-axis on top
        if (this.xsec) {
            circles.attr("transform", `translate(0, ${this.margin})`)
        }

        this.svgGroup.selectAll('circle')
            .on('mouseenter', function () {
                let selected = d3.select(this);

                that.svgGroup.selectAll('circle')
                    .classed('unfocused', true);

                selected.classed('unfocused', false)
                    .classed('focused', true);

                selected.append('title')
                    .text(`Date: ${that.dateSliderFormatter.to(selected.datum().time)}\n`
                        + `Coordinates: (${selected.datum().lat}, ${selected.datum().lon})\n`
                        + `Magnitude: ${selected.datum().mag}\n`
                        + `Depth: ${selected.datum().depth}`);
            })
            .on('mouseleave', function () {
                that.svgGroup.selectAll('circle')
                    .classed('unfocused focused', false);

                d3.select(this)
                    .selectAll('title')
                    .remove();
            });


        this.legendLow.transition(this.transition).attr('r', d => cScale(cMin));
        this.legendHigh.transition(this.transition).attr('r', d => cScale(cMax));
        if (cIndicator === 'time')
        {
            cMin = this.dateSliderFormatter.to(cMin);
            cMax = this.dateSliderFormatter.to(cMax);
        }
        else
        {
            cMin = d3.format('.2f')(cMin);
            cMax = d3.format('.2f')(cMax);
        }
        this.legendLowLabel.transition(this.transition).text(cMin);

        this.legendHighLabel.transition(this.transition).text(cMax);


        //  TODO: Implement opacity scaling better or remove entirely.
        //  .attr('opacity', d => opacityScale(d[this.cIndicator]));
    }
}