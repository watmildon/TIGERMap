#!/bin/bash
cd "$(dirname "$0")"

rm *.pmtiles
rm *.pmtiles-journal
rm *.geojson
rm us-latest-addrstreet.osm.pbf
rm us-latest-tiger.osm.pbf

rm tilesets/us-latest.pmtiles
rm tilesets/us-latest-streetaddress.pmtiles

if [ ! -s us-latest.osm.pbf ] ; then
	echo "No us-latest.osm.pbf, downloading.."
	curl -O https://download.geofabrik.de/north-america/us-latest.osm.pbf
fi

pyosmium-up-to-date -v --server https://download.geofabrik.de/north-america/us-updates/ -s 10000 us-latest.osm.pbf

osmium tags-filter --remove-tags --overwrite us-latest.osm.pbf w/tiger:reviewed=no -o us-latest-tiger.osm.pbf
osmium export --overwrite us-latest-tiger.osm.pbf  -o us-latest-tiger.geojson
tippecanoe -zg -l highways -o us-latest.pmtiles --drop-densest-as-needed us-latest-tiger.geojson

osmium tags-filter --remove-tags --overwrite us-latest.osm.pbf nwr/addr:street -o us-latest-addrstreet.osm.pbf
osmium export --overwrite us-latest-addrstreet.osm.pbf -o us-latest-addrstreet.geojson
tippecanoe -zg -l streetaddress -o us-latest-streetaddress.pmtiles --drop-densest-as-needed us-latest-addrstreet.geojson

mv us-latest.pmtiles tilesets/us-latest.pmtiles
mv us-latest-streetaddress.pmtiles tilesets/us-latest-streetaddress.pmtiles

rclone sync --transfers 1 --order-by size,descending --bwlimit 10M ~/TIGERProject/tilesets r2:tiger-map