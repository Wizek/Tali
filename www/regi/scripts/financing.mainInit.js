// missing Console workaround
if (typeof console != 'object') {
  console = 
    {log: function() {}
    ,warn: function() {}
    ,time: function() {}
    ,timeEnd: function() {}
  }
}
console.time("startupTimer")

var fnStack = []
	, settings = {
			render: {
				date: true,
				sentenceDetail: 3, /* 0: No main Sentence.
														 1: Displays money with +/- sign and color coding
														 2: Above + curency+income/outcome without +/- signs
														 3: Above + product/service
													 */
				unitQty: true, // unit, quantity
				incomeSource: true,
				pFamily: true,
				pCategory: true,
				pSimilar: true,
				unitPrice: true,
				comment: true,
				addTime: true
			}
		}

$(initiate)
// Initialization which requires jQuery
function initiate () {
	// Close buttons functionality
	$('button.close').live('click', function() {
		$($(this).attr('what')).remove()
	})

	$('button#addRecord').click(addRecord)
	console.timeEnd('startupTimer')
	options()
}

refresh()
function refresh () {
	$.ajax(
	  {url:'/interact/financing/loadList'
	  ,type:'POST'
	  ,contentType:'application/json'
	  ,dataType:'json'
	  ,error: this.success
	  ,success: function(resp) {
	  	var s = settings.render
	  	for (var i = 0; i < resp.docs.length; i++) {
	  		var c = resp.docs[i] // current
	  				row = ''
	  		if (c.time) {
	  			switch (new Date(c.time*100000).getDate()) {
	  				case new Date().getDate():
	  					c.time="Ma"
	  					break;
	  				case new Date().getDate()-1:
	  					c.time="Tegnap"
	  					break;
	  				case new Date().getDate()-2:
	  					c.time="Tegnapelőtt"
	  					break;
	  				default:
	  				 c.time = formatDate(c.time)+":"
	  				 break;
	  			}
	  			row = '<span class="date">'+c.time+'</span>'
	  		}
	  		row+=' <span class="hl0"><span class="'
	  		if (c.type == "income") {
	  			row+='income"><span class="hl2 hl3">+</span>'
	  		}else{
	  			row+='outcome"><span class="hl2 hl3">-</span>'
	  		}
	  		row += c.money+' </span><span class="hl2 hl3"> Ft</span></span><span class="hl0 hl1"> forintot <span class="'
	  		if (c.type == "outcome") {
	  			row += 'outcome"> költöttem </span></span><span class="hl0 hl1 hl2">'
	  			if (c.unit && c.qty) {
	  				row += ' <span class="qty unit">'+c.qty+' '+c.unit+'</span>' 
	  			}
	  			if (c.product) {
	  				row += ' '+c.product.name+' okán</span>'
	  				if (c.product.family && c.product.category) {
	  					row += '<span class="family category"> ('+c.product.family+' > '
	  							+c.product.category+')</span>'
	  				}
	  				if (c.product.similar) {
	  					row += '<span class="similar">. Rokonterméke: '+c.product.similar+'</span>'
	  				}
	  			}else if (c.service){
	  				row += ' '+c.service.name+' okán</span>'
	  			}
	  			if (s.unitPrice && c.unit && c.qty && c.qty > 1) {
	  				if ((c.money/c.qty)%1 > 0) { about = '~ ' }else{ about = "" }
	  				row+='<span class="unitPrice">. Egység-ára: '
	  					 +about+Math.floor(c.money/c.qty)+' Ft/'+c.unit+'</span>'}
	  		}else if(c.type == "income") {
	  			row += 'income"> kaptam</span></span><span class="hl0 hl1 hl2">'
	  			if (c.kind) {
	  				row += ' <span class="kind">'+c.kind+'</span> '}
	  			if (c.source) {
	  				row += ' <span class="source">(forrás: '+c.source+')</span>'}
	  			row += ' okán</span>'
	  		}
	  		if (c.comment) {
	  			row += '<span class="comment">. Megjegyzés: '+c.comment+'</span>'
	  		}
	  		row += '<span class="addTime">. Hozzáadás ideje: '+formatDateTime(c.addTime)+'</span>'
	  		row+='<span class="hl0 hl1">.</span>'
	  		if (i+1 >= $('li.data').length) { // make sure it has the space it needs
	  			$('body').append('<li class="data"></li>')}
	  		$('li.data').eq(i).html(row)
	  	}
	  	$('.hl0, .hl1, .hl2, .hl3').show()
	  	$('.hl'+s.sentenceDetail).hide()
	  	$(window).resize()
		}
	})
}
function save () {
	$.ajax(
  {url:'/interact/financing/save'
  ,data:JSON.stringify(transaction)
  ,type:'POST'
  ,contentType:'application/json'
  ,dataType:'json'
  ,error: this.success
  ,success: function(resp) {
		if (resp.ok) {
			updatePane('<button class="close" what=".topPane">Bezárás</button>',
				"A tétel sikeresen elmentésre került!")
			refresh()
		}else{
			updatePane("", JSON.stringify(resp), "Adatbázishiba mentés közben:")
		}
	}
})
}

// Add a transactional record to the db
function addRecord (Title) {
	var transaction = {}
	createPane('Könyvelési tétel hozzáadása',
		"Bevételt, vagy kiadást szeretnél könyvelni?",
		'<button id="income">Bevétel</button>\
		<button id="outcome">Kiadás</button>\n',
		"addRecord()"
	)

	$('button#income').click(function(){
		transaction.type = "income"
		var sourceOptions = ["GazdiMók", "Munkaadó/Megbizó/Üzleti partner", "Állam/Önkormányzat", "JólétAlap", "Család, barát, ismerős", "Nyeremény", "Talált pénz", "Hálapénz"]
				kindOptions = {
					"GazdiMók": ["Alkalmi", "Kölcsön", "Ajándék", ],
					"Munkaadó/Megbizó/Üzleti partner": ["Havi fizetés", "Jutalék", "Alkalmi", "Számlázott", "Fizetés", "Vételár", "Egyszeri"],
					"Állam/Önkormányzat": ["GYES", "GYED", "GYÁS", "Nyugdíj", "Income tax refund", "Property tax refund", "Családi pótlék"],
					"JólétAlap": ["Clearing bevétel"],
					"Család, barát, ismerős": ["Ajándék", "Kölcsön", "Zsebpénz"],
					"Nyeremény": ["Totó", "Lottó", "Poker", "Casino", "Kaparós", "Fogadás"],
					"Talált pénz": ["más"],
					"Hálapénz": ["Borravaló", "Paraszolvencia"]
				}
			
		updatePane('<form class="income">\
				<ul class="form">\
					<li><label for="time">Mikor? </label>\
					<input required type="date" max="'+formatDate(null, "-")+'" id="date"></li>\
					\
					<li><label for="money">Mennyit? </label>\
					<input type="number" required id="money" min="1"> Ft</li>\
					<br />\
					<li><label for="source">Honnan?</label>\
					<select id="source"></select></li>\
					<li><label for="kind">Típusa?</label>\
					<select id="kind"></select></li>\
					<br />\
					<li><label for="otherParty">Kitől? </label>\
					<input type="text" required id="otherParty"></li>\
					\
					<li><label class="grayed" for="comment">Megjegyzés?</label>\
					<input id="comment"></li>\
				</ul>\
				<p class="grayed" id="saveAlt">\
				Mentéshez előbb töltsd ki a sárgás mezőket megfelelően!</p>\
				<button type="button" id="save" disabled>Mentés</button>\
			</form>', "Bevétel könyvelése:")

		$('select#kind, label[for="kind"]').hide()
		var choices = '<option disabled>Válassz!</option>\n<option disabled></option>\n'
		for (var i = 0; i < sourceOptions.length; i++) {
			choices += '<option value="'+sourceOptions[i]+'">'+sourceOptions[i]+'</option>\n'
		}
		$('select#source').html(choices)

		$('#source').change(function() {
			var val = $(this).attr('value')
					chices = '<option disabled>Válassz!</option>\n<option disabled></option>\n'
			for (var i = 0; i < kindOptions[val].length; i++) {
				chices += '<option value="'+kindOptions[val][i]+'">'+kindOptions[val][i]+'</option>\n'
			}
			$('select#kind').html(chices)
			$('select#kind, label[for="kind"]').show()
		})

		transaction.time = Date.parse(
			$("input#date").attr("value", $("input#date").attr("max"))
				.change(function() {
					if (Date.parse($(this).attr("value")) != 100000*transaction.time) {
						transaction.time = Date.parse($(this).attr("value"))/100000};
			}).attr("value")
		)/100000

		$('input#otherParty, input#money, input#comment,'+
			'select#source, select#kind').bind('change keyup', function() {
			if ($(this).attr("value").length > 0) {
				transaction[$(this).attr("id")] = $(this).attr("value")
			}else{
				delete transaction[$(this).attr("id")]
			}
			if ($('form:has(:invalid)').length == 0) {
				$('button#save').removeAttr('disabled')
				$('#saveAlt').hide()
			}else{
				$('button#save').attr('disabled',1)
				$('#saveAlt').show()
			}
		})

		$('button#save').click(function() {
			updatePane("","Mentés folyamantban...")
			transaction.addTime = Math.round(new Date()/1000)
			save()
		})
	})

	$('button#outcome').click(function(){
		transaction.type = "outcome"

		var fields=[ // do this as such
			{}
		]
		productUnits = ["adag", "ampulla", "csomag", "darab", "doboz", "fiola", "flakon", "g", "gombót", "henger", "hordó", "kanna", "kapszula", "karton", "készlet", "kg", "konténer", "köteg", "láda", "lap", "levél", "liter", "ml", "palack", "pár", "pohár", "raklap", "rekesz", "rolni", "szál", "szelet", "szem", "szett", "tábla", "tabletta", "tálca", "tartály", "tasak", "tégely", "tekercs", "tubus", "üveg", "vödör", "zacskó", "zsák"]
		serviceUnits = ["alkalom", "év", "hét", "hónap", "köbméter", "KWh", "nap", "óra", "perc", "út"]

		updatePane('<button id="service">Szolgáltatás</button>\
			<button id="product">Termék</button>\n',
			"Termék, vagy szolgáltatás?"
		)

		$('button#service').click(function() {
			updatePane('\
				<form class="outcome">\
					<ul class="form">\
						<li><label for="time">Mikor? </label>\
						<input required type="date" max="'+formatDate(null, "-")+'" id="date"></li>\
						<br />\
						<li><label for="service-name">Megnevezése? </label>\
						<input type="text" required id="service-name"></li>\
						<br />\
						<li><label for="qty">Mennyiség? </label>\
						<input class="short" type="number" min="1" required id="qty" value="1">\
						<select id="unit"></select></li>\
						<br />\
						<li><label for="money">Összár? </label>\
						<input type="number" required id="money" min="1"> Ft</li>\
					  \
					  <li><label for="unitValue">Egyég-ára: </label>\
						<input readonly type="text" id="unitValue"></li>\
						<br />\
						<li><label for="service-provider-name">Szolgáltató? </label>\
						<input type="text" id="service-provider-name"></li>\
						<li><label for="service-provider-email">Email címe? </label>\
						<input type="text" id="service-provider-email"></li>\
						<li><label for="service-provider-web">Webcíme? </label>\
						<input type="text" id="service-provider-web"></li>\
						<br />\
						<li><label class="grayed" for="comment">Megjegyzés?</label>\
						<input id="comment"></li>\
					</ul>\
					<p class="grayed" id="saveAlt">\
					Mentéshez előbb töltsd ki a sárgás mezőket megfelelően!</p>\
					<button type="button" id="save" disabled>Mentés</button>\
				</form>', 'Szolgáltatás vásárlását könyvelem: '
			)

			var choices = '<option disabled>Válassz!</option>\n<option disabled></option>\n'
			for (var i = 0; i < serviceUnits.length; i++) {
				choices += '<option value="'+serviceUnits[i]+'">'+serviceUnits[i]+'</option>\n'
			}
			$('select#unit').html(choices)

			transaction.time = Date.parse(
			$("input#date").attr("value", $("input#date").attr("max"))
				.change(function() {
					if (Date.parse($(this).attr("value")) != 100000*transaction.time) {
						transaction.time = Date.parse($(this).attr("value"))/100000
					};
				}).attr("value")
			)/100000

			$('input#qty, select#unit, input#money').change(function() {
				var qty = $('input#qty').attr('value') 
						unit = $('select#unit').attr('value')
						money = $('input#money').attr('value')

				if ($('#qty:invalid').length == 0
						&& unit != "Válassz!"
						&& $('#money:invalid').length == 0 ) {
					$('input#unitValue').attr('value', Math.round(money/qty)+" Ft/"+unit)
				}else{
					$('input#unitValue').attr('value', "")
				}
			})

			$('form.outcome').change(function() {
				if ($('form:has(:invalid)').length == 0) {
					$('button#save').removeAttr('disabled')
					$('#saveAlt').hide()
				}else{
					$('button#save').attr('disabled',1)
					$('#saveAlt').show()
				}
			})
			
		})

		$('button#product').click(function() {
			updatePane('\
				<form class="outcome">\
					<ul class="form">\
						<li><label for="time">Mikor? </label>\
						<input required type="date" max="'+formatDate(null, "-")+'" id="date"></li>\
						<br />\
						<li><label for="product-name">Megnevezése? </label>\
						<input type="text" required id="product-name"></li>\
						\
						<li><label class="grayed" for="similar">RokonTermék? </label>\
						<input id="similar"></li>\
						<br />\
						<li><label for="qty">Mennyiség? </label>\
						<input class="short" type="number" min="1" required id="qty" value="1">\
						<select id="unit"></select></li>\
						<br />\
						<li><label for="money">Összár? </label>\
						<input type="number" required id="money" min="1"> Ft</li>\
					  \
					  <li><label for="unitValue">Egyég-ára: </label>\
						<input readonly type="text" id="unitValue"></li>\
					  <br />\
						<li><label for="product-category">Termék típus? </label>\
						<input type="text" id="product-category"></li>\
						<li><label for="product-family">Termék főtípus? </label>\
						<input type="text" id="product-family"></li>\
						<br />\
						<li><label for="product-manufacturer-name">Gyártó? </label>\
						<input type="text" id="product-manufacturer-name"></li>\
						<li><label for="product-manufacturer-email">Email címe? </label>\
						<input type="text" id="product-manufacturer-email"></li>\
						<li><label for="product-manufacturer-web">Webcíme? </label>\
						<input type="text" id="product-manufacturer-web"></li>\
						<br />\
						<li><label class="grayed" for="comment">Megjegyzés?</label>\
						<input id="comment"></li>\
					</ul>\
					<p class="grayed" id="saveAlt">\
					Mentéshez előbb töltsd ki a sárgás mezőket megfelelően!</p>\
					<button type="button" id="save" disabled>Mentés</button>\
				</form>', 'Termék vásárlását könyvelem: '
			)

			var choices = '<option disabled>Válassz!</option>\n<option disabled></option>\n'
			for (var i = 0; i < productUnits.length; i++) {
				choices += '<option value="'+productUnits[i]+'">'+productUnits[i]+'</option>\n'
			}
			$('select#unit').html(choices)

			transaction.time = Date.parse(
			$("input#date").attr("value", $("input#date").attr("max"))
				.change(function() {
					if (Date.parse($(this).attr("value")) != 100000*transaction.time) {
						transaction.time = Date.parse($(this).attr("value"))/100000
					};
				}).attr("value")
			)/100000

			$('input#qty, select#unit, input#money').change(function() {
				var qty = $('input#qty').attr('value') 
						unit = $('select#unit').attr('value')
						money = $('input#money').attr('value')

				if ($('#qty:invalid').length == 0
						&& unit != "Válassz!"
						&& $('#money:invalid').length == 0 ) {
					if ((money/qty)%1 > 0) {
						about = '~ '
					}else{
						about = ""
					}
					$('input#unitValue').attr('value', about+(Math.round(money/qty))+" Ft/"+unit)
				}else{
					$('input#unitValue').attr('value', "")
				}
			})

			$('.topPane input:not(#date), .topPane select').change(function() {
				var path = $(this).attr("id").split('-')
				if ($(this).attr("value").length > 0) {
					setNestedJSON(transaction, path, $(this).attr("value"))
				}else{
					deleteNestedJSON(transaction, path)

					// TODO: Move this to just before saving #optimisation
					cleanNestedJSON(transaction)
				}
				console.log(JSON.stringify(transaction))

				if ($('form:has(:invalid)').length == 0) {
					$('button#save').removeAttr('disabled')
					$('#saveAlt').hide()
				}else{
					$('button#save').attr('disabled',1)
					$('#saveAlt').show()
				}
			})
		})
	})
}

function setNestedJSON (on, path, value) {
	if (!(path instanceof Array)) {
		path = path.split('\-');
	}

	if (path && path.length > 0) {
		var current = on;
		var key = null;

		while((key = path.shift()) != null) {
			// make sure key exists at the current level
			if (!current[key]) {
				current[key] = {};
			}
			if (path.length == 0) {
				// last level, set value
				current[key] = value;
				return true;
			}
			// advance one level
			current = current[key];
		}
	}
	return false;
}
function deleteNestedJSON (on, path) { // TODO....
	if (!(path instanceof Array)) {
		path = path.split('\-');
	}


	if (path && path.length > 0) {
		if (path.length == 1) {
			delete on[path[0]]
		}
		if (on[path[0]] instanceof Object) { 
			deleteNestedJSON(on[path[0]], path.slice(1))
		}
	}
}
function cleanNestedJSON (obj) {
	if (obj instanceof Object) {
		var keys = Object.keys(obj)
		for (var i = keys.length - 1; i >= 0; i--) {
			if (obj[keys[i]] instanceof Object) {
				cleanNestedJSON(obj[keys[i]])
				if (Object.keys(obj[keys[i]]).length === 0) {
					delete obj[keys[i]]
				}
			}
		}
	}
}

/*function addRecord () {
	$('form#dataInput').bind('keyup', function() {console.log($(this))})
}*/

function options () {
	$('form#settings input').change(function() {
		var t = $(this)
				id = t.attr("id")
				s = settings.render

		if (id == "sentenceDetail" && s.sentenceDetail != t.val()) {	
			$('.hl0, .hl1, .hl2, .hl3').show()
			$('.hl'+ (s.sentenceDetail = t.val()) ).hide()
		}
		
		if (id == "unitPrice" || id == "date") {
			s[id] = t.attr("checked")
			if (t.attr("checked")) {
				$('li.data .'+id).show()
			}else{
				$('li.data .'+id).hide()
			}
		}

		if (id == "date") {
			
		}

	})
}

function createPane (title, subTitle, content, whereToBack) {
	content = content || ""
	subTitle = subTitle || ""
	whereToBack = whereToBack || ""
	$('.topPane').remove()
	$('body').append('<div class="topPane">\
		<div class="header">\
		<button class="back" onclick="'+whereToBack+'"><</button>\
		<h2>'+title+'</h2>\
		<button class="close" what=".topPane">X</button>\
		</div>\
		<p class="subtitle">'+subTitle+'</p>\
		<span class="content">'+content+'</span>\
		</div>')
}

function updatePane (content, subtitle, title) {
	if (content) { $('.topPane>span.content').html(content) }
	if (subtitle) { $('.topPane>p.subtitle').html(subtitle) }
	if (title) { $('.topPane>div.header>h2').html(title) }
}

/*\
 *	Extensions
\*/

function import (loc) {
	document.write('<script type="text/javascript" src="'+loc+'"></script>')
}

function next() {
	if (typeof fnStack[0] == 'function') {
		fnStack[0].call()
		for (var i = 0; i < fnStack.length-1; i++) {
			fnStack[i] = fnStack[i+1]
		}
		fnStack.length--
	}else{
		return false
	}
}

// Custom event handler
var evt = {
	pairs: {},
	on: function (name, fn) {
		this.pairs[name] = this.pairs[name] || []
		this.pairs[name].push(fn)
	},

	del: function (argument) {
		console.log("delEvent: Comming soon...")
		return false
	},

	fire: function (evt) {
		if (this.pairs[evt]) {
			for (var i = 0; i < this.pairs[evt].length; i++) {
				this.pairs[evt][i].call()
			}
		}else{
			return false
		}
	}
}

function formatDate(inpDate, s) {
	s = s || "." // separator
	inpDate = inpDate || new Date()/100000
	inpDate *= 100000
	
	var year = 1900+new Date(inpDate).getYear()
			month = new Date(inpDate).getMonth()+1
			date = new Date(inpDate).getDate()
	
	if (month < 10) { month = "0"+month };
	if (date < 10) { date = "0"+date };
	return ''+ year +s+ month +s+ date
}
function formatDateTime(inpDate) {
	inpDate = inpDate || new Date()/1000
	inpDate *= 1000
	var year = 1900+new Date(inpDate).getYear()
			month = new Date(inpDate).getMonth()+1
			date = new Date(inpDate).getDate()
			hour = new Date(inpDate).getHours()
			min = new Date(inpDate).getMinutes()
			sec = new Date(inpDate).getSeconds()
	if (month < 10) { month = "0"+month };
	if (date < 10) { date = "0"+date };
	//if (hour < 10) { hour = "0"+hour };
	if (min < 10) { min = "0"+min };
	if (sec < 10) { sec = "0"+sec };
	return year+'.'+
				 month+'.'+
				 date+' '+
				 hour+':'+
				 min+':'+
				 sec
}