var React = require("react");
var openCPQ = require("opencpq");
var Baby = require("babyparse");
var saveAs = require("browser-filesaver");

class BOMView {
	constructor(name, bom) {
		this.name = name;
		this.__bom = bom;
	}
	render() {
		return <ReactBom bom={this.__bom}/>
	}
}

var ReactBom = React.createClass({
	getInitialState() {
		return {itemMap: {}};
	},
	componentDidMount() {
		$.ajax({
			url: "resources/materials.tsv",
			success: string => {
				Baby.parse(string, {
					complete: ({data}) => {
						var itemMap = {};
						data.forEach(line => {
							var length = line.length;
							if (length > 0)
								itemMap[line[0]] = {label: length > 1 ? line[1] : undefined, price: length > 2 ? line[2] : undefined};
						});
						this.setState({itemMap});
					},
					fastMode: true,
					skipEmptyLines: true,
				});
			}
		});
	},
    exportCSV() {
        var csv = [];
        this.props.bom.mapItems(
            (item, quantity) => {
                var entry = this.state.itemMap[item];
                var label = entry == undefined ? "" : entry.label;
                var price = entry == undefined ? "" : entry.price;
			    var parsedPrice = parseFloat(price);
			    if (!isNaN(parsedPrice))
			    	price = parsedPrice.toLocaleString([], {localeMatcher: "lookup", minimumFractionDigits: 2, maximumFractionDigits: 2});
                csv.push(openCPQ.csvLine([quantity, item, label, price])); // TODO use Baby.unparse
            });
        var blob = new Blob(csv, {type: "text/csv;charset=utf-8"});
        saveAs(blob, "openCPQ.csv");
    },
	render() {
    	console.log({props: this.props});
		var accumulatedPrice = 0;
		return <div>
			<button onClick={() => this.exportCSV()}>export as CSV</button>
			<table className="bom"><tbody>
				<tr>
					<th className="bom-quantity-head">#</th>
					<th className="bom-item-head">Material No.</th>
					<th className="bom-description-head">Description</th>
					<th className="bom-price-head">Price (€)</th>
				</tr>
				{this.props.bom.empty() ?
				 <tr><td colSpan={4}>
					 <div className="validate validate-info">(no entries)</div>
				 </td></tr> :
				 this.props.bom.mapItems(
					 (item, quantity) => {
						 var entry = this.state.itemMap[item];
						 var label = entry == undefined ? "(missing)" : entry.label;
						 var price = entry == undefined ? "(missing)" : entry.price;
						 var parsedPrice = parseFloat(price);
						 if (!isNaN(parsedPrice)) {
							 price = parsedPrice.toLocaleString([], {localeMatcher: "lookup", minimumFractionDigits: 2, maximumFractionDigits: 2});
							 accumulatedPrice = accumulatedPrice + parsedPrice; // TODO display accumulated price
						 }
						 return <tr>
							 <td className="bom-quantity">{quantity}</td>
							 <td className="bom-item">{item}</td>
							 <td className="bom-label">{label}</td>
							 <td className="bom-price">{price}</td>
						 </tr>;
					 }
				 )}
			</tbody>
		</table>
		</div>;
	}
});

function VBOM({bom}) {
	return new BOMView("bom", bom);
}

module.exports = {VBOM, BOMView};
