# TIGERMap!
A map to help aid OpenStreetMap mappers in the ongoing effort to complete the [review of roadway data](https://wiki.openstreetmap.org/wiki/TIGER_fixup) from the [TIGER import](https://wiki.openstreetmap.org/wiki/TIGER).

Some links with more about TIGERMap and its usage.

* [OSM Community Forum announcement thread](https://community.openstreetmap.org/t/announcing-tigermap-tiger-reviewed-no/110004)
* [OSM Changes that have used this tool](https://resultmaps.neis-one.org/osm-changesets?comment=TIGERMap)
* [Changesets on OSMCHA](https://osmcha.org/?filters=%7B%22metadata%22%3A%5B%7B%22label%22%3A%22hashtags%3D%23TIGERMap%22%2C%22value%22%3A%22hashtags%3D%23TIGERMap%22%7D%5D%7D)

Inspired by [Amanda McCann's](https://en.osm.town/@amapanda) https://www.waterwaymap.org with a UI overhaul from user [Mxdanger](https://www.openstreetmap.org/user/Mxdanger).

## Layers

The site has 6 overlay layers available but I would love to add anything folks find useful.

* `tiger:reviewed=no` - All items with this key=value. The work to be done.
* `addr:housenumber` - All items with this key=value. Areas where there may be corroborating evidence for roadway names.
* `tiger railway` - All items with `tiger:reviewed=no` and `railway=rail`.
* `tiger pipeline` - All items with `tiger:reviewed=no` and `man_made=pipeline`.
* `National Address Database` - A rough map of where information exists in the [National Address Database](https://www.transportation.gov/gis/national-address-database) data file. This is useful for finding places where you can use NAD to do name review. I have documented my own technique in [this diary entry](https://www.openstreetmap.org/user/watmildon/diary/400827).
* `redlined` - The set of neighborhoods that were historically [redlined](https://dsl.richmond.edu/panorama/redlining/).

## Filters

The top navigation bar has a text box for users to input filters that may interest them. Filters always apply to the `tiger:reviewed=no` layer. It currently accepts filter text in the form of key names, key=value, key=value1,value2. It will also allow you to look for all items NOT having a certain key by adding a dash in front of the key value.

No tags have been stripped so there's a rich set of tags to investigate and get inspiration from. Here's some ideas to try:

* cycleway
* lanes
* lit
* surface
* tiger:source
* -name
* surface=*
* highway=trunk
* railway=abandoned
* surface=paved,asphalt

## Copyright

Copyright MIT or Apache-2.0

