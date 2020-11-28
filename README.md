# Understanding the 2020 Magna, Utah Earthquake Sequence

## Team Members:
- [Alysha Armstrong](mailto:alysha.armstrong@utah.edu "alysha.armstrong@utah.edu")
- [Andrew Golightly](mailto:andrew.golightly@utah.edu "andrew.golightly@utah.edu")
- [Guy Watson](mailto:guy.watson@utah.edu "guy.watson@utah.edu")

## Project Overview
We hope to create an effective and informative visualisation centered around the 2020 Magna Earthquake Sequence and the resulting aftershocks. In the aftermath of this earthquake, social media and the news were filled with misinformation and confusion about aftershocks, possibilites of a larger earthquake, and other similar items. We plan to create our visualisation as a way to explain and reduce many of the worries people have during earthquakes and their aftershocks by analyzing the Magna Sequence and its many aftershocks. 

## Documentation
- [Project Proposal](./Documentation/MagnaEarthquakeProject.pdf)
- [Feedback Exercise](./Documentation/feedback_exercise.md)

## Data
- [Individual Earthquake Data](https://earthquake.usgs.gov/earthquakes/search/): Downloaded earthquakes near Magna, UT from 18 March 2020 - 04 November 2020
- [Felt Reports by ZIP](https://earthquake.usgs.gov/earthquakes/eventpage/uu60363602/dyfi/intensity): Estimated intensity for a zipcode based on USGS Felt Reports
- [Station Lists](https://earthquake.usgs.gov/earthquakes/eventpage/uu60363602/shakemap/intensity): Seismometers recording the mainshock event
- [Utah Quaternary Faults](https://geology.utah.gov/apps/qfaults/): Downloaded as a kmz file and converted to geoJson using [mygeodata.cloud](https://mygeodata.cloud/converter/kmz-to-json)
- Cross-Section Data: Used [The Generic Mapping Tools](https://www.soest.hawaii.edu/gmt/) pscoupe function to project the earthquakes onto the selected cross-section line
- Waveform Data from IRIS

## Resources
- GeoJSON files sourced from [opendata.gis.utah.gov](https://opendata.gis.utah.gov)
  - [State Boundary](https://opendata.gis.utah.gov/datasets/utah-state-boundary): filtered to ignore the mask and only contain the outline
  
  - [Lake Dataset](https://opendata.gis.utah.gov/datasets/utah-lakes-nhd): filtered to only use data categorized as ISMAJOR and INUTAH. 
