let outline = d3.json('Resources/Utah_State_Boundary.geojson');
let quakes = d3.json('Data/earthquake_data.geojson');
let outline2 = d3.json('Resources/Utah_Lakes_NHD.geojson');

Promise.all([outline, quakes, outline2]).then(combinedData => {
    console.log(combinedData);

    let outlineData = combinedData[0];
    let quakeData = combinedData[1];
    let lakeData = combinedData[2];

    let width, height;
    width = height = 500;

    // let outlineProjection = d3.geoConicConformal()
    //     .parallels([40 + 43 / 60, 41 + 47 / 60])
    //     .rotate([111 + 30 / 60, 0])
    //     .fitSize([width, height], outlineData);

    let magnitudeArray = d3.map(quakeData.features, d => d.properties.mag);

    let magnitudeScale = d3.scaleSqrt()
        .domain(d3.extent(magnitudeArray))
        .range([0.01, 5]);

    let colorScale = d3.scaleOrdinal()

    let projection = d3.geoConicConformal()
        .parallels([40 + 43 / 60, 41 + 47 / 60])
        .rotate([111 + 30 / 60, 0])
        .fitSize([width, height], outlineData);

    let path = d3.geoPath().projection(projection);

    // let path = (projectionData) => d3.geoPath().projection(
    //     d3.geoConicConformal()
    //         .parallels([40 + 43 / 60, 41 + 47 / 60])
    //         .rotate([111 + 30 / 60, 0])
    //         .fitSize([width, height], projectionData)
    // );

    let svg = d3.select('#panel1-2 > div.visArea')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Group for outline
    svg.append('g')
        .attr('id', 'outlineG')
        .selectAll('path')
        .data(outlineData.features)
        .join('path')
        .attr('d', path);

    // Group for water features - used to debug/make sure it was landing roughly in Magna
    svg.append('g')
        .attr('id', 'lakeG')
        .selectAll('path')
        .data(lakeData.features)
        .join('path')
        .attr('d', path);

    let mainQuake = quakeData.features[d3.maxIndex(quakeData.features, d => d.properties.mag)];

    // Selects the events the day of and
    let quakeDataFiltered = quakeData.features.filter(d => (d.properties.time > 1584489600000 && d.properties.time < 1584576000000) && d.properties.mag > 2.0);

    console.log(quakeDataFiltered);

    // Group for earthquakes
    svg.append('g')
        .attr('id', 'quakeG')
        .selectAll('circle')
        .data(quakeDataFiltered)
        .join('circle')
        .attr('cx', d => projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
        .attr('cy', d => projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
        .attr('r', d => magnitudeScale(d.properties.mag))
        .attr('stroke', 'black')
        .attr('stroke-width', '1px')
        .attr('fill', 'red')
        .on('mouseenter', function() {
            d3.select('#quakeG')
                .selectAll('circle')
                .attr('opacity', '0.5');

            let selected = d3.select(this);


            let date = new Date(selected.datum().properties.time);

            selected.attr('stroke-width', '3px');
            selected.append('title')
                .text(`Magnitude: ${selected.datum().properties.mag}\nTime: ${date.toUTCString()}`);
        })
        .on('mouseleave', function () {
            d3.select('#quakeG')
                .selectAll('circle')
                .attr('opacity', '1');

            let selected = d3.select(this);
            selected.attr('stroke-width', '1px');
            selected.selectAll('title').remove();
        })
    ;

    // svg.append('g')
    //     .selectAll('circle')
    //     .data([mainQuake])
    //     .join('circle')
    //     .attr('cx', d => projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0])
    //     .attr('cy', d => projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1])
    //     .attr('r', d => magnitudeScale(d.properties.mag))
    //     .attr('fill', 'steelblue');


    // // Group for earthquakes
    // svg.append('g')
    //     .attr('id', 'quakeG')
    //     .selectAll('path')
    //     .combinedData([quakeData], d => d.features)
    //     .join('path')
    //     .attr('d', path(quakeData));

});