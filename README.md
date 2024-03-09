# TIGERMap!
A map to help aid OpenStreetMap mappers in the ongoing effort to complete the [review of roadway data](https://wiki.openstreetmap.org/wiki/TIGER_fixup) from the [TIGER import](https://wiki.openstreetmap.org/wiki/TIGER).

Some links with more about TIGERMap and its usage.

* [OSM Community Forum announcement thread](https://community.openstreetmap.org/t/announcing-tigermap-tiger-reviewed-no/110004)
* [OSM Changes that have used this tool](https://resultmaps.neis-one.org/osm-changesets?comment=TIGERMap)
* [Changesets on OSMCHA](https://osmcha.org/?filters=%7B%22metadata%22%3A%5B%7B%22label%22%3A%22hashtags%3D%23TIGERMap%22%2C%22value%22%3A%22hashtags%3D%23TIGERMap%22%7D%5D%7D)

Inspired by [Amanda McCann's](https://en.osm.town/@amapanda) https://www.waterwaymap.org with a UI overhaul from user [Mxdanger](https://www.openstreetmap.org/user/Mxdanger).

## Layers

The site has 5 overlay layers available but I would love to add anything folks find useful.

* `tiger:reviewed=no` - All items with this key=value. The work to be done.
* `addr:housenumber` - All items with this key=value. Areas where there may be corroborating evidence for roadway names
* `tiger railway` - All items with `tiger:reviewed=no` and `railway=rail`. 
* `tiger pipeline` - All items with `tiger:reviewed=no` and `man_made=pipeline`. 
* `redlined` - the set of neighborhoods that were historically [redlined](https://dsl.richmond.edu/panorama/redlining/)

## Filters

The top navigation bar has a text box for users to input filters that may interest them. Filters always apply to the `tiger:reviewed=no` layer. No tags have been stripped so there's a rich set of tags to investigate and get inspiration from. Here's some ideas to try:

* cycleway
* lanes
* lit
* surface
* tiger:source
* surface=*
* highway=trunk
* railway=abandoned
* surface=paved,asphalt

## Copyright

Copyright MIT or Apache-2.0

